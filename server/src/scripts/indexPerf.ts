import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import type { QueryFilter } from 'mongoose';
import { Product } from '../modules/products/product.model';
import type { IProduct } from '../modules/products/product.model';

/**
 * Measures catalogue query plans against a throwaway database.
 * Run with `npm run perf:indexes`. The script only ever touches the
 * `ecommerce_perf` database, which it drops when it finishes.
 */

const SAMPLE_SIZE = 5000;
const CATEGORY_COUNT = 20;

interface ExplainStage {
  stage?: string;
  indexName?: string;
  inputStage?: ExplainStage;
}

interface ExplainResult {
  queryPlanner?: { winningPlan?: ExplainStage };
  executionStats?: {
    nReturned?: number;
    totalKeysExamined?: number;
    totalDocsExamined?: number;
    executionTimeMillis?: number;
  };
}

interface Benchmark {
  name: string;
  filter: QueryFilter<IProduct>;
  sort: Record<string, 1 | -1>;
  limit: number;
}

function resolvePerfUri(): string {
  if (process.env.PERF_MONGODB_URI) {
    return process.env.PERF_MONGODB_URI;
  }

  const base = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ecommerce_perf';

  try {
    const url = new URL(base);
    url.pathname = '/ecommerce_perf';
    return url.toString();
  } catch {
    return 'mongodb://127.0.0.1:27017/ecommerce_perf';
  }
}

function findIndex(stage: ExplainStage | undefined): string {
  let current = stage;

  while (current) {
    if (current.indexName) {
      return current.indexName;
    }
    current = current.inputStage;
  }

  return 'none (COLLSCAN)';
}

function buildBenchmarks(categoryId: Types.ObjectId): Benchmark[] {
  return [
    { name: 'newest products', filter: { isActive: true }, sort: { createdAt: -1 }, limit: 20 },
    { name: 'price ascending', filter: { isActive: true }, sort: { price: 1 }, limit: 20 },
    { name: 'top rated', filter: { isActive: true }, sort: { ratingAvg: -1 }, limit: 20 },
    {
      name: 'category + price',
      filter: { isActive: true, categoryId },
      sort: { price: 1 },
      limit: 20,
    },
    {
      name: 'low stock dashboard',
      filter: { isActive: true, stock: { $lte: 10 } },
      sort: { stock: 1 },
      limit: 8,
    },
  ];
}

interface PerfDataset {
  documents: IProduct[];
  categoryId: Types.ObjectId;
}

function buildDocuments(): PerfDataset {
  const categoryIds = Array.from({ length: CATEGORY_COUNT }, () => new Types.ObjectId());
  // Category 0 only holds inactive rows (index % 20 === 0), so benchmark a category that matches.
  const primaryCategoryId = categoryIds[1];

  if (!primaryCategoryId) {
    throw new Error('No category ids were generated');
  }

  const documents = Array.from({ length: SAMPLE_SIZE }, (_, index) => ({
    name: `Perf Product ${index}`,
    slug: `perf-product-${index}`,
    description: `Synthetic catalogue row ${index} used by the index benchmark script.`,
    price: 10000 + ((index * 7919) % 500000),
    categoryId: categoryIds[index % CATEGORY_COUNT] as Types.ObjectId,
    images: [],
    stock: (index * 13) % 250,
    ratingAvg: Number(((index * 37) % 50) / 10),
    ratingCount: (index * 3) % 400,
    isActive: index % 20 !== 0,
    createdAt: new Date(Date.now() - index * 60_000),
    updatedAt: new Date(),
  })) as IProduct[];

  return { documents, categoryId: primaryCategoryId };
}

async function runBenchmark(benchmark: Benchmark): Promise<ExplainResult> {
  const result = (await Product.find(benchmark.filter)
    .sort(benchmark.sort)
    .limit(benchmark.limit)
    .explain('executionStats')) as unknown;

  return result as ExplainResult;
}

const COLUMN_WIDTHS = [28, 36, 8, 8, 10, 6] as const;

function report(title: string, rows: Array<{ benchmark: string; plan: ExplainResult }>): void {
  console.log(`\n${title}`);
  console.log('─'.repeat(104));
  console.log(
    ['query', 'index', 'keys', 'docs', 'returned', 'ms']
      .map((heading, index) => heading.padEnd(COLUMN_WIDTHS[index] ?? 8))
      .join(''),
  );

  for (const row of rows) {
    const stats = row.plan.executionStats;
    console.log(
      [
        row.benchmark.padEnd(28),
        findIndex(row.plan.queryPlanner?.winningPlan).padEnd(36),
        String(stats?.totalKeysExamined ?? 0).padEnd(8),
        String(stats?.totalDocsExamined ?? 0).padEnd(8),
        String(stats?.nReturned ?? 0).padEnd(10),
        String(stats?.executionTimeMillis ?? 0).padEnd(6),
      ].join(''),
    );
  }
}

async function main(): Promise<void> {
  const uri = resolvePerfUri();

  if (!/ecommerce_perf/.test(uri)) {
    throw new Error('Refusing to run: the benchmark database name must contain ecommerce_perf');
  }

  await mongoose.connect(uri, { autoIndex: false });
  console.log(`Benchmark database: ${mongoose.connection.name}`);

  try {
    await mongoose.connection.dropDatabase();
    const { documents, categoryId } = buildDocuments();

    await Product.insertMany(documents);
    console.log(`Inserted ${SAMPLE_SIZE} synthetic products`);

    const benchmarks = buildBenchmarks(categoryId);

    const warmUp = async (): Promise<void> => {
      for (const benchmark of benchmarks) {
        await runBenchmark(benchmark);
      }
    };

    await Product.collection.dropIndexes().catch(() => undefined);
    await warmUp();
    const before = [];

    for (const benchmark of benchmarks) {
      before.push({ benchmark: benchmark.name, plan: await runBenchmark(benchmark) });
    }

    report('Before (no secondary indexes)', before);

    await Product.syncIndexes();
    await warmUp();
    const after = [];

    for (const benchmark of benchmarks) {
      after.push({ benchmark: benchmark.name, plan: await runBenchmark(benchmark) });
    }

    report('After (declared indexes)', after);

    const textResult = (await Product.find({ $text: { $search: 'synthetic' } })
      .limit(20)
      .explain('executionStats')) as unknown as ExplainResult;
    report('Text search', [{ benchmark: 'text search', plan: textResult }]);
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    console.log('\nDropped the benchmark database.');
  }
}

main().catch((error) => {
  console.error('Index benchmark failed:', error);
  process.exit(1);
});

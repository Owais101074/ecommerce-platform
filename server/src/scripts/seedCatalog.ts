import { connectDB, disconnectDB } from '../config/db';
import { Category } from '../modules/categories/category.model';
import { Product } from '../modules/products/product.model';
import { slugify } from '../utils/slug';

const catalog = [
  {
    category: {
      name: 'Electronics',
      description: 'Phones, audio, computers and everyday accessories.',
    },
    products: [
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with silent clicks and long battery life.',
        price: 129900,
        stock: 40,
        images: [
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=80',
        ],
      },
      {
        name: 'Mechanical Keyboard',
        description: 'Tenkeyless mechanical keyboard with tactile switches and white backlight.',
        price: 349900,
        stock: 25,
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',
        ],
      },
    ],
  },
  {
    category: {
      name: 'Fashion',
      description: 'Everyday clothing and accessories for men and women.',
    },
    products: [
      {
        name: 'Cotton T-Shirt',
        description: 'Soft breathable cotton t-shirt with a relaxed fit and durable stitching.',
        price: 79900,
        stock: 120,
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
        ],
      },
      {
        name: 'Canvas Backpack',
        description:
          'Water-resistant canvas backpack with a padded laptop sleeve and side pockets.',
        price: 189900,
        stock: 35,
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
        ],
      },
    ],
  },
  {
    category: {
      name: 'Home',
      description: 'Useful and decorative essentials for every room.',
    },
    products: [
      {
        name: 'Ceramic Mug',
        description:
          'Hand-finished ceramic mug that keeps drinks warm and feels comfortable to hold.',
        price: 49900,
        stock: 80,
        images: [
          'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80',
        ],
      },
      {
        name: 'Desk Lamp',
        description: 'Adjustable LED desk lamp with three brightness levels and a flexible neck.',
        price: 159900,
        stock: 0,
        images: [
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
        ],
      },
    ],
  },
];

async function main(): Promise<void> {
  await connectDB();

  try {
    let categoriesCreated = 0;
    let productsCreated = 0;

    for (const entry of catalog) {
      const categorySlug = slugify(entry.category.name);
      let category = await Category.findOne({ slug: categorySlug });

      if (!category) {
        category = await Category.create({
          name: entry.category.name,
          slug: categorySlug,
          description: entry.category.description,
        });
        categoriesCreated += 1;
      }

      for (const item of entry.products) {
        const productSlug = slugify(item.name);
        const exists = await Product.exists({ slug: productSlug });

        if (!exists) {
          await Product.create({
            ...item,
            slug: productSlug,
            categoryId: category._id,
          });
          productsCreated += 1;
        }
      }
    }

    console.log(
      `Catalog seeded: ${categoriesCreated} categories and ${productsCreated} products created.`,
    );
  } finally {
    await disconnectDB();
  }
}

void main().catch(async (error) => {
  console.error('[seed:catalog] Failed:', error);
  await disconnectDB();
  process.exitCode = 1;
});

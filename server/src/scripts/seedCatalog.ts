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
        images: ['https://picsum.photos/seed/wireless-mouse/600/600'],
      },
      {
        name: 'Mechanical Keyboard',
        description: 'Tenkeyless mechanical keyboard with tactile switches and white backlight.',
        price: 349900,
        stock: 25,
        images: ['https://picsum.photos/seed/mechanical-keyboard/600/600'],
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
        images: ['https://picsum.photos/seed/cotton-tshirt/600/600'],
      },
      {
        name: 'Canvas Backpack',
        description:
          'Water-resistant canvas backpack with a padded laptop sleeve and side pockets.',
        price: 189900,
        stock: 35,
        images: ['https://picsum.photos/seed/canvas-backpack/600/600'],
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
        images: ['https://picsum.photos/seed/ceramic-mug/600/600'],
      },
      {
        name: 'Desk Lamp',
        description: 'Adjustable LED desk lamp with three brightness levels and a flexible neck.',
        price: 159900,
        stock: 0,
        images: ['https://picsum.photos/seed/desk-lamp/600/600'],
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

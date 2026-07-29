import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();

  const productTitles = [
    'Everyday Tee',
    'Classic Hoodie',
    'Slim Jeans',
    'Relaxed Chinos',
    'Bomber Jacket',
    'Summer Dress',
    'Denim Jacket',
    'Crewneck Sweater',
    'Linen Shirt',
    'Sport Shorts'
  ];

  const colors = ['Black', 'White', 'Navy', 'Olive', 'Maroon'];

  for (let i = 0; i < productTitles.length; i++) {
    const p = await prisma.product.create({
      data: {
        title: productTitles[i],
        slug: productTitles[i].toLowerCase().replace(/\s+/g, '-'),
        description: `${productTitles[i]} — stylish and comfortable.`,
        images: ['/images/placeholder.jpg']
      }
    });

    for (let c = 0; c < colors.length; c++) {
      const sku = `P${p.id}-${c + 1}`;
      const price = 2500 + i * 500;
      await prisma.variant.create({
        data: {
          sku,
          color: colors[c],
          price,
          inventory: 50,
          productId: p.id
        }
      });
    }
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

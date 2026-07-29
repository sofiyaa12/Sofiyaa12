import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const products = await prisma.product.findMany({ include: { variants: true }, orderBy: { id: 'asc' } });
  res.status(200).json(products);
}

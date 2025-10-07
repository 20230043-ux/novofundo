import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/db';
import { desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const sdgs = await db.query.sdgs.findMany({
      orderBy: (sdgs, { asc }) => [asc(sdgs.number)],
    });

    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800');
    return res.status(200).json(sdgs);
  } catch (error) {
    console.error('Get SDGs error:', error);
    return res.status(500).json({ message: 'Erro ao buscar ODS' });
  }
}

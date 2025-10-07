import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const projects = await db.query.projects.findMany({
      with: {
        sdg: true,
        updates: {
          orderBy: (updates, { desc }) => [desc(updates.createdAt)],
          limit: 3,
        },
      },
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });

    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json({ message: 'Erro ao buscar projetos' });
  }
}

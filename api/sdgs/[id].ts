import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { id } = req.query;
    const sdgId = parseInt(id as string);

    if (isNaN(sdgId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const sdg = await db.query.sdgs.findFirst({
      where: (sdgs, { eq }) => eq(sdgs.id, sdgId),
      with: {
        projects: {
          orderBy: (projects, { desc }) => [desc(projects.createdAt)],
        },
      },
    });

    if (!sdg) {
      return res.status(404).json({ message: 'ODS não encontrado' });
    }

    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json(sdg);
  } catch (error) {
    console.error('Get SDG error:', error);
    return res.status(500).json({ message: 'Erro ao buscar ODS' });
  }
}

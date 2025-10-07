import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { id } = req.query;
    const projectId = parseInt(id as string);

    if (isNaN(projectId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const project = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.id, projectId),
      with: {
        sdg: true,
        updates: {
          orderBy: (updates, { desc }) => [desc(updates.createdAt)],
        },
        investments: {
          with: {
            company: {
              with: {
                user: true,
              },
            },
            individual: {
              with: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }

    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json(project);
  } catch (error) {
    console.error('Get project error:', error);
    return res.status(500).json({ message: 'Erro ao buscar projeto' });
  }
}

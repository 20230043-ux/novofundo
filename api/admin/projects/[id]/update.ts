import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdmin, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { db } from '../../../lib/db';
import { projects } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { triggerEvent } from '../../../lib/pusher';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { id } = req.query;
    const projectId = parseInt(id as string);

    if (isNaN(projectId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const [updatedProject] = await db
      .update(projects)
      .set(req.body)
      .where(eq(projects.id, projectId))
      .returning();

    if (!updatedProject) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }

    await triggerEvent('projects', 'updated', {
      projectId: updatedProject.id,
      project: updatedProject,
    });

    return res.status(200).json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({ message: 'Erro ao atualizar projeto' });
  }
}

export default withAdmin(handler);

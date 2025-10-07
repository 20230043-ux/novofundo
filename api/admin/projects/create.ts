import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdmin, AuthenticatedRequest } from '../../lib/auth-middleware';
import { db } from '../../lib/db';
import { projects, projectInsertSchema } from '@shared/schema';
import { triggerEvent } from '../../lib/pusher';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const validatedData = projectInsertSchema.parse(req.body);
    const [newProject] = await db.insert(projects).values(validatedData).returning();

    await triggerEvent('projects', 'created', {
      projectId: newProject.id,
      project: newProject,
    });

    return res.status(201).json(newProject);
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ message: 'Erro ao criar projeto' });
  }
}

export default withAdmin(handler);

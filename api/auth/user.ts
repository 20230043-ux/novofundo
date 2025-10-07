import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/auth-middleware';
import { db } from '../lib/db';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, req.user!.userId),
      with: {
        company: true,
        individual: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const { password, ...userWithoutPassword } = user;

    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
}

export default withAuth(handler);

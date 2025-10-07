import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCompany, AuthenticatedRequest } from '../lib/auth-middleware';
import { db } from '../lib/db';
import { companies } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, req.user!.userId),
        with: {
          company: true,
        },
      });

      if (!user?.company) {
        return res.status(404).json({ message: 'Perfil não encontrado' });
      }

      return res.status(200).json(user.company);
    } catch (error) {
      console.error('Get company profile error:', error);
      return res.status(500).json({ message: 'Erro ao buscar perfil' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, req.user!.userId),
        with: { company: true },
      });

      if (!user?.company) {
        return res.status(404).json({ message: 'Perfil não encontrado' });
      }

      const [updatedCompany] = await db
        .update(companies)
        .set(req.body)
        .where(eq(companies.id, user.company.id))
        .returning();

      return res.status(200).json(updatedCompany);
    } catch (error) {
      console.error('Update company profile error:', error);
      return res.status(500).json({ message: 'Erro ao atualizar perfil' });
    }
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export default withCompany(handler);

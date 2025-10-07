import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCompany, AuthenticatedRequest } from '../lib/auth-middleware';
import { db } from '../lib/db';
import { paymentProofs, paymentProofInsertSchema } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, req.user!.userId),
        with: { company: true },
      });

      if (!user?.company) {
        return res.status(404).json({ message: 'Empresa não encontrada' });
      }

      const proofs = await db.query.paymentProofs.findMany({
        where: (proofs, { eq }) => eq(proofs.companyId, user.company!.id),
        orderBy: [desc(paymentProofs.uploadDate)],
        with: {
          sdg: true,
        },
      });

      return res.status(200).json(proofs);
    } catch (error) {
      console.error('Get payment proofs error:', error);
      return res.status(500).json({ message: 'Erro ao buscar comprovantes' });
    }
  }

  if (req.method === 'POST') {
    try {
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, req.user!.userId),
        with: { company: true },
      });

      if (!user?.company) {
        return res.status(404).json({ message: 'Empresa não encontrada' });
      }

      const validatedData = paymentProofInsertSchema.parse({
        ...req.body,
        companyId: user.company.id,
      });

      const [newProof] = await db.insert(paymentProofs).values(validatedData).returning();

      return res.status(201).json(newProof);
    } catch (error) {
      console.error('Create payment proof error:', error);
      return res.status(500).json({ message: 'Erro ao criar comprovante' });
    }
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export default withCompany(handler);

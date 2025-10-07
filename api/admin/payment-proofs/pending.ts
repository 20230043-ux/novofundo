import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdmin, AuthenticatedRequest } from '../../lib/auth-middleware';
import { db } from '../../lib/db';
import { desc } from 'drizzle-orm';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const pendingProofs = await db.query.paymentProofs.findMany({
      where: (proofs, { eq }) => eq(proofs.status, 'pending'),
      orderBy: (proofs) => [desc(proofs.uploadDate)],
      with: {
        company: {
          with: {
            user: true,
          },
        },
        sdg: true,
      },
    });

    return res.status(200).json(pendingProofs);
  } catch (error) {
    console.error('Get pending payment proofs error:', error);
    return res.status(500).json({ message: 'Erro ao buscar comprovantes pendentes' });
  }
}

export default withAdmin(handler);

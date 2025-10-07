import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdmin, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { db } from '../../../lib/db';
import { paymentProofs, investments } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { triggerEvent } from '../../../lib/pusher';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { id } = req.query;
    const proofId = parseInt(id as string);
    const { status, sdgId } = req.body;

    if (isNaN(proofId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const proof = await db.query.paymentProofs.findFirst({
      where: (proofs, { eq }) => eq(proofs.id, proofId),
      with: {
        company: true,
      },
    });

    if (!proof) {
      return res.status(404).json({ message: 'Comprovante não encontrado' });
    }

    const [updatedProof] = await db
      .update(paymentProofs)
      .set({
        status,
        sdgId: sdgId || proof.sdgId,
        reviewedAt: new Date(),
      })
      .where(eq(paymentProofs.id, proofId))
      .returning();

    if (status === 'approved' && sdgId) {
      await db.insert(investments).values({
        companyId: proof.companyId,
        sdgId: sdgId,
        amount: proof.amount.toString(),
        paymentProofId: proof.id,
      });

      await triggerEvent('payment-proofs', 'approved', {
        proofId: updatedProof.id,
        companyId: proof.companyId,
        amount: proof.amount,
      });
    }

    return res.status(200).json(updatedProof);
  } catch (error) {
    console.error('Approve payment proof error:', error);
    return res.status(500).json({ message: 'Erro ao aprovar comprovante' });
  }
}

export default withAdmin(handler);

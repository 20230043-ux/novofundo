import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdmin, AuthenticatedRequest } from '../lib/auth-middleware';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const [companiesCount] = await db.execute(
      sql`SELECT COUNT(*) as count FROM companies`
    );
    
    const [individualsCount] = await db.execute(
      sql`SELECT COUNT(*) as count FROM individuals`
    );
    
    const [projectsCount] = await db.execute(
      sql`SELECT COUNT(*) as count FROM projects`
    );
    
    const [investmentsTotal] = await db.execute(
      sql`SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total FROM investments`
    );
    
    const [pendingProofsCount] = await db.execute(
      sql`SELECT COUNT(*) as count FROM payment_proofs WHERE status = 'pending'`
    );

    const stats = {
      companies: Number(companiesCount.rows[0]?.count || 0),
      individuals: Number(individualsCount.rows[0]?.count || 0),
      projects: Number(projectsCount.rows[0]?.count || 0),
      totalInvestments: Number(investmentsTotal.rows[0]?.total || 0),
      pendingProofs: Number(pendingProofsCount.rows[0]?.count || 0),
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
}

export default withAdmin(handler);

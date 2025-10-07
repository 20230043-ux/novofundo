import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCompany, AuthenticatedRequest } from '../lib/auth-middleware';
import { db } from '../lib/db';
import { consumptionRecords, consumptionRecordInsertSchema } from '@shared/schema';
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

      const records = await db.query.consumptionRecords.findMany({
        where: (records, { eq }) => eq(records.companyId, user.company!.id),
        orderBy: [desc(consumptionRecords.recordDate)],
      });

      return res.status(200).json(records);
    } catch (error) {
      console.error('Get consumption records error:', error);
      return res.status(500).json({ message: 'Erro ao buscar registros' });
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

      const validatedData = consumptionRecordInsertSchema.parse({
        ...req.body,
        companyId: user.company.id,
      });

      const [newRecord] = await db.insert(consumptionRecords).values(validatedData).returning();

      return res.status(201).json(newRecord);
    } catch (error) {
      console.error('Create consumption record error:', error);
      return res.status(500).json({ message: 'Erro ao criar registro' });
    }
  }

  return res.status(405).json({ message: 'Método não permitido' });
}

export default withCompany(handler);

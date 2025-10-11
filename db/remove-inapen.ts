
import { db } from "./index";
import { users, companies, consumptionRecords, paymentProofs, investments } from "@shared/schema";
import { eq } from "drizzle-orm";

async function removeInapen() {
  try {
    console.log("🗑️ Removendo INAPEN do sistema...");
    
    // 1. Encontrar a empresa INAPEN
    const inapenCompany = await db.query.companies.findFirst({
      where: (companies, { ilike }) => ilike(companies.name, '%INAPEN%'),
      with: {
        user: true
      }
    });
    
    if (!inapenCompany) {
      console.log("⚠️ INAPEN não encontrado no sistema");
      return;
    }
    
    console.log(`✅ INAPEN encontrado: ${inapenCompany.name} (ID: ${inapenCompany.id})`);
    
    // 2. Deletar investimentos relacionados
    const deletedInvestments = await db.delete(investments)
      .where(eq(investments.companyId, inapenCompany.id))
      .returning();
    console.log(`🗑️ ${deletedInvestments.length} investimentos removidos`);
    
    // 3. Deletar comprovantes de pagamento
    const deletedProofs = await db.delete(paymentProofs)
      .where(eq(paymentProofs.companyId, inapenCompany.id))
      .returning();
    console.log(`🗑️ ${deletedProofs.length} comprovantes de pagamento removidos`);
    
    // 4. Deletar registros de consumo
    const deletedConsumption = await db.delete(consumptionRecords)
      .where(eq(consumptionRecords.companyId, inapenCompany.id))
      .returning();
    console.log(`🗑️ ${deletedConsumption.length} registros de consumo removidos`);
    
    // 5. Deletar a empresa
    await db.delete(companies)
      .where(eq(companies.id, inapenCompany.id));
    console.log(`🗑️ Empresa INAPEN removida`);
    
    // 6. Deletar o usuário associado
    if (inapenCompany.userId) {
      await db.delete(users)
        .where(eq(users.id, inapenCompany.userId));
      console.log(`🗑️ Usuário INAPEN removido (ID: ${inapenCompany.userId})`);
    }
    
    console.log("✅ INAPEN removido completamente do sistema!");
    
  } catch (error) {
    console.error("❌ Erro ao remover INAPEN:", error);
    throw error;
  }
}

removeInapen()
  .then(() => {
    console.log("🎉 Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro no processo:", error);
    process.exit(1);
  });

import { db } from '../db/index';
import { users, companies, individuals, projects, sdgs, investments, paymentProofs } from '../shared/schema';
import { writeFileSync } from 'fs';

async function backupCurrentData() {
  console.log('📦 Fazendo backup dos dados atuais...');
  
  const backup = {
    timestamp: new Date().toISOString(),
    data: {
      users: await db.select().from(users),
      companies: await db.select().from(companies),
      individuals: await db.select().from(individuals),
      projects: await db.select().from(projects),
      sdgs: await db.select().from(sdgs),
      investments: await db.select().from(investments),
      paymentProofs: await db.select().from(paymentProofs)
    }
  };

  writeFileSync('migration-backup.json', JSON.stringify(backup, null, 2));
  
  console.log('✅ Backup criado: migration-backup.json');
  console.log('\nTotais:');
  console.log('- Usuários:', backup.data.users.length);
  console.log('- Empresas:', backup.data.companies.length);
  console.log('- Pessoas:', backup.data.individuals.length);
  console.log('- Projetos:', backup.data.projects.length);
  console.log('- SDGs:', backup.data.sdgs.length);
  console.log('- Investimentos:', backup.data.investments.length);
  console.log('- Comprovantes:', backup.data.paymentProofs.length);
  
  return backup;
}

backupCurrentData()
  .then(() => {
    console.log('\n✅ Backup concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao fazer backup:', error);
    process.exit(1);
  });

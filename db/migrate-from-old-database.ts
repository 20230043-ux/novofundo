import { Pool } from 'pg';
import { db } from './index.js';
import * as schema from '../shared/schema.js';
import { sql } from 'drizzle-orm';

const OLD_DATABASE_URL = 'postgresql://neondb_owner:npg_nJGo5QxY0Tmj@ep-still-cake-a2rn3vlh-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const oldPool = new Pool({
  connectionString: OLD_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateData() {
  console.log('🔄 Starting data migration from old database...\n');
  
  try {
    // Test connection to old database
    const testClient = await oldPool.connect();
    console.log('✅ Connected to old database');
    testClient.release();

    // 1. Migrate Users
    console.log('\n📋 Migrating users...');
    const oldUsers = await oldPool.query('SELECT * FROM users ORDER BY id');
    if (oldUsers.rows.length > 0) {
      for (const user of oldUsers.rows) {
        await db.insert(schema.users)
          .values({
            id: user.id,
            email: user.email,
            password: user.password,
            role: user.role,
            createdAt: user.created_at,
            updatedAt: user.updated_at
          })
          .onConflictDoNothing();
      }
      console.log(`✅ Migrated ${oldUsers.rows.length} users`);
    } else {
      console.log('ℹ️  No users to migrate');
    }

    // 2. Migrate SDGs
    console.log('\n📋 Migrating SDGs...');
    const oldSdgs = await oldPool.query('SELECT * FROM sdgs ORDER BY id');
    if (oldSdgs.rows.length > 0) {
      for (const sdg of oldSdgs.rows) {
        await db.insert(schema.sdgs)
          .values({
            id: sdg.id,
            number: sdg.number,
            name: sdg.name,
            description: sdg.description,
            color: sdg.color,
            createdAt: sdg.created_at
          })
          .onConflictDoNothing();
      }
      console.log(`✅ Migrated ${oldSdgs.rows.length} SDGs`);
    } else {
      console.log('ℹ️  No SDGs to migrate');
    }

    // 3. Migrate Companies
    console.log('\n📋 Migrating companies...');
    const oldCompanies = await oldPool.query('SELECT * FROM companies ORDER BY id');
    if (oldCompanies.rows.length > 0) {
      for (const company of oldCompanies.rows) {
        await db.insert(schema.companies)
          .values({
            id: company.id,
            userId: company.user_id,
            name: company.name,
            sector: company.sector,
            logoUrl: company.logo_url,
            phone: company.phone,
            location: company.location,
            employeeCount: company.employee_count,
            createdAt: company.created_at,
            updatedAt: company.updated_at
          })
          .onConflictDoNothing();
      }
      console.log(`✅ Migrated ${oldCompanies.rows.length} companies`);
    } else {
      console.log('ℹ️  No companies to migrate');
    }

    // 4. Migrate Individuals
    console.log('\n📋 Migrating individuals...');
    const oldIndividuals = await oldPool.query('SELECT * FROM individuals ORDER BY id');
    if (oldIndividuals.rows.length > 0) {
      for (const individual of oldIndividuals.rows) {
        await db.insert(schema.individuals)
          .values({
            id: individual.id,
            userId: individual.user_id,
            firstName: individual.first_name,
            lastName: individual.last_name,
            phone: individual.phone,
            location: individual.location,
            occupation: individual.occupation,
            profilePictureUrl: individual.profile_picture_url,
            createdAt: individual.created_at,
            updatedAt: individual.updated_at
          })
          .onConflictDoNothing();
      }
      console.log(`✅ Migrated ${oldIndividuals.rows.length} individuals`);
    } else {
      console.log('ℹ️  No individuals to migrate');
    }

    // 5. Migrate Projects
    console.log('\n📋 Migrating projects...');
    const oldProjects = await oldPool.query('SELECT * FROM projects ORDER BY id');
    if (oldProjects.rows.length > 0) {
      for (const project of oldProjects.rows) {
        await db.insert(schema.projects)
          .values({
            id: project.id,
            name: project.name,
            sdgId: project.sdg_id,
            description: project.description,
            imageUrl: project.image_url,
            totalInvested: project.total_invested,
            peopleCount: project.people_count,
            createdAt: project.created_at,
            updatedAt: project.updated_at
          })
          .onConflictDoNothing();
      }
      console.log(`✅ Migrated ${oldProjects.rows.length} projects`);
    } else {
      console.log('ℹ️  No projects to migrate');
    }

    // 6. Migrate Consumption Records
    console.log('\n📋 Migrating consumption records...');
    const oldConsumption = await oldPool.query('SELECT * FROM consumption_records ORDER BY id');
    if (oldConsumption.rows.length > 0) {
      for (const record of oldConsumption.rows) {
        await db.insert(schema.consumptionRecords)
          .values({
            id: record.id,
            companyId: record.company_id,
            individualId: record.individual_id,
            description: record.description,
            energyKwh: record.energy_kwh,
            fuelLiters: record.fuel_liters,
            fuelType: record.fuel_type,
            transportKm: record.transport_km,
            transportType: record.transport_type,
            waterM3: record.water_m3,
            wasteKg: record.waste_kg,
            emissionKgCo2: record.emission_kg_co2,
            compensationValueKz: record.compensation_value_kz,
            period: record.period,
            month: record.month,
            day: record.day,
            year: record.year,
            createdAt: record.created_at
          })
          .onConflictDoNothing();
      }
      console.log(`✅ Migrated ${oldConsumption.rows.length} consumption records`);
    } else {
      console.log('ℹ️  No consumption records to migrate');
    }

    // 7. Migrate Payment Proofs
    console.log('\n📋 Migrating payment proofs...');
    const oldPaymentProofs = await oldPool.query('SELECT * FROM payment_proofs ORDER BY id');
    if (oldPaymentProofs.rows.length > 0) {
      for (const proof of oldPaymentProofs.rows) {
        await db.insert(schema.paymentProofs)
          .values({
            id: proof.id,
            companyId: proof.company_id,
            individualId: proof.individual_id,
            consumptionRecordId: proof.consumption_record_id,
            fileUrl: proof.file_url,
            amount: proof.amount,
            sdgId: proof.sdg_id,
            status: proof.status,
            createdAt: proof.created_at,
            updatedAt: proof.updated_at
          })
          .onConflictDoNothing();
      }
      console.log(`✅ Migrated ${oldPaymentProofs.rows.length} payment proofs`);
    } else {
      console.log('ℹ️  No payment proofs to migrate');
    }

    // 8. Migrate Investments
    console.log('\n📋 Migrating investments...');
    const oldInvestments = await oldPool.query('SELECT * FROM investments ORDER BY id');
    if (oldInvestments.rows.length > 0) {
      for (const investment of oldInvestments.rows) {
        await db.insert(schema.investments)
          .values({
            id: investment.id,
            companyId: investment.company_id,
            individualId: investment.individual_id,
            projectId: investment.project_id,
            paymentProofId: investment.payment_proof_id,
            amount: investment.amount,
            createdAt: investment.created_at
          })
          .onConflictDoNothing();
      }
      console.log(`✅ Migrated ${oldInvestments.rows.length} investments`);
    } else {
      console.log('ℹ️  No investments to migrate');
    }

    // 9. Migrate Project Updates
    console.log('\n📋 Migrating project updates...');
    const oldProjectUpdates = await oldPool.query('SELECT * FROM project_updates ORDER BY id');
    if (oldProjectUpdates.rows.length > 0) {
      for (const update of oldProjectUpdates.rows) {
        await db.insert(schema.projectUpdates)
          .values({
            id: update.id,
            projectId: update.project_id,
            title: update.title,
            content: update.content,
            mediaUrls: update.media_urls,
            createdAt: update.created_at
          })
          .onConflictDoNothing();
      }
      console.log(`✅ Migrated ${oldProjectUpdates.rows.length} project updates`);
    } else {
      console.log('ℹ️  No project updates to migrate');
    }

    // 10. Migrate Messages
    console.log('\n📋 Migrating messages...');
    const oldMessages = await oldPool.query('SELECT * FROM messages ORDER BY id');
    if (oldMessages.rows.length > 0) {
      for (const message of oldMessages.rows) {
        await db.insert(schema.messages)
          .values({
            id: message.id,
            fromUserId: message.from_user_id,
            toUserId: message.to_user_id,
            content: message.content,
            isRead: message.is_read,
            createdAt: message.created_at,
            updatedAt: message.updated_at
          })
          .onConflictDoNothing();
      }
      console.log(`✅ Migrated ${oldMessages.rows.length} messages`);
    } else {
      console.log('ℹ️  No messages to migrate');
    }

    // 11. Migrate Carbon Leaderboard
    console.log('\n📋 Migrating carbon leaderboard...');
    const oldLeaderboard = await oldPool.query('SELECT * FROM carbon_leaderboard ORDER BY id');
    if (oldLeaderboard.rows.length > 0) {
      for (const entry of oldLeaderboard.rows) {
        await db.insert(schema.carbonLeaderboard)
          .values({
            id: entry.id,
            companyId: entry.company_id,
            totalEmissionKgCo2: entry.total_emission_kg_co2,
            totalCompensationKgCo2: entry.total_compensation_kg_co2,
            carbonReductionPercentage: entry.carbon_reduction_percentage,
            carbonReductionRank: entry.carbon_reduction_rank,
            score: entry.score,
            period: entry.period,
            month: entry.month,
            year: entry.year,
            updatedAt: entry.updated_at
          })
          .onConflictDoNothing();
      }
      console.log(`✅ Migrated ${oldLeaderboard.rows.length} leaderboard entries`);
    } else {
      console.log('ℹ️  No leaderboard entries to migrate');
    }

    // Update sequences to match the highest ID
    console.log('\n🔧 Updating sequences...');
    const tables = [
      { table: 'users', column: 'id' },
      { table: 'sdgs', column: 'id' },
      { table: 'companies', column: 'id' },
      { table: 'individuals', column: 'id' },
      { table: 'projects', column: 'id' },
      { table: 'consumption_records', column: 'id' },
      { table: 'payment_proofs', column: 'id' },
      { table: 'investments', column: 'id' },
      { table: 'project_updates', column: 'id' },
      { table: 'messages', column: 'id' },
      { table: 'carbon_leaderboard', column: 'id' }
    ];

    for (const { table, column } of tables) {
      await db.execute(
        sql.raw(`SELECT setval(pg_get_serial_sequence('${table}', '${column}'), COALESCE(MAX(${column}), 1)) FROM ${table}`)
      );
    }
    console.log('✅ Sequences updated');

    console.log('\n✅ Data migration completed successfully!');
    
    // Summary
    console.log('\n📊 Migration Summary:');
    const summary = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM sdgs) as sdgs,
        (SELECT COUNT(*) FROM companies) as companies,
        (SELECT COUNT(*) FROM individuals) as individuals,
        (SELECT COUNT(*) FROM projects) as projects,
        (SELECT COUNT(*) FROM consumption_records) as consumption_records,
        (SELECT COUNT(*) FROM payment_proofs) as payment_proofs,
        (SELECT COUNT(*) FROM investments) as investments,
        (SELECT COUNT(*) FROM project_updates) as project_updates,
        (SELECT COUNT(*) FROM messages) as messages,
        (SELECT COUNT(*) FROM carbon_leaderboard) as leaderboard
    `);
    
    console.log(summary.rows[0]);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await oldPool.end();
    console.log('\n🔌 Disconnected from old database');
    process.exit(0);
  }
}

migrateData();

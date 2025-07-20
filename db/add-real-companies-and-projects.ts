import { db } from "@db";
import { users, companies, individuals, projects, consumptionRecords, paymentProofs, sdgs } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Empresas angolanas reais com logos
const realCompanies = [
  {
    name: "TV Zimbo",
    sector: "Mídia e Comunicação",
    logoUrl: "https://1.bp.blogspot.com/-K9JZTryMOXg/W-PGuOHkOWI/AAAAAAAAOBQ/ir7JLlcdbns_8Iiq_ndde5R10XsXs5O3gCLcBGAs/s1600/tvzimbo%2Bby%2Bchelynews.jpg",
    location: "Luanda",
    employeeCount: 250,
    phone: "+244 222 123 456"
  },
  {
    name: "Catoca",
    sector: "Mineração",
    logoUrl: "https://lidermagazine.ao/wp-content/uploads/2024/03/348221613_785352553242094_3211611353137058124_n.jpg",
    location: "Saurimo",
    employeeCount: 1200,
    phone: "+244 234 567 890"
  },
  {
    name: "Macon",
    sector: "Construção Civil",
    logoUrl: "https://vendawebmaconhomolog.rjconsultores.com.br/VendaWebMaconHomol/assets/images/logo-transparente.png",
    location: "Luanda",
    employeeCount: 800,
    phone: "+244 222 345 678"
  },
  {
    name: "Africell Angola",
    sector: "Telecomunicações",
    logoUrl: "https://www.menosfios.com/wp-content/uploads/2020/09/Africell-Angola-Menos-Fios-768x524.jpg",
    location: "Luanda",
    employeeCount: 500,
    phone: "+244 923 456 789"
  },
  {
    name: "INAPEN",
    sector: "Governo e Administração Pública",
    logoUrl: "https://seeklogo.com/images/I/inapem-logo-61BFE035F0-seeklogo.com.png",
    location: "Luanda",
    employeeCount: 300,
    phone: "+244 222 456 789"
  },
  {
    name: "ENSA",
    sector: "Energia",
    logoUrl: "https://atrium-shopping.com/wp-content/uploads/2019/09/ensa.png",
    location: "Luanda",
    employeeCount: 2500,
    phone: "+244 222 567 890"
  },
  {
    name: "Global Seguros",
    sector: "Seguros",
    logoUrl: "https://atrium-shopping.com/wp-content/uploads/2019/09/global_seguros.png",
    location: "Luanda",
    employeeCount: 150,
    phone: "+244 222 678 901"
  },
  {
    name: "Banco BIC",
    sector: "Serviços Financeiros",
    logoUrl: "https://www.impala.pt/wp-content/uploads/2017/06/16788491.JPG",
    location: "Luanda",
    employeeCount: 1000,
    phone: "+244 222 789 012"
  },
  {
    name: "Rádio Nacional de Angola",
    sector: "Mídia e Comunicação",
    logoUrl: "https://www.radioportal.ecatolico.com/images/stations/rma.webp",
    location: "Luanda",
    employeeCount: 400,
    phone: "+244 222 890 123"
  },
  {
    name: "Angola Cables",
    sector: "Telecomunicações",
    logoUrl: "https://th.bing.com/th/id/OIP.J0LiapMNvEASDubEbgxbaAHaFP?rs=1&pid=ImgDetMain",
    location: "Luanda",
    employeeCount: 200,
    phone: "+244 222 901 234"
  },
  {
    name: "TAAG Angola Airlines",
    sector: "Aviação",
    logoUrl: "https://airhex.com/images/airline-logos/alt/taag-angola.png",
    location: "Luanda",
    employeeCount: 2000,
    phone: "+244 222 012 345"
  },
  {
    name: "Refriango",
    sector: "Bebidas",
    logoUrl: "https://seeklogo.com/images/R/refriango-logo-AD493B6274-seeklogo.com.png",
    location: "Luanda",
    employeeCount: 600,
    phone: "+244 222 123 456"
  },
  {
    name: "Banco de Fomento Angola (BFA)",
    sector: "Serviços Financeiros",
    logoUrl: "https://yt3.ggpht.com/a-/AAuE7mBtMdXtNDGQIHWQ3MsAN0ojUSwk256VJeNcDg=s900-mo-c-c0xffffffff-rj-k-no",
    location: "Luanda",
    employeeCount: 800,
    phone: "+244 222 234 567"
  },
  {
    name: "ZAP",
    sector: "Telecomunicações",
    logoUrl: "https://www.menosfios.com/wp-content/uploads/2019/01/ZAP-1.jpg",
    location: "Luanda",
    employeeCount: 300,
    phone: "+244 222 345 678"
  },
  {
    name: "Coca-Cola Angola",
    sector: "Bebidas",
    logoUrl: "https://th.bing.com/th/id/OIP.CPon93wKHu3aSx4P8U2w_QHaHa?rs=1&pid=ImgDetMain",
    location: "Luanda",
    employeeCount: 400,
    phone: "+244 222 456 789"
  },
  {
    name: "Movicel",
    sector: "Telecomunicações",
    logoUrl: "https://th.bing.com/th/id/R.a58772baeef0c5e6b31f555c830288e1?rik=ljVCwMlDDlCTeg&riu=http%3a%2f%2fwww.menosfios.com%2fwp-content%2fuploads%2f2016%2f10%2fMovicel-2.jpg&ehk=c7LNTrBECODyXJlpCguET8ZoncW3gi7cAfxbDnUmKSk%3d&risl=&pid=ImgRaw&r=0&sres=1&sresct=1",
    location: "Luanda",
    employeeCount: 1500,
    phone: "+244 923 567 890"
  },
  {
    name: "Shoprite Angola",
    sector: "Retalho",
    logoUrl: "https://th.bing.com/th/id/OIP.EDwY-zVa4RMF1qorCwMDfAHaHa?rs=1&pid=ImgDetMain",
    location: "Luanda",
    employeeCount: 3000,
    phone: "+244 222 567 890"
  },
  {
    name: "Chevron Angola",
    sector: "Petróleo e Gás",
    logoUrl: "https://th.bing.com/th/id/OIP.1l7vmw1-6_kOHI4ArLz71wHaDt?rs=1&pid=ImgDetMain",
    location: "Luanda",
    employeeCount: 1800,
    phone: "+244 222 678 901"
  },
  {
    name: "TotalEnergies Angola",
    sector: "Petróleo e Gás",
    logoUrl: "https://th.bing.com/th/id/OIP.JDEooFDdWdhl8dAi0u4ijgHaHa?rs=1&pid=ImgDetMain",
    location: "Luanda",
    employeeCount: 2200,
    phone: "+244 222 789 012"
  },
  {
    name: "Sonangol",
    sector: "Petróleo e Gás",
    logoUrl: "https://th.bing.com/th/id/OIP.6DfwV3DMpEE_CnnL73gW7gHaHa?rs=1&pid=ImgDetMain",
    location: "Luanda",
    employeeCount: 5000,
    phone: "+244 222 890 123"
  }
];

// Pessoas fictícias com fotos de perfil
const realIndividuals = [
  {
    firstName: "Ana",
    lastName: "Fernandes",
    occupation: "Engenheira Ambiental",
    location: "Luanda",
    phone: "+244 923 111 222",
    profilePictureUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b3d4?w=400&h=400&fit=crop&crop=face"
  },
  {
    firstName: "Carlos",
    lastName: "Silva",
    occupation: "Gestor de Sustentabilidade",
    location: "Benguela",
    phone: "+244 923 222 333",
    profilePictureUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
  },
  {
    firstName: "Maria",
    lastName: "Santos",
    occupation: "Consultora em Energias Renováveis",
    location: "Huambo",
    phone: "+244 923 333 444",
    profilePictureUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face"
  },
  {
    firstName: "João",
    lastName: "Pereira",
    occupation: "Especialista em Carbono",
    location: "Lobito",
    phone: "+244 923 444 555",
    profilePictureUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face"
  },
  {
    firstName: "Isabel",
    lastName: "Costa",
    occupation: "Bióloga",
    location: "Namibe",
    phone: "+244 923 555 666",
    profilePictureUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face"
  },
  {
    firstName: "Miguel",
    lastName: "Rodrigues",
    occupation: "Engenheiro Florestal",
    location: "Malanje",
    phone: "+244 923 666 777",
    profilePictureUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
  },
  {
    firstName: "Teresa",
    lastName: "Almeida",
    occupation: "Gestora de Projetos Sociais",
    location: "Lubango",
    phone: "+244 923 777 888",
    profilePictureUrl: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face"
  },
  {
    firstName: "Pedro",
    lastName: "Gomes",
    occupation: "Especialista em Água",
    location: "Uíge",
    phone: "+244 923 888 999",
    profilePictureUrl: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face"
  }
];

// Projetos de sustentabilidade com imagens reais
const sustainabilityProjects = [
  {
    name: "Reflorestação da Mata do Mayombe",
    sdgNumber: 15, // Vida Terrestre
    description: "Projeto de reflorestação da floresta tropical do Mayombe em Cabinda, visando restaurar a biodiversidade e combater as mudanças climáticas através do plantio de 50.000 árvores nativas.",
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
    totalInvested: "2500000",
    peopleCount: 5000
  },
  {
    name: "Energia Solar Rural em Huíla",
    sdgNumber: 7, // Energia Limpa
    description: "Instalação de painéis solares em comunidades rurais da província da Huíla, fornecendo energia limpa para escolas, centros de saúde e residências de 20 aldeias.",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop",
    totalInvested: "3200000",
    peopleCount: 8000
  },
  {
    name: "Água Potável para Benguela",
    sdgNumber: 6, // Água Potável
    description: "Construção de poços artesianos e sistemas de tratamento de água em comunidades rurais de Benguela, garantindo acesso à água potável para mais de 15.000 pessoas.",
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    totalInvested: "1800000",
    peopleCount: 15000
  },
  {
    name: "Educação Ambiental nas Escolas",
    sdgNumber: 4, // Educação de Qualidade
    description: "Programa de educação ambiental em 100 escolas primárias de Luanda, ensinando sobre sustentabilidade, reciclagem e proteção ambiental a mais de 25.000 crianças.",
    imageUrl: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800&h=600&fit=crop",
    totalInvested: "950000",
    peopleCount: 25000
  },
  {
    name: "Agricultura Sustentável no Kwanza Sul",
    sdgNumber: 2, // Fome Zero
    description: "Implementação de técnicas de agricultura sustentável em cooperativas do Kwanza Sul, aumentando a produtividade agrícola sem agredir o meio ambiente.",
    imageUrl: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=600&fit=crop",
    totalInvested: "2100000",
    peopleCount: 12000
  },
  {
    name: "Reciclagem de Resíduos em Luanda",
    sdgNumber: 11, // Cidades Sustentáveis
    description: "Centro de reciclagem de resíduos sólidos em Luanda, processando 200 toneladas de resíduos por dia e criando empregos verdes para a comunidade local.",
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=600&fit=crop",
    totalInvested: "4500000",
    peopleCount: 2500000
  },
  {
    name: "Empoderamento Feminino Rural",
    sdgNumber: 5, // Igualdade de Gênero
    description: "Programa de capacitação e microcrédito para mulheres rurais em Malanje, promovendo o empreendedorismo feminino e a independência económica.",
    imageUrl: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&h=600&fit=crop",
    totalInvested: "1200000",
    peopleCount: 3500
  },
  {
    name: "Saúde Materno-Infantil no Cuando Cubango",
    sdgNumber: 3, // Saúde e Bem-Estar
    description: "Melhoria dos cuidados de saúde materno-infantil na província do Cuando Cubango, com formação de parteiras e construção de centros de saúde.",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop",
    totalInvested: "2800000",
    peopleCount: 18000
  },
  {
    name: "Combate à Pobreza no Bié",
    sdgNumber: 1, // Erradicação da Pobreza
    description: "Programa integrado de combate à pobreza na província do Bié, incluindo formação profissional, microcrédito e apoio ao empreendedorismo local.",
    imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=600&fit=crop",
    totalInvested: "3500000",
    peopleCount: 22000
  },
  {
    name: "Proteção Marinha em Namibe",
    sdgNumber: 14, // Vida na Água
    description: "Criação de área marinha protegida no litoral do Namibe, conservando ecossistemas marinhos e promovendo a pesca sustentável.",
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    totalInvested: "1900000",
    peopleCount: 8500
  }
];

export async function addRealCompaniesAndProjects() {
  console.log("🚀 Adicionando empresas angolanas reais e projetos de sustentabilidade...");

  try {
    // Hash para password padrão
    const hashedPassword = await bcrypt.hash("123456789", 10);

    // 1. Criar empresas
    for (const companyData of realCompanies) {
      console.log(`📊 Criando empresa: ${companyData.name}`);
      
      const email = `${companyData.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}@empresa.ao`;
      
      // Verificar se empresa já existe
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        console.log(`⚠️ Empresa ${companyData.name} já existe, pulando...`);
        continue;
      }
      
      // Criar usuário para a empresa
      const [user] = await db.insert(users).values({
        email,
        password: hashedPassword,
        role: 'company'
      }).returning();

      // Criar perfil da empresa
      const [company] = await db.insert(companies).values({
        userId: user.id,
        name: companyData.name,
        sector: companyData.sector,
        logoUrl: companyData.logoUrl,
        location: companyData.location,
        employeeCount: companyData.employeeCount,
        phone: companyData.phone
      }).returning();

      // Criar alguns dados de consumo para a empresa
      const consumptionData = {
        companyId: company.id,
        description: `Consumo energético mensal - ${companyData.name}`,
        energyKwh: (Math.random() * 50000 + 10000).toFixed(2), // 10k-60k kWh
        fuelLiters: (Math.random() * 5000 + 1000).toFixed(2), // 1k-6k litros
        fuelType: 'Diesel',
        transportKm: (Math.random() * 10000 + 2000).toFixed(2), // 2k-12k km
        transportType: 'Viaturas da empresa',
        waterM3: (Math.random() * 1000 + 200).toFixed(2), // 200-1200 m³
        wasteKg: (Math.random() * 2000 + 500).toFixed(2), // 500-2500 kg
        emissionKgCo2: (Math.random() * 25000 + 5000).toFixed(2), // 5-30 toneladas CO2
        compensationValueKz: (Math.random() * 500000 + 100000).toFixed(2), // 100k-600k Kz
        period: 'monthly',
        month: '01',
        year: 2025
      };

      const [consumptionRecord] = await db.insert(consumptionRecords).values(consumptionData).returning();

      // Criar comprovativo de pagamento para algumas empresas
      if (Math.random() > 0.5) {
        await db.insert(paymentProofs).values({
          companyId: company.id,
          consumptionRecordId: consumptionRecord.id,
          fileUrl: `/uploads/payment-proof-${user.id}.pdf`,
          amount: consumptionData.compensationValueKz,
          sdgId: Math.floor(Math.random() * 17) + 1, // SDG aleatório
          status: Math.random() > 0.3 ? 'approved' : 'pending'
        });
      }
    }

    // 2. Criar pessoas individuais
    for (const individualData of realIndividuals) {
      console.log(`👤 Criando pessoa: ${individualData.firstName} ${individualData.lastName}`);
      
      const email = `${individualData.firstName.toLowerCase()}.${individualData.lastName.toLowerCase()}@individual.ao`;
      
      // Verificar se pessoa já existe
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        console.log(`⚠️ Pessoa ${individualData.firstName} ${individualData.lastName} já existe, pulando...`);
        continue;
      }
      
      // Criar usuário para a pessoa
      const [user] = await db.insert(users).values({
        email,
        password: hashedPassword,
        role: 'individual'
      }).returning();

      // Criar perfil individual
      const [individual] = await db.insert(individuals).values({
        userId: user.id,
        firstName: individualData.firstName,
        lastName: individualData.lastName,
        occupation: individualData.occupation,
        location: individualData.location,
        phone: individualData.phone,
        profilePictureUrl: individualData.profilePictureUrl
      }).returning();

      // Criar dados de consumo pessoal
      const personalConsumption = {
        individualId: individual.id,
        description: `Consumo pessoal - ${individualData.firstName} ${individualData.lastName}`,
        energyKwh: (Math.random() * 500 + 100).toFixed(2), // 100-600 kWh
        fuelLiters: (Math.random() * 200 + 50).toFixed(2), // 50-250 litros
        fuelType: 'Gasolina',
        transportKm: (Math.random() * 2000 + 500).toFixed(2), // 500-2500 km
        transportType: 'Viatura pessoal',
        waterM3: (Math.random() * 50 + 10).toFixed(2), // 10-60 m³
        wasteKg: (Math.random() * 100 + 20).toFixed(2), // 20-120 kg
        emissionKgCo2: (Math.random() * 1000 + 200).toFixed(2), // 200-1200 kg CO2
        compensationValueKz: (Math.random() * 50000 + 10000).toFixed(2), // 10k-60k Kz
        period: 'monthly',
        month: '01',
        year: 2025
      };

      const [personalRecord] = await db.insert(consumptionRecords).values(personalConsumption).returning();

      // Criar comprovativo de pagamento para algumas pessoas
      if (Math.random() > 0.4) {
        await db.insert(paymentProofs).values({
          individualId: individual.id,
          consumptionRecordId: personalRecord.id,
          fileUrl: `/uploads/payment-proof-individual-${user.id}.pdf`,
          amount: personalConsumption.compensationValueKz,
          sdgId: Math.random() > 0.5 ? Math.floor(Math.random() * 17) + 1 : null, // SDG aleatório ou deixar admin escolher
          status: Math.random() > 0.6 ? 'approved' : 'pending'
        });
      }
    }

    // 3. Obter SDGs existentes
    const existingSdgs = await db.select().from(sdgs);
    const sdgMap = existingSdgs.reduce((map, sdg) => {
      map[sdg.number] = sdg.id;
      return map;
    }, {} as Record<number, number>);

    // 4. Criar projetos de sustentabilidade
    for (const projectData of sustainabilityProjects) {
      console.log(`🌱 Criando projeto: ${projectData.name}`);
      
      const sdgId = sdgMap[projectData.sdgNumber];
      if (!sdgId) {
        console.warn(`⚠️ SDG ${projectData.sdgNumber} não encontrado, pulando projeto ${projectData.name}`);
        continue;
      }

      await db.insert(projects).values({
        name: projectData.name,
        sdgId: sdgId,
        description: projectData.description,
        imageUrl: projectData.imageUrl,
        totalInvested: projectData.totalInvested,
        peopleCount: projectData.peopleCount
      });
    }

    console.log("✅ Empresas angolanas reais, pessoas e projetos criados com sucesso!");
    console.log(`📊 Criadas ${realCompanies.length} empresas`);
    console.log(`👥 Criadas ${realIndividuals.length} pessoas`);
    console.log(`🌱 Criados ${sustainabilityProjects.length} projetos`);
    
  } catch (error) {
    console.error("❌ Erro ao criar dados:", error);
    throw error;
  }
}

// Executar diretamente
addRealCompaniesAndProjects()
  .then(() => {
    console.log("🎉 Seed concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro no seed:", error);
    process.exit(1);
  });
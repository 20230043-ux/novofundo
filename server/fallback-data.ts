// Dados estáticos de fallback quando o banco não está disponível
export const fallbackData = {
  sdgs: [
    { id: 1, number: 1, name: "Erradicação da Pobreza", color: "#E5243B", icon: "🎯", description: "Acabar com a pobreza em todas as suas formas, em todos os lugares", created_at: "2024-01-01T00:00:00Z" },
    { id: 2, number: 2, name: "Fome Zero", color: "#DDA63A", icon: "🌾", description: "Acabar com a fome, alcançar a segurança alimentar", created_at: "2024-01-01T00:00:00Z" },
    { id: 3, number: 3, name: "Boa Saúde e Bem-Estar", color: "#4C9F38", icon: "🏥", description: "Assegurar uma vida saudável e promover o bem-estar para todos", created_at: "2024-01-01T00:00:00Z" },
    { id: 4, number: 4, name: "Educação de Qualidade", color: "#C5192D", icon: "📚", description: "Assegurar a educação inclusiva e equitativa de qualidade", created_at: "2024-01-01T00:00:00Z" },
    { id: 5, number: 5, name: "Igualdade de Gênero", color: "#FF3A21", icon: "⚖️", description: "Alcançar a igualdade de gênero e empoderar todas as mulheres", created_at: "2024-01-01T00:00:00Z" },
    { id: 6, number: 6, name: "Água Potável e Saneamento", color: "#26BDE2", icon: "💧", description: "Assegurar a disponibilidade e gestão sustentável da água", created_at: "2024-01-01T00:00:00Z" },
    { id: 7, number: 7, name: "Energia Limpa e Acessível", color: "#FCC30B", icon: "⚡", description: "Assegurar o acesso à energia limpa e renovável para todos", created_at: "2024-01-01T00:00:00Z" },
    { id: 8, number: 8, name: "Trabalho Decente e Crescimento Econômico", color: "#A21942", icon: "💼", description: "Promover crescimento econômico sustentado e inclusivo", created_at: "2024-01-01T00:00:00Z" },
    { id: 9, number: 9, name: "Indústria, Inovação e Infraestrutura", color: "#FD6925", icon: "🏭", description: "Construir infraestruturas resilientes e promover a inovação", created_at: "2024-01-01T00:00:00Z" },
    { id: 10, number: 10, name: "Redução das Desigualdades", color: "#DD1367", icon: "🤝", description: "Reduzir as desigualdades dentro dos países e entre eles", created_at: "2024-01-01T00:00:00Z" },
    { id: 11, number: 11, name: "Cidades e Comunidades Sustentáveis", color: "#FD9D24", icon: "🏙️", description: "Tornar as cidades e os assentamentos humanos sustentáveis", created_at: "2024-01-01T00:00:00Z" },
    { id: 12, number: 12, name: "Consumo e Produção Responsáveis", color: "#BF8B2E", icon: "♻️", description: "Assegurar padrões de produção e consumo sustentáveis", created_at: "2024-01-01T00:00:00Z" },
    { id: 13, number: 13, name: "Ação Contra a Mudança Global do Clima", color: "#3F7E44", icon: "🌍", description: "Tomar medidas urgentes para combater a mudança climática", created_at: "2024-01-01T00:00:00Z" },
    { id: 14, number: 14, name: "Vida na Água", color: "#0A97D9", icon: "🐟", description: "Conservação e uso sustentável dos oceanos e recursos marinhos", created_at: "2024-01-01T00:00:00Z" },
    { id: 15, number: 15, name: "Vida Terrestre", color: "#56C02B", icon: "🌳", description: "Proteger e promover o uso sustentável dos ecossistemas terrestres", created_at: "2024-01-01T00:00:00Z" },
    { id: 16, number: 16, name: "Paz, Justiça e Instituições Eficazes", color: "#00689D", icon: "⚖️", description: "Promover sociedades pacíficas e justas para o desenvolvimento sustentável", created_at: "2024-01-01T00:00:00Z" },
    { id: 17, number: 17, name: "Parcerias e Meios de Implementação", color: "#19486A", icon: "🤝", description: "Fortalecer os meios de implementação e revitalizar a parceria global", created_at: "2024-01-01T00:00:00Z" }
  ],
  projects: [
    {
      id: 1,
      name: "Painéis Solares em Comunidades Rurais",
      description: "Instalação de sistemas de energia solar em comunidades rurais sem acesso à eletricidade. Este projeto visa levar energia limpa e renovável para áreas remotas de Angola.",
      image_url: "/projects/solar-panels.jpg",
      sdg_id: 7,
      sdg: { id: 7, number: 7, name: "Energia Limpa e Acessível", color: "#FCC30B" },
      total_invested: 150000.00,
      people_count: 45,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-22T15:30:00Z"
    },
    {
      id: 2,
      name: "Sistemas de Purificação de Água",
      description: "Implementação de sistemas de purificação de água em regiões com escassez de água potável. Garantindo acesso à água limpa e segura para comunidades vulneráveis.",
      image_url: "/projects/water-purification.jpg",
      sdg_id: 6,
      sdg: { id: 6, number: 6, name: "Água Potável e Saneamento", color: "#26BDE2" },
      total_invested: 120000.00,
      people_count: 62,
      created_at: "2024-01-10T09:00:00Z",
      updated_at: "2024-01-22T12:00:00Z"
    },
    {
      id: 3,
      name: "Programa de Reflorestamento Urbano",
      description: "Plantio de árvores nativas em áreas urbanas para melhorar a qualidade do ar e criar espaços verdes sustentáveis nas cidades angolanas.",
      image_url: "/projects/reforestation.jpg",
      sdg_id: 15,
      sdg: { id: 15, number: 15, name: "Vida Terrestre", color: "#56C02B" },
      total_invested: 95000.00,
      people_count: 38,
      created_at: "2024-01-05T08:00:00Z",
      updated_at: "2024-01-22T16:45:00Z"
    }
  ],
  companies: [
    {
      id: 1,
      name: "Sonangol EP",
      sector: "Energia",
      location: "Luanda",
      employee_count: 15000,
      logo_url: "/company-logos/sonangol.png",
      phone: "+244 222 123 456",
      created_at: "2024-01-01T00:00:00Z"
    },
    {
      id: 2,
      name: "Banco Angolano de Investimentos",
      sector: "Serviços Financeiros",
      location: "Luanda",
      employee_count: 3500,
      logo_url: "/company-logos/bai.png",
      phone: "+244 222 987 654",
      created_at: "2024-01-01T00:00:00Z"
    },
    {
      id: 3,
      name: "Unitel",
      sector: "Telecomunicações",
      location: "Luanda",
      employee_count: 2800,
      logo_url: "/company-logos/unitel.png",
      phone: "+244 222 555 777",
      created_at: "2024-01-01T00:00:00Z"
    }
  ],
  users: [
    {
      id: 1,
      username: "admin",
      email: "admin@fundoverde.ao",
      role: "admin",
      created_at: "2024-01-01T00:00:00Z"
    },
    {
      id: 2,
      username: "maria_silva",
      email: "maria@empresa.ao",
      role: "company",
      created_at: "2024-01-15T10:00:00Z"
    },
    {
      id: 3,
      username: "joao_santos",
      email: "joao@email.ao",
      role: "individual",
      created_at: "2024-01-20T14:30:00Z"
    }
  ],
  individuals: [
    {
      id: 1,
      user_id: 3,
      first_name: "João",
      last_name: "Santos",
      phone: "+244 923 456 789",
      location: "Luanda",
      occupation: "Engenheiro Ambiental",
      profile_picture_url: "/uploads/profiles/joao_santos.jpg",
      created_at: "2024-01-20T14:30:00Z"
    }
  ],
  projectUpdates: [
    {
      id: 1,
      project_id: 1,
      title: "Instalação Concluída em 3 Comunidades",
      content: "Finalizamos a instalação de painéis solares em três comunidades rurais da província do Huambo. Mais de 200 famílias agora têm acesso à energia limpa.",
      media_urls: ["/uploads/updates/solar_installation_1.jpg", "/uploads/updates/solar_installation_2.jpg"],
      created_at: "2024-01-22T10:00:00Z"
    },
    {
      id: 2,
      project_id: 2,
      title: "Sistema de Purificação Operacional",
      content: "O primeiro sistema de purificação de água está funcionando perfeitamente na comunidade de Cacuaco, fornecendo água potável para mais de 500 pessoas diariamente.",
      media_urls: ["/uploads/updates/water_system_1.jpg"],
      created_at: "2024-01-20T15:30:00Z"
    },
    {
      id: 3,
      project_id: 3,
      title: "Plantio de 1000 Mudas Realizado",
      content: "Realizamos o plantio de 1000 mudas de árvores nativas no Parque da Independência. A comunidade local participou ativamente da ação.",
      media_urls: ["/uploads/updates/tree_planting_1.jpg", "/uploads/updates/tree_planting_2.jpg"],
      created_at: "2024-01-18T09:00:00Z"
    }
  ],
  investments: [
    {
      id: 1,
      company_id: 1,
      project_id: 1,
      amount: 50000.00,
      created_at: "2024-01-16T10:00:00Z"
    },
    {
      id: 2,
      company_id: 2,
      project_id: 2,
      amount: 40000.00,
      created_at: "2024-01-18T14:00:00Z"
    },
    {
      id: 3,
      individual_id: 1,
      project_id: 3,
      amount: 5000.00,
      created_at: "2024-01-21T11:30:00Z"
    }
  ],
  messages: [
    {
      id: 1,
      from_user_id: 2,
      to_user_id: 1,
      content: "Olá! Gostaria de saber mais detalhes sobre o projeto de energia solar.",
      is_read: false,
      created_at: "2024-01-22T09:00:00Z"
    }
  ],
  consumptionRecords: [
    {
      id: 1,
      company_id: 1,
      description: "Consumo mensal de energia elétrica - Janeiro 2024",
      energy_kwh: 15000.50,
      emission_kg_co2: 7500.25,
      compensation_value_kz: 750025.00,
      period: "monthly",
      month: "janeiro",
      year: 2024,
      created_at: "2024-01-31T23:59:59Z"
    }
  ],
  paymentProofs: [
    {
      id: 1,
      company_id: 1,
      file_url: "/uploads/proofs/payment_proof_1.pdf",
      amount: 50000.00,
      sdg_id: 7,
      status: "approved",
      created_at: "2024-01-16T10:30:00Z"
    }
  ],
  carbonLeaderboard: [
    {
      id: 1,
      company_id: 1,
      total_emission_kg_co2: 7500.25,
      total_compensation_kg_co2: 8000.00,
      carbon_reduction_percentage: 15.5,
      carbon_reduction_rank: 1,
      score: 950,
      period: "all_time",
      year: 2024,
      updated_at: "2024-01-22T18:00:00Z"
    }
  ],
  stats: {
    companiesCount: "15",
    individualsCount: "142",
    projectsCount: "3",
    totalCarbonEmissions: "45,678.5",
    totalInvestments: "2,345,000.00",
    totalCarbonCompensation: "52,180.75",
    averageCarbonReduction: "12.8",
    topCompany: "Sonangol EP",
    lastUpdated: "2024-01-22T18:00:00Z"
  }
};
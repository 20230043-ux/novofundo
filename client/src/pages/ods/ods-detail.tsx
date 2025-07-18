import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ProjectCard from "@/components/project-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { 
  ArrowLeft, 
  Info,
  Users,
  Building,
  Target,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import DebugImage from "@/components/debug-image";

// Função auxiliar para obter as iniciais de um nome
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

// Metas de investimento para cada ODS (em Kz)
const sdgTargets = {
  default: 10000000, // Meta padrão: 10.000.000 Kz
  // Metas específicas para cada ODS podem ser adicionadas aqui
  1: 10000000,
  2: 10000000,
  3: 10000000, 
  4: 10000000,
  5: 10000000,
  6: 10000000,
  7: 10000000,
  8: 10000000,
  9: 10000000,
  10: 10000000,
  11: 10000000, 
  12: 10000000,
  13: 10000000,
  14: 10000000,
  15: 10000000,
  16: 10000000,
  17: 10000000
};

const OdsDetail = () => {
  const { id } = useParams();
  
  // Fetch SDG details
  const { data: sdg, isLoading: isLoadingSdg } = useQuery({
    queryKey: [`/api/sdgs/${id}`, Date.now()], // Force fresh data with timestamp
    staleTime: 0, // Force fresh data to see investing individuals
    cacheTime: 0, // Don't cache this query
  });
  
  // Format currency
  const formatCurrency = (value: string) => {
    if (!value) return "0 Kz";
    const num = parseFloat(value);
    if (isNaN(num)) return "0 Kz";
    
    return new Intl.NumberFormat('pt-AO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num) + " Kz";
  };
  
  // Remove duplicatas de empresas
  const getUniqueCompanies = (companies: any[]) => {
    if (!companies || !Array.isArray(companies)) return [];
    
    // Mapeamento de IDs para evitar duplicação
    const uniqueCompaniesMap = new Map();
    
    companies.forEach(company => {
      // Se a empresa já existir, somamos o valor investido
      if (uniqueCompaniesMap.has(company.id)) {
        const existingCompany = uniqueCompaniesMap.get(company.id);
        const totalInvested = parseFloat(existingCompany.totalInvested) + parseFloat(company.totalInvested);
        existingCompany.totalInvested = totalInvested.toString();
      } else {
        // Nova empresa
        uniqueCompaniesMap.set(company.id, { ...company });
      }
    });
    
    // Converter o Map de volta para um array
    return Array.from(uniqueCompaniesMap.values());
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Loading state */}
      {isLoadingSdg ? (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-80 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : sdg ? (
        <>
          {/* Header with SDG Info */}
          <section 
            className="py-12"
            style={{
              backgroundColor: `${sdg.color}20`, // Using color with 20% opacity
            }}
          >
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <Link href="/ods">
                  <Button variant="ghost" className="mb-4 -ml-2">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para ODS
                  </Button>
                </Link>
                
                <div className="flex items-center mb-4">
                  <div className="w-20 h-20 rounded-lg mr-6 shadow-lg overflow-hidden">
                    {(() => {
                      const SDGIcon = ({ number, color }: { number: number; color: string }) => (
                        <div 
                          className="w-full h-full flex flex-col items-center justify-center rounded-lg"
                          style={{ backgroundColor: color }}
                        >
                          <div className="text-white font-bold text-2xl mb-1">{number}</div>
                          {/* Simple icon representations for each SDG */}
                          <div className="text-white text-xs">
                            {number === 1 && (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.01 2.01 0 0 0 18.03 7h-.53c-.83 0-1.58.5-1.92 1.27L12 16l-1.58-7.73A2.01 2.01 0 0 0 8.5 7H8c-1.1 0-2 .9-2 2v3h2v10h4v-6l1.5-3 1.5 3v6h4z"/>
                              </svg>
                            )}
                            {number === 2 && (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                            )}
                            {number === 3 && (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                            )}
                            {/* Add more icons for other SDGs as needed */}
                          </div>
                        </div>
                      );
                      
                      return <SDGIcon number={sdg?.number || 1} color={sdg?.color || '#666'} />;
                    })()}
                  </div>
                  <div className="w-full">
                    <h1 className="font-bold text-3xl text-gray-800 mb-1">{sdg?.name || 'ODS'}</h1>
                    
                    {/* Investment progress */}
                    <div className="w-full">
                      {/* Use backend calculated total to avoid double counting */}
                      {(() => {
                        // Use the backend's corrected totalInvested value that already avoids double counting
                        const totalInvested = parseFloat(sdg.totalInvested || '0');
                        
                        // Get target value for this SDG or use default
                        const targetValue = sdgTargets[sdg.number as keyof typeof sdgTargets] || sdgTargets.default;
                        const progressPercentage = Math.min(100, (totalInvested / targetValue) * 100);
                        
                        return (
                          <div className="flex flex-col w-full">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-primary font-medium">
                                Investido: {formatCurrency(totalInvested.toString())}
                              </span>
                              <span className="text-gray-600 font-medium flex items-center">
                                <Target className="h-4 w-4 mr-1" />
                                Meta: {formatCurrency(targetValue.toString())}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full mt-2 mb-4">
                              <div 
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{sdg.description}</p>
                
                <Card className="mb-6 border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                      Sobre Investimentos neste ODS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Todas as contribuições para este Objetivo de Desenvolvimento Sustentável ajudam a financiar 
                      projetos que visam {sdg.description.toLowerCase()}. Sua empresa pode participar
                      através do envio de comprovativos de pagamento na plataforma.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
          
          {/* Projects Section */}
          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <Tabs defaultValue="projects">
                  <TabsList className="mb-6">
                    <TabsTrigger value="projects" className="flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Projetos
                    </TabsTrigger>
                    <TabsTrigger value="companies" className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Empresas Investidoras
                    </TabsTrigger>
                    <TabsTrigger value="individuals" className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Pessoas Investidoras
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Projects Tab */}
                  <TabsContent value="projects">
                    <h2 className="font-semibold text-xl text-gray-800 mb-4">
                      Projetos Relacionados
                    </h2>
                    
                    {sdg.projects && sdg.projects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sdg.projects.map((project: any) => (
                          <ProjectCard
                            key={project.id}
                            id={project.id}
                            name={project.name}
                            description={project.description}
                            imageUrl={project.imageUrl}
                            totalInvested={project.totalInvested}
                            displayInvestment={project.displayInvestment}
                            sdg={sdg}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Nenhum projeto encontrado para este ODS.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Investing Companies Tab */}
                  <TabsContent value="companies">
                    <h2 className="font-semibold text-xl text-gray-800 mb-4">
                      Empresas Investidoras
                    </h2>
                    
                    {sdg.investingCompanies && sdg.investingCompanies.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Empresa</TableHead>
                              <TableHead>Setor</TableHead>
                              <TableHead className="text-right">Valor Investido</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getUniqueCompanies(sdg.investingCompanies).map((company: any) => (
                              <TableRow key={company.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage 
                                        src={company.logoUrl} 
                                        alt={company.name} 
                                      />
                                      <AvatarFallback className="bg-primary-50 text-primary-700">
                                        {getInitials(company.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="font-medium">{company.name}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {company.sector || "Não informado"}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(company.totalInvested)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Building className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">Nenhuma empresa investiu neste ODS ainda.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Investing Individuals Tab */}
                  <TabsContent value="individuals">
                    <h2 className="font-semibold text-xl text-gray-800 mb-4">
                      Pessoas Investidoras
                    </h2>
                    
                    {/* Debug info - remove this after fixing */}
                    <div className="mb-4 p-2 bg-yellow-100 text-xs">
                      Debug: investingIndividuals = {JSON.stringify(sdg?.investingIndividuals)}
                      <br />
                      <button 
                        onClick={() => window.location.reload()} 
                        className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
                      >
                        Force Refresh
                      </button>
                    </div>
                    
                    {sdg.investingIndividuals && Array.isArray(sdg.investingIndividuals) && sdg.investingIndividuals.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Pessoa</TableHead>
                              <TableHead>Ocupação</TableHead>
                              <TableHead>Localização</TableHead>
                              <TableHead className="text-right">Valor Investido</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sdg.investingIndividuals.map((individual: any) => (
                              <TableRow key={individual.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage 
                                        src={individual.profilePictureUrl} 
                                        alt={`${individual.firstName} ${individual.lastName}`} 
                                      />
                                      <AvatarFallback className="bg-primary-50 text-primary-700">
                                        {getInitials(
                                          individual.fullName || 
                                          (individual.firstName && individual.lastName ? `${individual.firstName} ${individual.lastName}` : '') ||
                                          individual.firstName || 
                                          individual.lastName || 
                                          'Nome'
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="font-medium">
                                      {individual.fullName || 
                                       (individual.firstName && individual.lastName ? `${individual.firstName} ${individual.lastName}` : '') ||
                                       individual.firstName || 
                                       individual.lastName || 
                                       'Nome não disponível'}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {individual.occupation || "Não informado"}
                                </TableCell>
                                <TableCell>
                                  {individual.location || "Não informado"}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(individual.totalInvested)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">
                          {!sdg.investingIndividuals ? 
                            'Carregando pessoas investidoras...' : 
                            Array.isArray(sdg.investingIndividuals) && sdg.investingIndividuals.length === 0 ?
                            'Nenhuma pessoa investiu neste ODS ainda.' :
                            'Erro ao carregar dados das pessoas investidoras.'
                          }
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="font-bold text-2xl text-gray-800 mb-4">ODS não encontrado</h1>
          <p className="text-gray-600 mb-8">O ODS que você está procurando não foi encontrado.</p>
          <Button asChild>
            <Link href="/ods">Voltar para ODS</Link>
          </Button>
        </div>
      )}
      
      <div className="flex-grow"></div>
      <Footer />
    </div>
  );
};

export default OdsDetail;

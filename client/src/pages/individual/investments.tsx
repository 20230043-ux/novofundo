import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TreePine, 
  Zap, 
  Droplets, 
  Leaf, 
  TrendingUp, 
  Heart,
  ExternalLink,
  Wallet,
  FileText,
  Calendar
} from "lucide-react";
import { Link } from "wouter";

const IndividualInvestments = () => {
  const { user } = useAuth();

  // Fetch available projects for investment
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch SDGs
  const { data: sdgs = [], isLoading: sdgsLoading } = useQuery({
    queryKey: ['/api/sdgs'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch individual investments
  const { data: investments = [], isLoading: investmentsLoading } = useQuery({
    queryKey: ['/api/individual/investments'],
    enabled: !!user?.individual,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getSdgIcon = (sdgNumber: number) => {
    switch(sdgNumber) {
      case 6: return <Droplets className="h-5 w-5" />;
      case 7: return <Zap className="h-5 w-5" />;
      case 15: return <TreePine className="h-5 w-5" />;
      default: return <Leaf className="h-5 w-5" />;
    }
  };

  const getSdgColor = (sdgNumber: number) => {
    switch(sdgNumber) {
      case 6: return "text-blue-500";
      case 7: return "text-yellow-500";
      case 15: return "text-green-500";
      default: return "text-emerald-500";
    }
  };

  const isLoading = projectsLoading || sdgsLoading || investmentsLoading;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="h-8 w-8 text-primary" />
              Compensação de Carbono
            </h1>
            <p className="text-gray-600 mt-2">
              Invista em projetos sustentáveis para compensar sua pegada de carbono
            </p>
          </div>

          {/* My Investments */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Meus Investimentos</h2>
            {investments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {investments.map((investment: any) => (
                  <Card key={investment.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={investment.paymentProof?.status === 'approved' 
                            ? "text-green-600 border-green-600" 
                            : "text-yellow-600 border-yellow-600"
                          }
                        >
                          {investment.paymentProof?.status === 'approved' ? 'Aprovado' : 'Pendente'}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {new Date(investment.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <CardTitle className="text-lg">{investment.project?.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Valor:</span>
                          <span className="font-medium">{parseFloat(investment.amount).toFixed(0)} Kz</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>SDG:</span>
                          <span className="font-medium">{investment.project?.sdg?.name}</span>
                        </div>
                      </div>
                      <Link href={`/projeto/${investment.project?.id}`}>
                        <Button variant="outline" size="sm" className="w-full mt-4">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver Projeto
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Você ainda não tem investimentos registrados.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Calcule sua pegada de carbono e faça seu primeiro investimento.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Available Projects */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Projetos Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => {
                const sdg = sdgs.find((s: any) => s.id === project.sdgId);
                
                return (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 ${getSdgColor(sdg?.number)}`}>
                          {getSdgIcon(sdg?.number)}
                          <Badge variant="outline">
                            ODS {sdg?.number}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <TrendingUp className="h-4 w-4" />
                          {parseFloat(project.totalInvested || '0').toFixed(0)} Kz
                        </div>
                      </div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-3 mb-4">
                        {project.description}
                      </CardDescription>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>SDG:</span>
                          <span className="font-medium">{sdg?.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Investido:</span>
                          <span className="font-medium">{parseFloat(project.totalInvested || '0').toFixed(0)} Kz</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Link href={`/projeto/${project.id}`}>
                          <Button variant="outline" className="w-full">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </Link>
                        <Link href="/individual/payment-proof">
                          <Button className="w-full">
                            <FileText className="h-4 w-4 mr-2" />
                            Investir
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default IndividualInvestments;
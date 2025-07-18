import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Users, 
  Clock, 
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const AdminCompanies = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("");
  
  // Fetch all companies
  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/admin/companies'],
    enabled: !!user && user.role === 'admin',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch pending payment proofs
  const { data: pendingProofs, isLoading: isLoadingPendingProofs } = useQuery({
    queryKey: ['/api/admin/payment-proofs/pending'],
    enabled: !!user && user.role === 'admin',
    staleTime: 1000 * 60 * 1, // 1 minute
  });
  
  // Update payment proof status mutation
  const updateProofStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'approved' | 'rejected' }) => {
      const res = await apiRequest("PUT", `/api/admin/payment-proofs/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure UI is updated correctly
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-proofs/pending'] });
      
      // Invalidate admin stats to update investment amounts shown in the dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      // Invalidate SDG data as investments may have been created
      queryClient.invalidateQueries({ queryKey: ['/api/sdgs'] });
      
      // Also invalidate company specific data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
      
      toast({
        title: "Status atualizado",
        description: "O status do comprovativo foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle approve/reject
  const handleApprove = (id: number) => {
    updateProofStatusMutation.mutate({ id, status: 'approved' });
  };
  
  const handleReject = (id: number) => {
    updateProofStatusMutation.mutate({ id, status: 'rejected' });
  };
  
  // Filter companies based on search query and sector filter
  const filteredCompanies = companies ? 
    companies.filter((company: any) => {
      // Search filter
      const matchesSearch = !searchQuery || 
        (company?.name?.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (company?.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Sector filter
      const matchesSector = !sectorFilter || company?.sector === sectorFilter;
      
      return matchesSearch && matchesSector;
    }) : [];
  
  // Format currency
  const formatCurrency = (value: string | number) => {
    if (!value) return "0 Kz";
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return "0 Kz";
    
    return new Intl.NumberFormat('pt-AO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num) + " Kz";
  };
  
  // Format number
  const formatNumber = (value: string | number) => {
    if (!value) return "0";
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return "0";
    
    return new Intl.NumberFormat('pt-AO', {
      maximumFractionDigits: 2,
    }).format(num);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString;
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 flex items-center gap-1"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 flex items-center gap-1"><CheckCircle className="h-3 w-3 mr-1" /> Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 flex items-center gap-1"><XCircle className="h-3 w-3 mr-1" /> Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };
  
  // Get unique sectors from companies
  const sectors = companies 
    ? Array.from(new Set(companies.map((company: any) => company?.sector).filter(Boolean)))
    : [];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex">
        <Sidebar type="admin" />
        
        <div className="flex-1 overflow-auto bg-gray-100">
          <div className="container mx-auto px-4 py-8">
            <h1 className="font-bold text-2xl text-gray-800 mb-6">Gerenciar Empresas</h1>
            
            <Tabs defaultValue="companies" className="space-y-6">
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="companies" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Empresas</span>
                </TabsTrigger>
                <TabsTrigger value="proofs" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Comprovativos Pendentes</span>
                  {pendingProofs && pendingProofs.length > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {pendingProofs.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              {/* Companies Tab */}
              <TabsContent value="companies">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Lista de Empresas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Filters */}
                    <div className="mb-6">
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Pesquisar empresas..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        
                        <div className="w-full md:w-64">
                          <Select
                            value={sectorFilter}
                            onValueChange={setSectorFilter}
                          >
                            <SelectTrigger className="w-full">
                              <div className="flex items-center">
                                <Filter className="h-4 w-4 mr-2 text-gray-400" />
                                <SelectValue placeholder="Filtrar por setor" />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all_sectors">Todos os setores</SelectItem>
                              {sectors.map((sector: string) => (
                                <SelectItem key={sector} value={sector}>
                                  {sector.charAt(0).toUpperCase() + sector.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {(searchQuery || sectorFilter) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {searchQuery && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              Pesquisa: {searchQuery}
                              <button 
                                className="ml-1 hover:text-primary" 
                                onClick={() => setSearchQuery("")}
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                          
                          {sectorFilter && sectorFilter !== "all_sectors" && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              Setor: {sectorFilter.charAt(0).toUpperCase() + sectorFilter.slice(1)}
                              <button 
                                className="ml-1 hover:text-primary" 
                                onClick={() => setSectorFilter("all_sectors")}
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                          
                          {(searchQuery || sectorFilter) && (
                            <button 
                              className="text-sm text-primary hover:underline" 
                              onClick={() => {
                                setSearchQuery("");
                                setSectorFilter("");
                              }}
                            >
                              Limpar todos os filtros
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Companies Table */}
                    {isLoadingCompanies ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : filteredCompanies.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Empresa</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Setor</TableHead>
                              <TableHead>Data de Registro</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCompanies.map((company: any) => (
                              <TableRow key={company.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={company?.logoUrl || ''} alt={company?.name || ''} />
                                      <AvatarFallback className="bg-primary text-white">
                                        {getInitials(company?.name || 'N/A')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{company?.name || 'N/A'}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{company?.user?.email || 'N/A'}</TableCell>
                                <TableCell>{company?.sector ? company.sector.charAt(0).toUpperCase() + company.sector.slice(1) : 'N/A'}</TableCell>
                                <TableCell>{formatDate(company?.createdAt)}</TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/admin/empresas/${company.id}`} className="flex items-center">
                                      <Eye className="h-4 w-4 mr-1" />
                                      <span>Detalhes</span>
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 mb-4">Nenhuma empresa encontrada com os filtros aplicados.</p>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchQuery("");
                            setSectorFilter("");
                          }}
                        >
                          Limpar filtros
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Pending Proofs Tab */}
              <TabsContent value="proofs">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Comprovativos Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPendingProofs ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : pendingProofs && pendingProofs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Entidade</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>ODS</TableHead>
                              <TableHead>Comprovativo</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingProofs.map((proof: any) => {
                              const isCompany = !!proof.company;
                              const entity = isCompany ? proof.company : proof.individual;
                              const entityName = isCompany ? entity?.name : entity?.fullName;
                              const entityImage = isCompany ? entity?.logoUrl : entity?.profilePictureUrl;
                              const entityEmail = entity?.user?.email;
                              
                              return (
                                <TableRow key={proof.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10">
                                        <AvatarImage src={entityImage || ''} alt={entityName || ''} />
                                        <AvatarFallback className="bg-primary text-white">
                                          {getInitials(entityName || 'N/A')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{entityName || 'N/A'}</span>
                                        {isCompany && entity?.sector && (
                                          <span className="text-xs text-gray-500 capitalize">{entity.sector}</span>
                                        )}
                                        {!isCompany && entity?.birthDate && (
                                          <span className="text-xs text-gray-500">
                                            Idade: {new Date().getFullYear() - new Date(entity.birthDate).getFullYear()} anos
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={isCompany ? "default" : "secondary"}>
                                      {isCompany ? "Empresa" : "Pessoa"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-gray-600">{entityEmail || 'N/A'}</TableCell>
                                  <TableCell>{formatDate(proof.createdAt)}</TableCell>
                                  <TableCell>{formatCurrency(proof.amount)}</TableCell>
                                  <TableCell>
                                    {proof.sdg ? (
                                      <span className="inline-flex items-center">
                                        <span 
                                          className="w-3 h-3 rounded-full mr-1"
                                          style={{ backgroundColor: proof.sdg.color }}
                                        ></span>
                                        ODS {proof.sdg.number}
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">Não definido</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <a 
                                      href={proof.fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline inline-flex items-center"
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      Ver
                                    </a>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700"
                                        onClick={() => handleApprove(proof.id)}
                                        disabled={updateProofStatusMutation.isPending}
                                      >
                                        <ThumbsUp className="h-4 w-4 mr-1" />
                                        <span>Aprovar</span>
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
                                        onClick={() => handleReject(proof.id)}
                                        disabled={updateProofStatusMutation.isPending}
                                      >
                                        <ThumbsDown className="h-4 w-4 mr-1" />
                                        <span>Rejeitar</span>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Não há comprovativos pendentes no momento.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminCompanies;

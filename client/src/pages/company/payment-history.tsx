import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileText, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import Navbar from "../../components/layout/navbar";
import Sidebar from "../../components/layout/sidebar";

interface PaymentProof {
  id: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  proofUrl?: string;
  sdg?: {
    id: number;
    number: number;
    name: string;
    color: string;
  };
  consumptionRecord?: {
    id: number;
    description?: string;
    createdAt: string;
    co2Emissions: number;
    compensationValueKz: number;
  };
  investments?: Array<{
    id: number;
    project: {
      id: number;
      name: string;
    };
  }>;
}

export default function CompanyPaymentHistory() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: paymentProofs, isLoading } = useQuery({
    queryKey: ['/api/company/payment-proofs'],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" />
            Desconhecido
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredProofs = paymentProofs?.filter((proof: PaymentProof) => {
    if (statusFilter === "all") return true;
    return proof.status === statusFilter;
  }) || [];

  const getStatusCounts = () => {
    if (!paymentProofs) return { total: 0, approved: 0, pending: 0, rejected: 0 };
    
    return {
      total: paymentProofs.length,
      approved: paymentProofs.filter((p: PaymentProof) => p.status === 'approved').length,
      pending: paymentProofs.filter((p: PaymentProof) => p.status === 'pending').length,
      rejected: paymentProofs.filter((p: PaymentProof) => p.status === 'rejected').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar type="company" />
        
        <div className="flex-1 overflow-auto bg-gray-100 w-full">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="font-bold text-2xl text-gray-800">Histórico de Comprovativos</h1>
                <p className="text-gray-600 mt-1">Acompanhe o status de todos os seus comprovativos de pagamento</p>
              </div>
            </div>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Aprovados</p>
                      <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejeitados</p>
                      <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Filtrar por Status
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="approved">Aprovados</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                        <SelectItem value="rejected">Rejeitados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Proofs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Comprovativos de Pagamento</CardTitle>
                <CardDescription>
                  {filteredProofs.length} comprovativo(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Carregando histórico...
                  </div>
                ) : filteredProofs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data de Envio</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>ODS</TableHead>
                          <TableHead>Consumo Relacionado</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Última Atualização</TableHead>
                          <TableHead>Investimento</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProofs.map((proof: PaymentProof) => (
                          <TableRow key={proof.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(proof.status)}
                                {formatDate(proof.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(proof.amount)}
                            </TableCell>
                            <TableCell>
                              {proof.sdg ? (
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full" 
                                    style={{ backgroundColor: proof.sdg.color }}
                                  />
                                  <span className="text-sm">
                                    ODS {proof.sdg.number}: {proof.sdg.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">Aguardando atribuição</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {proof.consumptionRecord ? (
                                <div className="text-sm">
                                  <p className="font-medium">
                                    {proof.consumptionRecord.description || 'Cálculo de carbono'}
                                  </p>
                                  <p className="text-gray-500">
                                    {proof.consumptionRecord.co2Emissions.toFixed(2)} kg CO₂
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">Pagamento avulso</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(proof.status)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(proof.updatedAt)}
                            </TableCell>
                            <TableCell>
                              {proof.investments && proof.investments.length > 0 ? (
                                <div className="text-sm">
                                  <p className="font-medium text-green-600">
                                    Investimento criado
                                  </p>
                                  <p className="text-gray-500">
                                    {proof.investments[0].project.name}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {proof.proofUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(proof.proofUrl, '_blank')}
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Ver
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum comprovativo encontrado
                    </h3>
                    <p className="text-gray-500">
                      {statusFilter === "all" 
                        ? "Você ainda não enviou nenhum comprovativo de pagamento." 
                        : `Não há comprovativos com status "${statusFilter}".`
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
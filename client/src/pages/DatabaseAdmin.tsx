import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Database, Users, Building2, Target, DollarSign, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/navbar';
import Sidebar from '@/components/layout/sidebar';

interface DatabaseStats {
  users: number;
  companies: number;
  individuals: number;
  projects: number;
  investments: number;
  total_investment_amount: number;
  sdgs: number;
  payment_proofs: number;
}

interface TableData {
  name: string;
  count: number;
  last_updated: string;
}

interface QueryResult {
  columns: string[];
  rows: any[];
}

export default function DatabaseAdmin() {
  const [customQuery, setCustomQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Fetch database statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DatabaseStats>({
    queryKey: ['/api/admin/database/stats'],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Fetch table information
  const { data: tables, isLoading: tablesLoading } = useQuery<TableData[]>({
    queryKey: ['/api/admin/database/tables'],
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['/api/admin/database/recent-activity'],
    refetchInterval: 15000, // Atualizar a cada 15 segundos
  });

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma consulta SQL",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    try {
      const response = await fetch('/api/admin/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery })
      });

      if (!response.ok) {
        throw new Error('Erro ao executar consulta');
      }

      const result = await response.json();
      setQueryResult(result);
      toast({
        title: "Sucesso",
        description: `Consulta executada. ${result.rows.length} registos encontrados.`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao executar consulta SQL",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const predefinedQueries = [
    {
      name: "Empresas Registadas",
      query: `SELECT c.name as empresa, u.email, c.sector, c.created_at::date as registado_em
               FROM companies c JOIN users u ON c.user_id = u.id 
               ORDER BY c.created_at DESC LIMIT 20`
    },
    {
      name: "Projectos e Investimentos",
      query: `SELECT p.name as projecto, p.sdg_number, 
               COALESCE(SUM(i.amount), 0) as total_investido,
               COUNT(i.id) as num_investimentos
               FROM projects p LEFT JOIN investments i ON p.id = i.project_id
               GROUP BY p.id, p.name, p.sdg_number 
               ORDER BY total_investido DESC`
    },
    {
      name: "Actividade Recente",
      query: `SELECT 'Empresa' as tipo, name as nome, created_at::date as data
               FROM companies 
               UNION ALL
               SELECT 'Projecto' as tipo, name as nome, created_at::date as data
               FROM projects
               ORDER BY data DESC LIMIT 15`
    },
    {
      name: "Top Investidores",
      query: `SELECT c.name as empresa, SUM(i.amount) as total_investido,
               COUNT(i.id) as num_investimentos
               FROM companies c 
               JOIN investments i ON c.user_id = i.company_id
               GROUP BY c.id, c.name
               ORDER BY total_investido DESC LIMIT 10`
    }
  ];

  if (statsLoading || tablesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Database className="mx-auto h-8 w-8 animate-spin text-green-600 mb-4" />
          <p>Carregando dados da base de dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar type="admin" />
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Database className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-3xl font-bold">Administração da Base de Dados</h1>
                <p className="text-muted-foreground">Visualizar e gerir dados do sistema</p>
              </div>
            </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.users || 0}</p>
                <p className="text-sm text-muted-foreground">Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.companies || 0}</p>
                <p className="text-sm text-muted-foreground">Empresas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.projects || 0}</p>
                <p className="text-sm text-muted-foreground">Projectos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {stats?.total_investment_amount 
                    ? new Intl.NumberFormat('pt-AO', { 
                        style: 'currency', 
                        currency: 'AOA' 
                      }).format(stats.total_investment_amount)
                    : 'AOA 0'
                  }
                </p>
                <p className="text-sm text-muted-foreground">Investido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tables">Tabelas</TabsTrigger>
          <TabsTrigger value="queries">Consultas</TabsTrigger>
          <TabsTrigger value="activity">Actividade</TabsTrigger>
          <TabsTrigger value="custom">SQL Personalizado</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações das Tabelas</CardTitle>
              <CardDescription>Estado actual de todas as tabelas da base de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables?.map((table) => (
                  <Card key={table.name} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{table.name}</h3>
                        <p className="text-2xl font-bold text-green-600">{table.count}</p>
                        <p className="text-xs text-muted-foreground">registos</p>
                      </div>
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consultas Predefinidas</CardTitle>
              <CardDescription>Consultas úteis para análise rápida dos dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {predefinedQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => {
                    setCustomQuery(query.query);
                    executeCustomQuery();
                  }}
                >
                  <div className="text-left">
                    <p className="font-medium">{query.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {query.query.substring(0, 80)}...
                    </p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividade Recente</CardTitle>
              <CardDescription>Últimas alterações na base de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {Array.isArray(recentActivity) && recentActivity?.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-2 border-b">
                    <Badge variant="outline">{activity.tipo}</Badge>
                    <span className="flex-1">{activity.nome}</span>
                    <span className="text-sm text-muted-foreground">{activity.data}</span>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consulta SQL Personalizada</CardTitle>
              <CardDescription>Execute consultas SQL directamente na base de dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="SELECT * FROM companies LIMIT 10;"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="min-h-32"
              />
              <Button 
                onClick={executeCustomQuery} 
                disabled={isExecuting}
                className="w-full"
              >
                {isExecuting ? "Executando..." : "Executar Consulta"}
              </Button>
              
              {queryResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Resultado ({queryResult.rows.length} registos)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96 w-full">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {queryResult.columns.map((col) => (
                              <th key={col} className="text-left p-2 font-medium">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.map((row, i) => (
                            <tr key={i} className="border-b">
                              {queryResult.columns.map((col) => (
                                <td key={col} className="p-2">
                                  {row[col]?.toString() || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
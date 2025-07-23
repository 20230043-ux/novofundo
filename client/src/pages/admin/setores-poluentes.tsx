import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft, Factory, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

const SECTOR_COLORS = {
  'Telecomunicações': '#3b82f6',
  'Aviação': '#ef4444', 
  'Bebidas': '#22c55e',
  'Indústria de Bebidas': '#f97316',
  'Serviços Financeiros': '#8b5cf6',
  'Agricultura': '#84cc16',
  'Administração Pública': '#06b6d4',
  'Varejo / Supermercados': '#f59e0b'
};

export default function SetoresPoluentes() {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000
  }) as { data: any, isLoading: boolean };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Processar dados por setor
  const sectorData = stats?.sectorEmissions ? 
    Object.entries(
      stats.sectorEmissions.reduce((acc: any, item: any) => {
        const sector = item.sector || "Sem setor";
        if (!acc[sector]) {
          acc[sector] = {
            name: sector,
            totalEmissions: 0,
            totalCompensations: 0,
            companies: [],
            count: 0
          };
        }
        
        const emissions = parseFloat(item.emissions || 0);
        const compensations = parseFloat(item.compensations || 0);
        
        acc[sector].totalEmissions += emissions;
        acc[sector].totalCompensations += compensations;
        acc[sector].count += 1;
        acc[sector].companies.push({
          name: item.company_name,
          id: item.company_id,
          emissions,
          compensations
        });
        
        return acc;
      }, {})
    ).map(([, value]) => value).sort((a: any, b: any) => b.totalEmissions - a.totalEmissions)
    : [];

  const totalEmissions = sectorData.reduce((sum: number, sector: any) => sum + sector.totalEmissions, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/relatorios">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Setores Mais Poluentes</h1>
          </div>
          <p className="text-gray-600">Análise das emissões de carbono por setor empresarial</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/dashboard">Voltar ao Dashboard</Link>
        </Button>
      </div>

      {sectorData.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center h-64">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Sem dados de emissões</h3>
              <p className="text-gray-500 text-center">
                Ainda não há registros de consumo das empresas cadastradas.
                <br />
                Entre em contato com as empresas para submeterem seus dados.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Visão Geral dos Setores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Estatísticas Gerais */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Factory className="h-5 w-5" />
                    Resumo Geral
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Total de Setores</p>
                    <p className="text-2xl font-bold">{sectorData.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total de Emissões</p>
                    <p className="text-2xl font-bold text-red-600">
                      {totalEmissions.toLocaleString('pt-BR')} kg CO₂
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Setor Mais Poluente</p>
                    <p className="text-lg font-medium">
                      {sectorData[0]?.name || 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Top 3 Setores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top 3 Setores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sectorData.slice(0, 3).map((sector: any, index: number) => (
                    <div 
                      key={sector.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setSelectedSector(sector.name)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{sector.name}</p>
                          <p className="text-sm text-gray-500">{sector.count} empresas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          {sector.totalEmissions.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-500">kg CO₂</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="bar">
                <TabsList>
                  <TabsTrigger value="bar">Gráfico de Barras</TabsTrigger>
                  <TabsTrigger value="pie">Gráfico de Pizza</TabsTrigger>
                </TabsList>

                <TabsContent value="bar">
                  <Card>
                    <CardHeader>
                      <CardTitle>Emissões por Setor</CardTitle>
                      <CardDescription>Comparação de emissões de CO₂ entre setores</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sectorData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              fontSize={12}
                            />
                            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                            <Tooltip 
                              formatter={(value: any) => [
                                `${parseFloat(value).toLocaleString('pt-BR')} kg CO₂`,
                                'Emissões'
                              ]}
                            />
                            <Bar 
                              dataKey="totalEmissions" 
                              name="Emissões" 
                              fill="#ef4444"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pie">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição de Emissões</CardTitle>
                      <CardDescription>Percentual de emissões por setor</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sectorData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="totalEmissions"
                            >
                              {sectorData.map((entry: any, index: number) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={SECTOR_COLORS[entry.name as keyof typeof SECTOR_COLORS] || '#8884d8'} 
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: any) => [
                                `${parseFloat(value).toLocaleString('pt-BR')} kg CO₂`,
                                'Emissões'
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Tabela Detalhada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhamento por Setor</CardTitle>
              <CardDescription>Clique em um setor para ver detalhes das empresas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left">Setor</th>
                      <th className="py-3 px-4 text-center">Empresas</th>
                      <th className="py-3 px-4 text-right">Emissões Totais</th>
                      <th className="py-3 px-4 text-right">Compensações</th>
                      <th className="py-3 px-4 text-center">% do Total</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectorData.map((sector: any) => (
                      <React.Fragment key={sector.name}>
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: SECTOR_COLORS[sector.name as keyof typeof SECTOR_COLORS] || '#8884d8' }}
                              ></div>
                              <span className="font-medium">{sector.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="secondary">{sector.count}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {sector.totalEmissions.toLocaleString('pt-BR')} kg CO₂
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-green-600">
                            {sector.totalCompensations.toLocaleString('pt-BR')} Kz
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={
                              (sector.totalEmissions / totalEmissions) > 0.3 ? "destructive" : 
                              (sector.totalEmissions / totalEmissions) > 0.15 ? "default" : "secondary"
                            }>
                              {((sector.totalEmissions / totalEmissions) * 100).toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedSector(selectedSector === sector.name ? null : sector.name)}
                            >
                              {selectedSector === sector.name ? 'Ocultar' : 'Ver Empresas'}
                            </Button>
                          </td>
                        </tr>
                        {selectedSector === sector.name && (
                          <tr>
                            <td colSpan={6} className="p-4 bg-gray-50">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">
                                  Empresas do setor {sector.name}:
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {sector.companies.map((company: any) => (
                                    <div key={company.id} className="flex justify-between items-center p-2 bg-white rounded border">
                                      <span className="text-sm">{company.name}</span>
                                      <div className="text-xs text-gray-500">
                                        {company.emissions.toLocaleString('pt-BR')} kg CO₂
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
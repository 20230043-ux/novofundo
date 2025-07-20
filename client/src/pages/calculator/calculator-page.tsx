import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Car, 
  Factory, 
  Home, 
  Lightbulb, 
  Plane, 
  Zap,
  AlertTriangle,
  ThumbsUp,
  Info,
  Activity
} from "lucide-react";

// Define schema for calculator form
const calculatorSchema = z.object({
  // Descrição/Nome
  description: z.string().optional(),
  
  // Transporte
  transporteCarroKm: z.coerce.number().min(0, "Valor inválido").default(0),
  transporteCarroTipo: z.string().default("gasolina"),
  transportePublicoKm: z.coerce.number().min(0, "Valor inválido").default(0),
  transporteAereoHoras: z.coerce.number().min(0, "Valor inválido").default(0),
  
  // Consumo de energia
  energiaEletricaKwh: z.coerce.number().min(0, "Valor inválido").default(0),
  energiaFonte: z.string().default("convencional"),
  gasNaturalM3: z.coerce.number().min(0, "Valor inválido").default(0),
  
  // Habitação
  tamanhoMoradia: z.coerce.number().min(10, "Mínimo de 10m²").default(100),
  numeroResidentes: z.coerce.number().min(1, "Mínimo 1 residente").default(1),
  
  // Alimentação
  consumoCarne: z.string().default("moderado"),
  consumoLocal: z.coerce.number().min(0, "Valor inválido").max(100, "Máximo 100%").default(50),
  desperdicio: z.coerce.number().min(0, "Valor inválido").max(100, "Máximo 100%").default(20),
  
  // Consumo geral
  consumoMensal: z.coerce.number().min(0, "Valor inválido").default(1000), // em Kz
});

type CalculatorValues = z.infer<typeof calculatorSchema>;

// Emission factors (kg CO2e)
const emissionFactors = {
  // Transporte (kg CO2e per km)
  carro: {
    gasolina: 0.192,
    diesel: 0.171,
    eletrico: 0.053,
    hibrido: 0.106
  },
  transporte_publico: 0.096,
  aviao: 0.255, // por km
  
  // Energia (kg CO2e)
  eletricidade: {
    convencional: 0.0817, // por kWh
    renovavel: 0.0204,    // por kWh
  },
  gas_natural: 2.03,      // por m³
  
  // Alimentação (kg CO2e por dia)
  alimentacao: {
    vegetariano: 2.89,
    pouco: 3.81,
    moderado: 4.67,
    alto: 7.19
  },
  
  // Outros (kg CO2e por kwanza)
  consumo: 0.0008,
  
  // Habitação (kg CO2e por m² por ano)
  moradia: 70,
};

// Função para calcular emissões totais
const calcularEmissoes = (values: CalculatorValues) => {
  // Transporte
  const emissoesCarroAnual = values.transporteCarroKm * 365/7 * 
    emissionFactors.carro[values.transporteCarroTipo as keyof typeof emissionFactors.carro];
  
  const emissoesTransportePublico = values.transportePublicoKm * 365/7 * 
    emissionFactors.transporte_publico;
  
  const emissoesAereas = values.transporteAereoHoras * 800 * // estimado 800km/h média
    emissionFactors.aviao;
  
  // Energia
  const emissoesEletricidade = values.energiaEletricaKwh * 12 * 
    emissionFactors.eletricidade[values.energiaFonte as keyof typeof emissionFactors.eletricidade];
  
  const emissoesGas = values.gasNaturalM3 * 12 * emissionFactors.gas_natural;
  
  // Habitação
  const emissoesMoradia = values.tamanhoMoradia * emissionFactors.moradia / values.numeroResidentes;
  
  // Alimentação
  const emissoesAlimentacao = emissionFactors.alimentacao[values.consumoCarne as keyof typeof emissionFactors.alimentacao] * 365;
  
  // Fator de redução baseado em consumo local e desperdício
  const fatorReducaoAlimentacao = (values.consumoLocal / 100) * 0.2; // até 20% de redução
  const fatorAumentoDespericio = (values.desperdicio / 100) * 0.3; // até 30% de aumento
  
  const emissoesAlimentacaoAjustadas = emissoesAlimentacao * 
    (1 - fatorReducaoAlimentacao + fatorAumentoDespericio);
  
  // Consumo geral
  const emissoesConsumo = values.consumoMensal * 12 * emissionFactors.consumo;
  
  // Cálculo das emissões por categoria
  const categorias = {
    transporte: emissoesCarroAnual + emissoesTransportePublico + emissoesAereas,
    energia: emissoesEletricidade + emissoesGas,
    moradia: emissoesMoradia,
    alimentacao: emissoesAlimentacaoAjustadas,
    consumo: emissoesConsumo
  };
  
  // Total anual em toneladas
  const totalAnual = Object.values(categorias).reduce((sum, val) => sum + val, 0) / 1000;
  
  return {
    categorias,
    totalAnual,
    mediaGlobal: 4.7, // média global por pessoa (toneladas)
    mediaBrasil: 2.3  // média brasileira por pessoa (toneladas)
  };
};

// Função para gerar recomendações personalizadas
const gerarRecomendacoes = (values: CalculatorValues, resultados: ReturnType<typeof calcularEmissoes>) => {
  const recomendacoes: Array<{
    categoria: string;
    titulo: string;
    descricao: string;
    impacto: "alto" | "medio" | "baixo";
    icon: JSX.Element;
  }> = [];
  
  // Transporte
  if (values.transporteCarroKm > 100) {
    if (values.transporteCarroTipo === "gasolina" || values.transporteCarroTipo === "diesel") {
      recomendacoes.push({
        categoria: "transporte",
        titulo: "Considere um veículo mais eficiente",
        descricao: "Trocar para um veículo híbrido ou elétrico pode reduzir suas emissões em até 75%.",
        impacto: "alto",
        icon: <Car className="h-5 w-5" />
      });
    }
    
    recomendacoes.push({
      categoria: "transporte",
      titulo: "Reduza o uso do carro",
      descricao: "Tente usar transporte público, bicicleta ou caminhada para trajetos curtos.",
      impacto: "medio",
      icon: <Car className="h-5 w-5" />
    });
  }
  
  if (values.transporteAereoHoras > 10) {
    recomendacoes.push({
      categoria: "transporte",
      titulo: "Compense suas viagens aéreas",
      descricao: "Investir em projetos de compensação de carbono pode neutralizar o impacto das suas viagens.",
      impacto: "medio",
      icon: <Plane className="h-5 w-5" />
    });
  }
  
  // Energia
  if (values.energiaFonte === "convencional") {
    recomendacoes.push({
      categoria: "energia",
      titulo: "Mude para energia renovável",
      descricao: "Considere instalar painéis solares ou contratar energia de fontes renováveis.",
      impacto: "alto",
      icon: <Zap className="h-5 w-5" />
    });
  }
  
  if (values.energiaEletricaKwh > 300) {
    recomendacoes.push({
      categoria: "energia",
      titulo: "Reduza o consumo de eletricidade",
      descricao: "Use aparelhos mais eficientes, desligue-os quando não estiver usando e substitua lâmpadas por LED.",
      impacto: "medio",
      icon: <Lightbulb className="h-5 w-5" />
    });
  }
  
  // Habitação
  if (values.tamanhoMoradia / values.numeroResidentes > 50) {
    recomendacoes.push({
      categoria: "moradia",
      titulo: "Otimize o espaço da sua moradia",
      descricao: "Moradias menores consomem menos energia para aquecimento, refrigeração e iluminação.",
      impacto: "baixo",
      icon: <Home className="h-5 w-5" />
    });
  }
  
  // Alimentação
  if (values.consumoCarne === "alto" || values.consumoCarne === "moderado") {
    recomendacoes.push({
      categoria: "alimentacao",
      titulo: "Reduza o consumo de carne",
      descricao: "Diminuir o consumo de carne, especialmente vermelha, pode reduzir significativamente sua pegada de carbono.",
      impacto: "alto",
      icon: <Info className="h-5 w-5" />
    });
  }
  
  if (values.consumoLocal < 30) {
    recomendacoes.push({
      categoria: "alimentacao",
      titulo: "Priorize alimentos locais e sazonais",
      descricao: "Alimentos locais requerem menos transporte e emitem menos CO2.",
      impacto: "medio",
      icon: <Info className="h-5 w-5" />
    });
  }
  
  if (values.desperdicio > 15) {
    recomendacoes.push({
      categoria: "alimentacao",
      titulo: "Reduza o desperdício de alimentos",
      descricao: "Planejar refeições, armazenar adequadamente e aproveitar sobras pode reduzir o desperdício.",
      impacto: "medio",
      icon: <AlertTriangle className="h-5 w-5" />
    });
  }
  
  // Consumo
  if (values.consumoMensal > 800) {
    recomendacoes.push({
      categoria: "consumo",
      titulo: "Adote um consumo mais consciente",
      descricao: "Prefira produtos durávais, recicle e conserte itens ao invés de substituí-los.",
      impacto: "medio",
      icon: <Factory className="h-5 w-5" />
    });
  }
  
  return recomendacoes;
};

// Obter cor baseada no nível de emissão comparado com a média
const getEmissionLevelColor = (emissions: number, average: number) => {
  if (emissions < average * 0.5) return "text-green-500";
  if (emissions < average) return "text-yellow-500";
  if (emissions < average * 1.5) return "text-orange-500";
  return "text-red-500";
};

// Obter mensagem baseada no nível de emissão
const getEmissionLevelMessage = (emissions: number, average: number) => {
  if (emissions < average * 0.5) {
    return {
      title: "Parabéns! Sua pegada de carbono está bem abaixo da média.",
      description: "Continue com essas práticas sustentáveis e inspire outros a seguir seu exemplo!",
      icon: <ThumbsUp className="h-5 w-5" />
    };
  }
  
  if (emissions < average) {
    return {
      title: "Bom trabalho! Sua pegada está abaixo da média.",
      description: "Você está no caminho certo, mas ainda há espaço para melhorias.",
      icon: <ThumbsUp className="h-5 w-5" />
    };
  }
  
  if (emissions < average * 1.5) {
    return {
      title: "Sua pegada de carbono está acima da média.",
      description: "Considere implementar algumas das nossas recomendações para reduzir seu impacto.",
      icon: <AlertTriangle className="h-5 w-5" />
    };
  }
  
  return {
    title: "Sua pegada de carbono está significativamente acima da média.",
    description: "Implementar as recomendações sugeridas pode ajudar a reduzir seu impacto ambiental.",
    icon: <AlertTriangle className="h-5 w-5" />
  };
};

export default function CarbonCalculatorPage() {
  const [resultados, setResultados] = useState<ReturnType<typeof calcularEmissoes> | null>(null);
  const [recomendacoes, setRecomendacoes] = useState<ReturnType<typeof gerarRecomendacoes>>([]);
  
  // Inicializar formulário
  const form = useForm<CalculatorValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      description: '',
      transporteCarroKm: 100,
      transporteCarroTipo: "gasolina",
      transportePublicoKm: 50,
      transporteAereoHoras: 10,
      
      energiaEletricaKwh: 200,
      energiaFonte: "convencional",
      gasNaturalM3: 15,
      
      tamanhoMoradia: 80,
      numeroResidentes: 2,
      
      consumoCarne: "moderado",
      consumoLocal: 30,
      desperdicio: 20,
      
      consumoMensal: 1000,
    }
  });
  
  // Ao enviar o formulário
  const onSubmit = (values: CalculatorValues) => {
    const results = calcularEmissoes(values);
    setResultados(results);
    
    const recommendations = gerarRecomendacoes(values, results);
    setRecomendacoes(recommendations);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Calculadora de Pegada de Carbono</h1>
            <p className="text-gray-600 mb-6">
              Descubra o impacto ambiental das suas atividades diárias e receba recomendações personalizadas
              para reduzir sua pegada de carbono.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-primary" />
                    Calcule seu Impacto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Responda perguntas sobre seu estilo de vida para calcular suas emissões de CO2.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Info className="mr-2 h-5 w-5 text-primary" />
                    Entenda seus Resultados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Visualize suas emissões por categoria e compare com médias globais.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <ThumbsUp className="mr-2 h-5 w-5 text-primary" />
                    Receba Dicas Personalizadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Obtenha recomendações específicas para reduzir sua pegada ecológica.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Preencha os campos abaixo com informações sobre seu estilo de vida
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Campo de Descrição */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Cálculo (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Escritório Central Janeiro 2025, Filial Luanda, Fábrica Principal..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Dê um nome para identificar este cálculo de pegada de carbono
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Tabs defaultValue="transporte" className="w-full">
                      <TabsList className="grid grid-cols-5 mb-6">
                        <TabsTrigger value="transporte" className="flex items-center justify-center">
                          <Car className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Transporte</span>
                        </TabsTrigger>
                        <TabsTrigger value="energia" className="flex items-center justify-center">
                          <Zap className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Energia</span>
                        </TabsTrigger>
                        <TabsTrigger value="moradia" className="flex items-center justify-center">
                          <Home className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Moradia</span>
                        </TabsTrigger>
                        <TabsTrigger value="alimentacao" className="flex items-center justify-center">
                          <Info className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Alimentação</span>
                        </TabsTrigger>
                        <TabsTrigger value="consumo" className="flex items-center justify-center">
                          <Factory className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Consumo</span>
                        </TabsTrigger>
                      </TabsList>
                      
                      {/* Transporte */}
                      <TabsContent value="transporte">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="transporteCarroKm"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quilômetros percorridos de carro por semana</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="0"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Estimativa da distância que você dirige por semana
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="transporteCarroTipo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de combustível do seu veículo</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o tipo de combustível" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="gasolina">Gasolina</SelectItem>
                                    <SelectItem value="diesel">Diesel</SelectItem>
                                    <SelectItem value="hibrido">Híbrido</SelectItem>
                                    <SelectItem value="eletrico">Elétrico</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="transportePublicoKm"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quilômetros percorridos em transporte público por semana</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="0"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="transporteAereoHoras"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Horas de voo por ano</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="0"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Estimativa do tempo total em voos durante o ano
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                      
                      {/* Energia */}
                      <TabsContent value="energia">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="energiaEletricaKwh"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Consumo mensal de eletricidade (kWh)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="0"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Você pode encontrar essa informação na sua conta de luz
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="energiaFonte"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fonte de energia elétrica</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione a fonte de energia" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="convencional">Convencional (rede)</SelectItem>
                                    <SelectItem value="renovavel">Renovável (solar, eólica)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="gasNaturalM3"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Consumo mensal de gás natural (m³)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="0"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Deixe 0 se não utilizar gás natural
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                      
                      {/* Moradia */}
                      <TabsContent value="moradia">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="tamanhoMoradia"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tamanho da moradia (m²)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="10"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="numeroResidentes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número de residentes</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="1"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Número de pessoas que moram na residência
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                      
                      {/* Alimentação */}
                      <TabsContent value="alimentacao">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="consumoCarne"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Consumo de carne</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione seu nível de consumo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="vegetariano">Vegetariano/Vegano</SelectItem>
                                    <SelectItem value="pouco">Pouco (1-2 vezes por semana)</SelectItem>
                                    <SelectItem value="moderado">Moderado (3-5 vezes por semana)</SelectItem>
                                    <SelectItem value="alto">Alto (Diariamente)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="consumoLocal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Porcentagem de alimentos locais/regionais: {field.value}%
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    defaultValue={[field.value]}
                                    min={0}
                                    max={100}
                                    step={5}
                                    onValueChange={(vals) => field.onChange(vals[0])}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Alimentos produzidos localmente têm menor pegada de carbono
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="desperdicio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Desperdício de alimentos: {field.value}%
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    defaultValue={[field.value]}
                                    min={0}
                                    max={100}
                                    step={5}
                                    onValueChange={(vals) => field.onChange(vals[0])}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Estimativa do quanto dos alimentos comprados são desperdiçados
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                      
                      {/* Consumo */}
                      <TabsContent value="consumo">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="consumoMensal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gastos mensais com consumo geral (Kz)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="0"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Estimativa de gastos com roupas, eletrônicos, lazer, etc.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <div className="flex justify-end">
                      <Button type="submit" size="lg">
                        Calcular Pegada de Carbono
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {resultados && (
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Resultado: Sua Pegada de Carbono</CardTitle>
                    <CardDescription>
                      Com base nas informações fornecidas, calculamos suas emissões anuais de CO2
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left">
                        <h3 className="text-lg text-gray-600 mb-1">Sua pegada anual</h3>
                        <p className={`text-4xl font-bold ${getEmissionLevelColor(resultados.totalAnual, resultados.mediaBrasil)}`}>
                          {resultados.totalAnual.toFixed(2)} <span className="text-2xl">toneladas CO2e</span>
                        </p>
                        <div className="flex items-center justify-center md:justify-start mt-2">
                          <div className="flex items-center mr-4">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                            <span className="text-sm">Você</span>
                          </div>
                          <div className="flex items-center mr-4">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                            <span className="text-sm">Angola: {resultados.mediaBrasil}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                            <span className="text-sm">Global: {resultados.mediaGlobal}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-32 w-full md:w-1/2">
                        <div className="h-8 flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className="bg-blue-500 h-4 rounded-full" 
                              style={{ width: `${Math.min((resultados.totalAnual / 10) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span>2.5</span>
                          <span>5</span>
                          <span>7.5</span>
                          <span>10+</span>
                        </div>
                        
                        <div className="mt-6">
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>
                              {getEmissionLevelMessage(resultados.totalAnual, resultados.mediaBrasil).title}
                            </AlertTitle>
                            <AlertDescription>
                              {getEmissionLevelMessage(resultados.totalAnual, resultados.mediaBrasil).description}
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <h3 className="font-medium text-gray-800 mb-4">Emissões por categoria</h3>
                      <div className="space-y-4">
                        {Object.entries(resultados.categorias).map(([categoria, valor]) => {
                          const categoriaLabel = {
                            transporte: "Transporte",
                            energia: "Energia",
                            moradia: "Moradia",
                            alimentacao: "Alimentação",
                            consumo: "Consumo"
                          }[categoria];
                          
                          const percentual = (valor / (resultados.totalAnual * 1000)) * 100;
                          
                          return (
                            <div key={categoria}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">{categoriaLabel}</span>
                                <span className="text-sm text-gray-500">
                                  {(valor / 1000).toFixed(2)} toneladas ({percentual.toFixed(0)}%)
                                </span>
                              </div>
                              <Progress value={percentual} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {recomendacoes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recomendações Personalizadas</CardTitle>
                      <CardDescription>
                        Com base no seu perfil, aqui estão algumas sugestões para reduzir sua pegada de carbono
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recomendacoes.map((rec, index) => (
                          <Alert key={index}>
                            {rec.icon}
                            <AlertTitle className="flex items-center">
                              {rec.titulo}
                              <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                rec.impacto === 'alto' 
                                  ? 'bg-green-100 text-green-800' 
                                  : rec.impacto === 'medio'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}>
                                {rec.impacto === 'alto' 
                                  ? 'Alto impacto' 
                                  : rec.impacto === 'medio'
                                    ? 'Médio impacto'
                                    : 'Baixo impacto'
                                }
                              </span>
                            </AlertTitle>
                            <AlertDescription>
                              {rec.descricao}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
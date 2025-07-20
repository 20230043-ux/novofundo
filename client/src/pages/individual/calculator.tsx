import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calculator, 
  Zap, 
  Car, 
  Droplets, 
  Trash2, 
  Leaf, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Calendar
} from "lucide-react";
import { Link } from "wouter";

// Emission factors (kg CO2 per unit)
const EMISSION_FACTORS = {
  energy: 0.85, // kg CO2 per kWh
  gasoline: 2.31, // kg CO2 per liter
  diesel: 2.68, // kg CO2 per liter
  car: 0.21, // kg CO2 per km
  bus: 0.105, // kg CO2 per km
  motorcycle: 0.14, // kg CO2 per km
  water: 0.298, // kg CO2 per m³
  waste: 0.5, // kg CO2 per kg
};

// Compensation value (1 kg CO2 = 100 Kz)
const COMPENSATION_RATE = 100;

// Form validation schema
const consumptionSchema = z.object({
  description: z.string().optional(),
  energyKwh: z.coerce.number().min(0, "Valor deve ser positivo").optional(),
  fuelLiters: z.coerce.number().min(0, "Valor deve ser positivo").optional(),
  fuelTypes: z.array(z.string()).optional(),
  transportKm: z.coerce.number().min(0, "Valor deve ser positivo").optional(),
  transportTypes: z.array(z.string()).optional(),
  waterM3: z.coerce.number().min(0, "Valor deve ser positivo").optional(),
  wasteKg: z.coerce.number().min(0, "Valor deve ser positivo").optional(),
  period: z.enum(["daily", "weekly", "monthly", "yearly"]),
  day: z.coerce.number().min(1).max(31).optional(),
  month: z.string().optional(),
  year: z.coerce.number().min(2020).max(2030),
  emissionKgCo2: z.coerce.number().min(0),
  compensationValueKz: z.coerce.number().min(0),
});

type ConsumptionFormValues = z.infer<typeof consumptionSchema>;

const IndividualCalculator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [totalEmission, setTotalEmission] = useState(0);
  const [compensationValue, setCompensationValue] = useState(0);
  const [isCalculated, setIsCalculated] = useState(false);
  
  // Fetch consumption records
  const { data: consumptionRecords, isLoading } = useQuery({
    queryKey: ['/api/individual/consumption'],
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Create consumption mutation
  const createConsumptionMutation = useMutation({
    mutationFn: async (data: ConsumptionFormValues) => {
      const res = await apiRequest("POST", "/api/individual/consumption", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/individual/consumption'] });
      queryClient.invalidateQueries({ queryKey: ['/api/individual/stats'] });
      toast({
        title: "Consumo registrado",
        description: "Dados de consumo salvos com sucesso!",
      });
      form.reset();
      setIsCalculated(false);
      setTotalEmission(0);
      setCompensationValue(0);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar os dados.",
        variant: "destructive",
      });
    },
  });
  
  // Initialize form
  const form = useForm<ConsumptionFormValues>({
    resolver: zodResolver(consumptionSchema),
    defaultValues: {
      description: '',
      energyKwh: undefined,
      fuelLiters: undefined,
      fuelTypes: [],
      transportKm: undefined,
      transportTypes: [],
      waterM3: undefined,
      wasteKg: undefined,
      period: "monthly",
      day: undefined,
      month: '',
      year: new Date().getFullYear(),
      emissionKgCo2: 0,
      compensationValueKz: 0,
    },
  });
  
  // Watch form values to calculate emission in real time
  const energyKwh = form.watch("energyKwh") ?? 0;
  const fuelLiters = form.watch("fuelLiters") ?? 0;
  const fuelTypes = form.watch("fuelTypes") || [];
  const transportKm = form.watch("transportKm") ?? 0;
  const transportTypes = form.watch("transportTypes") || [];
  const waterM3 = form.watch("waterM3") ?? 0;
  const wasteKg = form.watch("wasteKg") ?? 0;
  const period = form.watch("period");
  
  // Function to calculate emissions
  const calculateEmissions = () => {
    // Calculate energy emissions
    const energyEmission = energyKwh * EMISSION_FACTORS.energy;
    
    // Calculate fuel emissions (average of selected fuel types)
    let fuelEmission = 0;
    if (fuelTypes.length > 0) {
      const avgFactor = fuelTypes.reduce((sum, type) => {
        return sum + (EMISSION_FACTORS[type as keyof typeof EMISSION_FACTORS] || 0);
      }, 0) / fuelTypes.length;
      fuelEmission = fuelLiters * avgFactor;
    }
    
    // Calculate transport emissions
    let transportEmission = 0;
    if (transportTypes.length > 0) {
      const avgFactor = transportTypes.reduce((sum, type) => {
        return sum + (EMISSION_FACTORS[type as keyof typeof EMISSION_FACTORS] || 0);
      }, 0) / transportTypes.length;
      transportEmission = transportKm * avgFactor;
    }
    
    // Calculate water and waste emissions
    const waterEmission = waterM3 * EMISSION_FACTORS.water;
    const wasteEmission = wasteKg * EMISSION_FACTORS.waste;
    
    // Total emission
    const total = energyEmission + fuelEmission + transportEmission + waterEmission + wasteEmission;
    const compensation = total * COMPENSATION_RATE;
    
    setTotalEmission(total);
    setCompensationValue(compensation);
    setIsCalculated(true);
    
    // Update form with calculated values
    form.setValue("emissionKgCo2", total);
    form.setValue("compensationValueKz", compensation);
    
    toast({
      title: "Cálculo realizado",
      description: "Pegada de carbono calculada com sucesso!",
    });
  };
  
  const onCalculate = () => {
    // Ensure at least one consumption type is provided
    if (
      (energyKwh === 0 || !energyKwh) &&
      (fuelLiters === 0 || !fuelLiters) &&
      (transportKm === 0 || !transportKm) &&
      (waterM3 === 0 || !waterM3) &&
      (wasteKg === 0 || !wasteKg)
    ) {
      toast({
        title: "Dados insuficientes",
        description: "Informe pelo menos um tipo de consumo.",
        variant: "destructive",
      });
      return;
    }
    
    calculateEmissions();
  };

  const onSubmit = (data: ConsumptionFormValues) => {
    if (!isCalculated) {
      toast({
        title: "Calcule primeiro",
        description: "Por favor, calcule a pegada de carbono antes de salvar.",
        variant: "destructive",
      });
      return;
    }
    
    createConsumptionMutation.mutate(data);
  };
  
  // Format numbers
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-8 w-8 text-primary" />
              Calculadora de Pegada de Carbono
            </h1>
            <p className="text-gray-600 mt-2">
              Calcule sua pegada de carbono pessoal e veja quanto precisa investir para compensar
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dados de Consumo</CardTitle>
                  <CardDescription>
                    Informe seus dados de consumo para calcular a pegada de carbono
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Description Field */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Cálculo (Opcional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Consumo Janeiro 2025, Casa Principal, Escritório..."
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
                      
                      <Separator />
                      
                      {/* Period - Moved to top */}
                      <div className="p-4 border border-gray-200 rounded-md bg-blue-50">
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="h-5 w-5 text-blue-500" />
                          <h3 className="font-medium text-gray-900">Período de Consumo</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="period"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Período</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o período" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="daily">Diário</SelectItem>
                                    <SelectItem value="weekly">Semanal</SelectItem>
                                    <SelectItem value="monthly">Mensal</SelectItem>
                                    <SelectItem value="yearly">Anual</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {period !== "yearly" && (
                            <FormField
                              control={form.control}
                              name="month"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Mês</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione o mês" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Array.from({ length: 12 }, (_, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                          {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          
                          <FormField
                            control={form.control}
                            name="year"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ano</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="2024"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Energy consumption */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-500" />
                          <h3 className="font-medium text-gray-900">Consumo de Energia</h3>
                        </div>
                        <FormField
                          control={form.control}
                          name="energyKwh"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Energia Elétrica (kWh)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Ex: 150"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Consumo de energia elétrica em kWh × 0,85 kg CO₂/kWh
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      {/* Fuel consumption */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-5 w-5 text-blue-500" />
                          <h3 className="font-medium text-gray-900">Consumo de Combustível</h3>
                        </div>
                        <FormField
                          control={form.control}
                          name="fuelLiters"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Combustível (Litros)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Ex: 50"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Litros de combustível × fator de emissão (gasolina: 2,31 kg CO₂/L, diesel: 2,68 kg CO₂/L)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fuelTypes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipos de Combustível</FormLabel>
                              <div className="space-y-2">
                                {['gasoline', 'diesel'].map((type) => (
                                  <div key={type} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={type}
                                      checked={field.value?.includes(type)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...field.value, type]);
                                        } else {
                                          field.onChange(field.value?.filter(t => t !== type));
                                        }
                                      }}
                                    />
                                    <label htmlFor={type} className="text-sm font-medium">
                                      {type === 'gasoline' ? 'Gasolina' : 'Diesel'}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      {/* Transport */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-5 w-5 text-green-500" />
                          <h3 className="font-medium text-gray-900">Transporte</h3>
                        </div>
                        <FormField
                          control={form.control}
                          name="transportKm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Distância Percorrida (km)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Ex: 100"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Quilômetros × fator de emissão (carro: 0,21 kg CO₂/km, ônibus: 0,105 kg CO₂/km, moto: 0,14 kg CO₂/km)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="transportTypes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipos de Transporte</FormLabel>
                              <div className="space-y-2">
                                {['car', 'bus', 'motorcycle'].map((type) => (
                                  <div key={type} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={type}
                                      checked={field.value?.includes(type)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...field.value, type]);
                                        } else {
                                          field.onChange(field.value?.filter(t => t !== type));
                                        }
                                      }}
                                    />
                                    <label htmlFor={type} className="text-sm font-medium">
                                      {type === 'car' ? 'Carro' : type === 'bus' ? 'Ônibus' : 'Moto'}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      {/* Water and Waste */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Droplets className="h-5 w-5 text-blue-500" />
                            <h3 className="font-medium text-gray-900">Água</h3>
                          </div>
                          <FormField
                            control={form.control}
                            name="waterM3"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Consumo de Água (m³)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Ex: 15"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Metros cúbicos × 0,298 kg CO₂/m³
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-500" />
                            <h3 className="font-medium text-gray-900">Resíduos</h3>
                          </div>
                          <FormField
                            control={form.control}
                            name="wasteKg"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Resíduos Gerados (kg)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Ex: 20"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Quilogramas × 0,5 kg CO₂/kg
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Button 
                          type="button" 
                          onClick={onCalculate}
                          className="w-full"
                          variant="outline"
                        >
                          <Calculator className="h-4 w-4 mr-2" />
                          Calcular Pegada de Carbono
                        </Button>
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={!isCalculated || createConsumptionMutation.isPending}
                        >
                          {createConsumptionMutation.isPending ? "Salvando..." : "Salvar Dados"}
                        </Button>
                      </div>

                      {/* Calculation Summary */}
                      {isCalculated && totalEmission > 0 && (
                        <Card className="mt-6">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Calculator className="h-5 w-5 text-blue-500" />
                              Resumo do Cálculo
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {energyKwh > 0 && (
                              <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                                <span className="text-sm">Energia: {formatNumber(energyKwh)} kWh × 0,85</span>
                                <span className="font-medium">{formatNumber(energyKwh * EMISSION_FACTORS.energy)} kg CO₂</span>
                              </div>
                            )}
                            
                            {fuelLiters > 0 && fuelTypes.length > 0 && (
                              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                                <span className="text-sm">
                                  Combustível: {formatNumber(fuelLiters)} L × {formatNumber(
                                    fuelTypes.reduce((sum, type) => 
                                      sum + (EMISSION_FACTORS[type as keyof typeof EMISSION_FACTORS] || 0), 0
                                    ) / fuelTypes.length
                                  )}
                                </span>
                                <span className="font-medium">
                                  {formatNumber(fuelLiters * (fuelTypes.reduce((sum, type) => 
                                    sum + (EMISSION_FACTORS[type as keyof typeof EMISSION_FACTORS] || 0), 0
                                  ) / fuelTypes.length))} kg CO₂
                                </span>
                              </div>
                            )}
                            
                            {transportKm > 0 && transportTypes.length > 0 && (
                              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                                <span className="text-sm">
                                  Transporte: {formatNumber(transportKm)} km × {formatNumber(
                                    transportTypes.reduce((sum, type) => 
                                      sum + (EMISSION_FACTORS[type as keyof typeof EMISSION_FACTORS] || 0), 0
                                    ) / transportTypes.length
                                  )}
                                </span>
                                <span className="font-medium">
                                  {formatNumber(transportKm * (transportTypes.reduce((sum, type) => 
                                    sum + (EMISSION_FACTORS[type as keyof typeof EMISSION_FACTORS] || 0), 0
                                  ) / transportTypes.length))} kg CO₂
                                </span>
                              </div>
                            )}
                            
                            {waterM3 > 0 && (
                              <div className="flex justify-between items-center p-2 bg-cyan-50 rounded">
                                <span className="text-sm">Água: {formatNumber(waterM3)} m³ × 0,298</span>
                                <span className="font-medium">{formatNumber(waterM3 * EMISSION_FACTORS.water)} kg CO₂</span>
                              </div>
                            )}
                            
                            {wasteKg > 0 && (
                              <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                                <span className="text-sm">Resíduos: {formatNumber(wasteKg)} kg × 0,5</span>
                                <span className="font-medium">{formatNumber(wasteKg * EMISSION_FACTORS.waste)} kg CO₂</span>
                              </div>
                            )}
                            
                            <div className="border-t pt-2">
                              <div className="flex justify-between items-center p-2 bg-gray-100 rounded font-bold">
                                <span>Total de Emissões:</span>
                                <span className="text-red-600">{formatNumber(totalEmission)} kg CO₂</span>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-green-100 rounded font-bold mt-2">
                                <span>Valor de Compensação:</span>
                                <span className="text-green-600">{formatCurrency(compensationValue)} Kz</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            {/* Results */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-500" />
                    Resultado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatNumber(totalEmission)} kg CO₂
                    </div>
                    <div className="text-sm text-gray-600">Pegada de Carbono</div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(compensationValue)} Kz
                    </div>
                    <div className="text-sm text-gray-600">Valor da Compensação</div>
                  </div>
                  
                  {totalEmission > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Para compensar sua pegada de carbono, você precisa investir {formatCurrency(compensationValue)} Kz em projetos sustentáveis.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {totalEmission > 0 && (
                    <div className="space-y-2">
                      <Link href="/individual/payment-proof">
                        <Button className="w-full" variant="default">
                          Enviar Comprovativo de Pagamento
                        </Button>
                      </Link>
                      <Link href="/individual/investments">
                        <Button className="w-full" variant="outline">
                          Ver Projetos Disponíveis
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Recent records */}
              {consumptionRecords && consumptionRecords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Últimos Registros
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {consumptionRecords.slice(0, 3).map((record: any) => (
                        <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{record.period}</div>
                            <div className="text-sm text-gray-600">
                              {record.month}/{record.year}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-red-600">
                              {formatNumber(record.emissionKgCo2)} kg CO₂
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatCurrency(record.compensationValueKz)} Kz
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default IndividualCalculator;
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Sidebar from "@/components/layout/sidebar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Droplet, Car, CalculatorIcon, AlertCircle, Check, Flame, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";

// Define the form schema
const consumptionSchema = z.object({
  energyKwh: z.coerce.number().min(0, "Deve ser um número positivo").optional(),
  fuelLiters: z.coerce.number().min(0, "Deve ser um número positivo").optional(),
  fuelTypes: z.array(z.string()).optional(),
  transportKm: z.coerce.number().min(0, "Deve ser um número positivo").optional(),
  transportTypes: z.array(z.string()).optional(),
  waterM3: z.coerce.number().min(0, "Deve ser um número positivo").optional(),
  wasteKg: z.coerce.number().min(0, "Deve ser um número positivo").optional(),
  period: z.string().min(1, "Selecione um tipo de período"),
  month: z.string().optional(),
  year: z.coerce.number().min(2020).max(2030),
  emissionKgCo2: z.coerce.number().min(0),
  compensationValueKz: z.coerce.number().min(0),
});

type ConsumptionFormValues = z.infer<typeof consumptionSchema>;

// Transport types with labels for checkbox
const transportTypeOptions = [
  { id: "car", label: "Carro" },
  { id: "truck", label: "Caminhão" },
  { id: "airplane", label: "Avião" },
  { id: "ship", label: "Navio" },
  { id: "motorcycle", label: "Motocicleta" },
];

// Fuel types with labels for checkbox
const fuelTypeOptions = [
  { id: "diesel", label: "Diesel" },
  { id: "gasoline", label: "Gasolina" },
  { id: "natural_gas", label: "Gás Natural" },
  { id: "ethanol", label: "Etanol" },
  { id: "electricity", label: "Eletricidade" },
];

// Emission factors
const EMISSION_FACTORS = {
  energy: 0.5, // kg CO2 per kWh
  fuel: {
    diesel: 2.68, // kg CO2 per liter
    gasoline: 2.31, // kg CO2 per liter
    natural_gas: 2.02, // kg CO2 per m³
    ethanol: 1.5, // kg CO2 per liter
    electricity: 0.1, // kg CO2 per kWh (for electric vehicles)
  },
  transport: {
    car: 0.12, // kg CO2 per km
    truck: 0.3, // kg CO2 per km
    airplane: 0.15, // kg CO2 per km
    ship: 0.04, // kg CO2 per km
    motorcycle: 0.08, // kg CO2 per km
  },
  waste: 2.53, // kg CO2 per kg of waste
};

// Compensation rate
const COMPENSATION_RATE = 50; // Kz per kg CO2

const CompanyConsumption = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [totalEmission, setTotalEmission] = useState(0);
  const [compensationValue, setCompensationValue] = useState(0);
  
  // Fetch consumption records
  const { data: consumptionRecords, isLoading } = useQuery({
    queryKey: ['/api/company/consumption'],
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Initialize form
  const form = useForm<ConsumptionFormValues>({
    resolver: zodResolver(consumptionSchema),
    defaultValues: {
      energyKwh: 0,
      fuelLiters: 0,
      fuelTypes: [],
      transportKm: 0,
      transportTypes: [],
      waterM3: 0,
      wasteKg: 0,
      period: "monthly",
      month: '',
      year: new Date().getFullYear(),
      emissionKgCo2: 0,
      compensationValueKz: 0,
    },
  });
  
  // Watch form values to calculate emission in real time
  const energyKwh = form.watch("energyKwh") || 0;
  const fuelLiters = form.watch("fuelLiters") || 0;
  const fuelTypes = form.watch("fuelTypes") || [];
  const transportKm = form.watch("transportKm") || 0;
  const transportTypes = form.watch("transportTypes") || [];
  const waterM3 = form.watch("waterM3") || 0;
  const wasteKg = form.watch("wasteKg") || 0;
  
  // Update calculations when form values change
  useEffect(() => {
    // Calculate energy emissions
    const energyEmission = energyKwh * EMISSION_FACTORS.energy;
    
    // Calculate fuel emissions (average of selected fuel types)
    let fuelEmission = 0;
    if (fuelTypes.length > 0 && fuelLiters > 0) {
      const fuelEmissionSum = fuelTypes.reduce((sum, type) => {
        return sum + fuelLiters * (EMISSION_FACTORS.fuel[type as keyof typeof EMISSION_FACTORS.fuel] || 0);
      }, 0);
      fuelEmission = fuelEmissionSum / fuelTypes.length;
    }
    
    // Calculate transport emissions (average of selected transport types)
    let transportEmission = 0;
    if (transportTypes.length > 0 && transportKm > 0) {
      const transportEmissionSum = transportTypes.reduce((sum, type) => {
        return sum + transportKm * (EMISSION_FACTORS.transport[type as keyof typeof EMISSION_FACTORS.transport] || 0);
      }, 0);
      transportEmission = transportEmissionSum / transportTypes.length;
    }
    
    // Calculate waste emissions
    const wasteEmission = wasteKg * EMISSION_FACTORS.waste;
    
    // Calculate total emission
    const totalEmission = energyEmission + fuelEmission + transportEmission + wasteEmission;
    setTotalEmission(totalEmission);
    
    // Calculate compensation value
    const compensationValue = totalEmission * COMPENSATION_RATE;
    setCompensationValue(compensationValue);
    
    // Update form values
    form.setValue("emissionKgCo2", totalEmission);
    form.setValue("compensationValueKz", compensationValue);
  }, [energyKwh, fuelLiters, fuelTypes, transportKm, transportTypes, waterM3, wasteKg, form]);
  
  // Create consumption record
  const createConsumptionMutation = useMutation({
    mutationFn: async (data: ConsumptionFormValues) => {
      const res = await apiRequest("POST", "/api/company/consumption", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company/consumption'] });
      
      // Notify other tabs/windows about the consumption update to refresh admin stats
      localStorage.setItem('consumption-updated', Date.now().toString());
      localStorage.setItem('project-cache-clear', Date.now().toString());
      
      // Trigger storage event for cross-tab synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'consumption-updated',
        newValue: Date.now().toString()
      }));
      
      toast({
        title: "Consumo registrado",
        description: "Seu consumo foi registrado com sucesso.",
      });
      
      // Reset form
      form.reset({
        energyKwh: 0,
        fuelLiters: 0,
        fuelTypes: [],
        transportKm: 0,
        transportTypes: [],
        waterM3: 0,
        wasteKg: 0,
        period: "monthly",
        month: '',
        year: new Date().getFullYear(),
        emissionKgCo2: 0,
        compensationValueKz: 0,
      });
      
      setTotalEmission(0);
      setCompensationValue(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar consumo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ConsumptionFormValues) => {
    // Ensure at least one consumption type is provided
    if (
      (data.energyKwh === 0 || !data.energyKwh) &&
      (data.fuelLiters === 0 || !data.fuelLiters) &&
      (data.transportKm === 0 || !data.transportKm) &&
      (data.waterM3 === 0 || !data.waterM3) &&
      (data.wasteKg === 0 || !data.wasteKg)
    ) {
      toast({
        title: "Dados insuficientes",
        description: "Informe pelo menos um tipo de consumo (energia, combustível, transporte, água ou resíduos).",
        variant: "destructive",
      });
      return;
    }
    
    createConsumptionMutation.mutate(data);
  };
  
  // Format number
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar type="company" />
        
        <div className="flex-1 overflow-auto bg-gray-100 w-full">
          <div className="container mx-auto px-4 py-8">
            <h1 className="font-bold text-2xl text-gray-800 mb-6">Inserir Consumo</h1>
            
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Insira os dados de consumo da sua empresa para calcular a pegada de carbono e o valor a ser compensado.
                  </p>
                  
                  <Alert className="bg-primary-50 border-primary/30 text-primary">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Importante</AlertTitle>
                    <AlertDescription>
                      Os cálculos são baseados em fatores de emissão padrão para o setor.
                    </AlertDescription>
                  </Alert>
                </div>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Energy Section */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-md">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                        <Zap className="text-yellow-500 mr-2 h-5 w-5" />
                        Consumo de Energia
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="energyKwh"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Energia Elétrica (kWh)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  placeholder="150" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="period"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Período</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo de período" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="daily">Diário</SelectItem>
                                  <SelectItem value="monthly">Mensal</SelectItem>
                                  <SelectItem value="yearly">Anual</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Escolha se o consumo registrado é referente a um dia, mês ou ano.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Estimativa de emissão:</span>
                          <span className="font-medium">{formatNumber(energyKwh * EMISSION_FACTORS.energy)} kg CO2</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Water Section */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-md">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                        <Droplet className="text-blue-500 mr-2 h-5 w-5" />
                        Consumo de Água
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="waterM3"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Água (m³)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  placeholder="25" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                O consumo de água é registrado apenas para fins de monitoramento.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Waste Section */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-md">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                        <Trash2 className="text-green-600 mr-2 h-5 w-5" />
                        Geração de Resíduos
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="wasteKg"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Resíduos Sólidos (kg)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  placeholder="100" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Estimativa de emissão:</span>
                          <span className="font-medium">{formatNumber(wasteKg * EMISSION_FACTORS.waste)} kg CO2</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Transport Section */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-md">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                        <Car className="text-blue-600 mr-2 h-5 w-5" />
                        Transporte
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                        <FormField
                          control={form.control}
                          name="transportKm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Distância Percorrida (km)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  placeholder="200" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <FormField
                          control={form.control}
                          name="transportTypes"
                          render={() => (
                            <FormItem>
                              <div className="mb-2">
                                <FormLabel>Tipo de Transporte</FormLabel>
                                <FormDescription>
                                  Selecione um ou mais tipos de transporte utilizados
                                </FormDescription>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {transportTypeOptions.map((option) => (
                                  <FormField
                                    key={option.id}
                                    control={form.control}
                                    name="transportTypes"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={option.id}
                                          className="flex flex-row items-start space-x-2 space-y-0 p-2 border rounded-md"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(option.id)}
                                              onCheckedChange={(checked) => {
                                                const currentValues = field.value || [];
                                                return checked
                                                  ? field.onChange([...currentValues, option.id])
                                                  : field.onChange(
                                                      currentValues.filter(
                                                        (value) => value !== option.id
                                                      )
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm font-normal cursor-pointer">
                                            {option.label}
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Estimativa de emissão:</span>
                          <span className="font-medium">
                            {transportTypes.length > 0 && transportKm > 0 ? (
                              <>
                                {formatNumber(
                                  transportTypes.reduce(
                                    (sum, type) => sum + transportKm * (EMISSION_FACTORS.transport[type as keyof typeof EMISSION_FACTORS.transport] || 0),
                                    0
                                  ) / transportTypes.length
                                )} kg CO2
                              </>
                            ) : (
                              "0.00 kg CO2"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Fuel Section */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-md">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                        <Flame className="text-orange-500 mr-2 h-5 w-5" />
                        Consumo de Combustível
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                        <FormField
                          control={form.control}
                          name="fuelLiters"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantidade (litros)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  placeholder="80" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <FormField
                          control={form.control}
                          name="fuelTypes"
                          render={() => (
                            <FormItem>
                              <div className="mb-2">
                                <FormLabel>Tipo de Combustível</FormLabel>
                                <FormDescription>
                                  Selecione um ou mais tipos de combustível utilizados
                                </FormDescription>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {fuelTypeOptions.map((option) => (
                                  <FormField
                                    key={option.id}
                                    control={form.control}
                                    name="fuelTypes"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={option.id}
                                          className="flex flex-row items-start space-x-2 space-y-0 p-2 border rounded-md"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(option.id)}
                                              onCheckedChange={(checked) => {
                                                const currentValues = field.value || [];
                                                return checked
                                                  ? field.onChange([...currentValues, option.id])
                                                  : field.onChange(
                                                      currentValues.filter(
                                                        (value) => value !== option.id
                                                      )
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm font-normal cursor-pointer">
                                            {option.label}
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Estimativa de emissão:</span>
                          <span className="font-medium">
                            {fuelTypes.length > 0 && fuelLiters > 0 ? (
                              <>
                                {formatNumber(
                                  fuelTypes.reduce(
                                    (sum, type) => sum + fuelLiters * (EMISSION_FACTORS.fuel[type as keyof typeof EMISSION_FACTORS.fuel] || 0),
                                    0
                                  ) / fuelTypes.length
                                )} kg CO2
                              </>
                            ) : (
                              "0.00 kg CO2"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Results Section */}
                    <div className="mb-6 p-4 bg-primary-50 border border-primary/30 rounded-md">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                        <CalculatorIcon className="text-primary mr-2 h-5 w-5" />
                        Resultado
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-white rounded-md">
                          <p className="text-sm text-gray-600 mb-1">Emissão Total:</p>
                          <p className="text-xl font-bold">{formatNumber(totalEmission)} kg CO2</p>
                        </div>
                        
                        <div className="p-3 bg-white rounded-md">
                          <p className="text-sm text-gray-600 mb-1">Valor de Compensação:</p>
                          <p className="text-xl font-bold">{formatCurrency(compensationValue)} Kz</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Period Selection */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-md">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4">Período Mensal</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={createConsumptionMutation.isPending}
                    >
                      {createConsumptionMutation.isPending ? (
                        <>Registrando...</>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Registrar Consumo
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Consumos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : consumptionRecords && Array.isArray(consumptionRecords) && consumptionRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Energia (kWh)</TableHead>
                          <TableHead>Água (m³)</TableHead>
                          <TableHead>Combustível (L)</TableHead>
                          <TableHead>Transporte (km)</TableHead>
                          <TableHead>Resíduos (kg)</TableHead>
                          <TableHead>Emissão (kg CO2)</TableHead>
                          <TableHead>Valor (Kz)</TableHead>
                          <TableHead>Período</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consumptionRecords.slice(0, 5).map((record: any) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {new Date(record.createdAt).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>{formatNumber(record.energyKwh || 0)}</TableCell>
                            <TableCell>{formatNumber(record.waterM3 || 0)}</TableCell>
                            <TableCell>
                              {formatNumber(record.fuelLiters || 0)}
                              {record.fuelType && ` (${
                                record.fuelType === "diesel" ? "Diesel" :
                                record.fuelType === "gasoline" ? "Gasolina" : "Gás Natural"
                              })`}
                            </TableCell>
                            <TableCell>
                              {formatNumber(record.transportKm || 0)}
                              {record.transportType && ` (${
                                record.transportType === "car" ? "Carro" :
                                record.transportType === "truck" ? "Caminhão" : "Avião"
                              })`}
                            </TableCell>
                            <TableCell>{formatNumber(record.wasteKg || 0)}</TableCell>
                            <TableCell>{formatNumber(record.emissionKgCo2)}</TableCell>
                            <TableCell>{formatCurrency(parseFloat(record.compensationValueKz))}</TableCell>
                            <TableCell>
                              {record.period === "monthly" ? "Mensal" :
                               record.period === "quarterly" ? "Trimestral" : "Anual"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">Nenhum registro de consumo encontrado.</div>
                )}
                
                <div className="mt-4 text-center">
                  <Button asChild variant="link" className="text-primary">
                    <Link href="/empresa/historico">Ver histórico completo</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CompanyConsumption;
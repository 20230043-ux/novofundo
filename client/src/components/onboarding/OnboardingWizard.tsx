import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-localstorage";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Defina cada passo do assistente
const steps = [
  {
    id: "welcome",
    title: "Bem-vindo ao Fundo Verde",
    description: "Uma plataforma completa para calcular e compensar sua pegada de carbono",
    content: (
      <div className="space-y-4">
        <p>
          Com o Fundo Verde, sua empresa pode:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <span>Calcular suas emissões de carbono e consumo de água</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <span>Compensar sua pegada ambiental com investimentos certificados</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <span>Acompanhar o impacto dos seus investimentos em projetos sustentáveis</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <span>Obter relatórios detalhados sobre sua contribuição para os ODS</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "calculator",
    title: "Calculadora de Carbono",
    description: "Aprenda a calcular sua pegada de carbono e água",
    content: (
      <div className="space-y-4">
        <p>
          Vá para a seção "Calcular Consumo" para:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <div className="bg-blue-100 rounded-full p-1 mr-2">
              <span className="text-blue-600 font-semibold text-sm">1</span>
            </div>
            <span>Registrar seu consumo de energia em kWh</span>
          </li>
          <li className="flex items-start">
            <div className="bg-blue-100 rounded-full p-1 mr-2">
              <span className="text-blue-600 font-semibold text-sm">2</span>
            </div>
            <span>Registrar seu consumo de água em m³</span>
          </li>
          <li className="flex items-start">
            <div className="bg-blue-100 rounded-full p-1 mr-2">
              <span className="text-blue-600 font-semibold text-sm">3</span>
            </div>
            <span>Ver automaticamente o cálculo das emissões de CO₂</span>
          </li>
        </ul>
        <div className="mt-4 bg-green-50 p-3 rounded-md">
          <p className="text-green-800 text-sm">
            <strong>Dica:</strong> Registre seus consumos mensalmente para ter um histórico preciso.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "compensation",
    title: "Compensação",
    description: "Compense sua pegada de carbono com investimentos em projetos sustentáveis",
    content: (
      <div className="space-y-4">
        <p>
          Após calcular sua pegada, você pode compensá-la:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <div className="bg-green-100 rounded-full p-1 mr-2">
              <span className="text-green-600 font-semibold text-sm">1</span>
            </div>
            <span>Vá para "Compensar" e selecione o registro que deseja compensar</span>
          </li>
          <li className="flex items-start">
            <div className="bg-green-100 rounded-full p-1 mr-2">
              <span className="text-green-600 font-semibold text-sm">2</span>
            </div>
            <span>Faça o pagamento do valor correspondente</span>
          </li>
          <li className="flex items-start">
            <div className="bg-green-100 rounded-full p-1 mr-2">
              <span className="text-green-600 font-semibold text-sm">3</span>
            </div>
            <span>Envie o comprovante de pagamento para aprovação</span>
          </li>
          <li className="flex items-start">
            <div className="bg-green-100 rounded-full p-1 mr-2">
              <span className="text-green-600 font-semibold text-sm">4</span>
            </div>
            <span>Acompanhe seus investimentos em "Histórico"</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "projects",
    title: "Projetos de Impacto",
    description: "Conheça os projetos que sua empresa está apoiando",
    content: (
      <div className="space-y-4">
        <p>
          Seus investimentos financiam projetos alinhados com os ODS:
        </p>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="bg-blue-50 p-3 rounded-md">
            <h4 className="font-semibold text-blue-700">Água Potável</h4>
            <p className="text-sm text-blue-600">ODS 6</p>
          </div>
          <div className="bg-green-50 p-3 rounded-md">
            <h4 className="font-semibold text-green-700">Florestas</h4>
            <p className="text-sm text-green-600">ODS 15</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md">
            <h4 className="font-semibold text-yellow-700">Energia Limpa</h4>
            <p className="text-sm text-yellow-600">ODS 7</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-md">
            <h4 className="font-semibold text-purple-700">Cidades</h4>
            <p className="text-sm text-purple-600">ODS 11</p>
          </div>
        </div>
        <p className="text-sm mt-2">
          Você pode ver todos os projetos na página principal e acompanhar suas atualizações.
        </p>
      </div>
    ),
  },
  {
    id: "completed",
    title: "Pronto para começar!",
    description: "Você está pronto para usar a plataforma Fundo Verde",
    content: (
      <div className="space-y-4 text-center">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-green-700">Missão cumprida!</h3>
        <p>
          Agora você conhece as principais funcionalidades da plataforma Fundo Verde.
        </p>
        <p className="text-sm text-gray-600">
          Não se preocupe, você pode acessar este guia novamente a qualquer momento no menu de ajuda.
        </p>
      </div>
    ),
  },
];

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [animationDirection, setAnimationDirection] = useState<"right" | "left">("right");
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Atualização de progresso
  useEffect(() => {
    const percent = (currentStep / (steps.length - 1)) * 100;
    setProgress(percent);
  }, [currentStep]);

  // Navegar para o próximo passo
  const nextStep = () => {
    setAnimationDirection("right");
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  // Navegar para o passo anterior
  const prevStep = () => {
    setAnimationDirection("left");
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };
  
  // Completar o onboarding com opção de não mostrar mais
  const handleComplete = () => {
    onComplete();
    // Se o usuário marcou a opção de não mostrar mais, armazenamos isso permanentemente
    if (dontShowAgain) {
      // Armazenar permanentemente a preferência do usuário
      localStorage.setItem("neverShowOnboarding", "true");
    }
  };
  
  // Pular o onboarding com opção de não mostrar mais
  const handleSkip = () => {
    if (dontShowAgain) {
      // Armazenar permanentemente a preferência do usuário
      localStorage.setItem("neverShowOnboarding", "true");
    }
    onSkip();
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader className="relative pb-0">
          <div className="absolute right-6 top-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8 rounded-full text-gray-700 hover:bg-gray-100"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mb-2">
            <Progress value={progress} className="h-2" />
          </div>
          <CardTitle className="text-xl bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
            {currentStepData.title}
          </CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepData.id}
              initial={{ 
                x: animationDirection === "right" ? 20 : -20, 
                opacity: 0 
              }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ 
                x: animationDirection === "right" ? -20 : 20, 
                opacity: 0 
              }}
              transition={{ duration: 0.3 }}
            >
              {currentStepData.content}
            </motion.div>
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dontShowAgain" 
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              className="data-[state=checked]:bg-green-600"
            />
            <Label 
              htmlFor="dontShowAgain" 
              className="text-sm text-gray-600 cursor-pointer"
            >
              Não mostrar mais este assistente
            </Label>
          </div>
          
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={isFirstStep}
            >
              Anterior
            </Button>
            <Button onClick={nextStep}>
              {isLastStep ? "Concluir" : (
                <>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
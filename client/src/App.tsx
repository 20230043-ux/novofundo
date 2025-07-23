import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/hooks/use-onboarding";
import { OnboardingController } from "@/components/onboarding";
import { WebSocketProvider } from "@/hooks/use-websocket";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "@/lib/admin-route";
import ScrollToTop from "@/components/scroll-to-top";
import { performanceOptimizer } from "@/lib/performance";
import { lazyLoader } from "@/lib/lazy-loading";

const { lazy } = React;

// Pages
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import OdsIndex from "@/pages/ods/index";
import OdsDetail from "@/pages/ods/ods-detail";
import ProjectsIndex from "@/pages/projects/index";
import ProjectDetail from "@/pages/projects/project-detail";
import CarbonCalculatorPage from "@/pages/calculator/calculator-page";
import CarbonLeaderboardPage from "@/pages/carbon-leaderboard-page";

// Company Pages
import CompanyDashboard from "@/pages/company/dashboard";
import CompanyProfile from "@/pages/company/profile";
import CompanyConsumption from "@/pages/company/consumption";
import CompanyPaymentProof from "@/pages/company/payment-proof";
import CompanyHistory from "@/pages/company/history";

// Individual Pages
import IndividualDashboard from "@/pages/individual/dashboard";
import IndividualCalculator from "@/pages/individual/calculator";
import IndividualProfile from "@/pages/individual/profile";
import IndividualPaymentProof from "@/pages/individual/payment-proof";
import IndividualInvestments from "@/pages/individual/investments";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCompanies from "@/pages/admin/companies";
import AdminCompanyDetail from "@/pages/admin/company-detail";
import AdminIndividuals from "@/pages/admin/individuals";
import AdminIndividualDetail from "@/pages/admin/individual-detail";
import AdminPendingOds from "@/pages/admin/pending-ods";
import AdminPublications from "@/pages/admin/publications";
import AdminOdsInvestimentos from "@/pages/admin/ods-investimentos";
import AdminSetoresPoluentes from "@/pages/admin/setores-poluentes";
import AdminRelatorios from "@/pages/admin/relatorios";
import AdminBackup from "@/pages/admin/backup";
import DatabaseAdmin from "@/pages/DatabaseAdmin";


import LoadingScreen from "@/components/loading-screen";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/ods" component={OdsIndex} />
      <Route path="/ods/:id" component={OdsDetail} />
      <Route path="/projetos" component={ProjectsIndex} />
      <Route path="/projeto/:id" component={ProjectDetail} />
      <Route path="/calculadora" component={CarbonCalculatorPage} />
      <Route path="/leaderboard" component={CarbonLeaderboardPage} />
      
      {/* Company Routes */}
      <ProtectedRoute path="/empresa/dashboard" component={CompanyDashboard} role="company" />
      <ProtectedRoute path="/empresa/perfil" component={CompanyProfile} role="company" />
      <ProtectedRoute path="/empresa/consumo" component={CompanyConsumption} role="company" />
      <ProtectedRoute path="/empresa/comprovativo" component={CompanyPaymentProof} role="company" />
      <ProtectedRoute path="/empresa/historico" component={CompanyHistory} role="company" />
      
      {/* Individual Routes */}
      <ProtectedRoute path="/individual/dashboard" component={IndividualDashboard} role="individual" />
      <ProtectedRoute path="/individual/calculator" component={IndividualCalculator} role="individual" />
      <ProtectedRoute path="/individual/profile" component={IndividualProfile} role="individual" />
      <ProtectedRoute path="/individual/payment-proof" component={IndividualPaymentProof} role="individual" />
      <ProtectedRoute path="/individual/investments" component={IndividualInvestments} role="individual" />
      
      {/* Admin Routes */}
      <AdminRoute path="/admin/dashboard" component={AdminDashboard} />
      <AdminRoute path="/admin/empresas" component={AdminCompanies} />
      <AdminRoute path="/admin/empresas/:id" component={AdminCompanyDetail} />
      <AdminRoute path="/admin/individuals" component={AdminIndividuals} />
      <AdminRoute path="/admin/individuals/:id" component={AdminIndividualDetail} />
      <AdminRoute path="/admin/ods-pendentes" component={AdminPendingOds} />
      <AdminRoute path="/admin/ods-investimentos" component={AdminOdsInvestimentos} />
      <AdminRoute path="/admin/setores-poluentes" component={AdminSetoresPoluentes} />
      <AdminRoute path="/admin/relatorios" component={AdminRelatorios} />
      <AdminRoute path="/admin/publications" component={AdminPublications} />
      <AdminRoute path="/admin/backup" component={AdminBackup} />
      <AdminRoute path="/admin/database" component={DatabaseAdmin} />
      <AdminRoute path="/admin/real-time" component={lazy(() => import("./pages/admin/real-time-monitor"))} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = React.useState(true);

  // Initialize performance optimizations
  React.useEffect(() => {
    // Start optimizations immediately
    performanceOptimizer.optimizeFirstVisit();
    performanceOptimizer.measurePageLoad();
    
    // Setup lazy loading after initial render
    setTimeout(() => {
      lazyLoader.observeAll();
    }, 100);
    
    return () => {
      lazyLoader.disconnect();
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <OnboardingProvider>
            <ScrollToTop />
            <Router />
            <OnboardingController />
            <Toaster />
          </OnboardingProvider>
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Leaf, Menu, ChevronDown, User, FileUp, LogOut } from "lucide-react";
import { HelpButton } from "@/components/onboarding";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado com sucesso",
        description: "Até logo!",
      });
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Não foi possível fazer logout",
        variant: "destructive",
      });
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
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 backdrop-blur-md bg-white/95 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="transform transition-transform duration-300 group-hover:scale-110">
              <img src="/logo.svg" alt="Fundo Verde Logo" className="h-8 w-8" />
            </div>
            <span className="font-bold text-xl text-gray-800">
              Fundo <span className="text-black" style={{ color: '#000000 !important' }}>Verde</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6 items-center">
            {!user ? (
              // Public Navigation
              <>
                <Link href="/" className={`text-gray-700 hover:text-primary font-medium transition-all duration-300 relative group ${isActive('/') && 'text-primary'}`}>
                  Início
                  <div className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full ${isActive('/') && 'w-full'}`}></div>
                </Link>
                <Link href="/ods" className={`text-gray-700 hover:text-primary font-medium transition-all duration-300 relative group ${isActive('/ods') && 'text-primary'}`}>
                  ODS
                  <div className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full ${isActive('/ods') && 'w-full'}`}></div>
                </Link>
                <Link href="/projetos" className={`text-gray-700 hover:text-primary font-medium transition-all duration-300 relative group ${isActive('/projetos') && 'text-primary'}`}>
                  Projetos
                  <div className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full ${isActive('/projetos') && 'w-full'}`}></div>
                </Link>
                <Link href="/calculadora" className={`text-gray-700 hover:text-primary font-medium transition-all duration-300 relative group ${isActive('/calculadora') && 'text-primary'}`}>
                  Calculadora
                  <div className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full ${isActive('/calculadora') && 'w-full'}`}></div>
                </Link>
                <Link href="/leaderboard" className={`text-gray-700 hover:text-primary font-medium transition-all duration-300 relative group ${isActive('/leaderboard') && 'text-primary'}`}>
                  Leaderboard
                  <div className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full ${isActive('/leaderboard') && 'w-full'}`}></div>
                </Link>
                <div className="ml-6 flex space-x-3">
                  <Button variant="outline" asChild className="border-primary text-primary hover:bg-primary/10 transform hover:scale-105 transition-all duration-300">
                    <Link href="/auth">Entrar</Link>
                  </Button>
                  <Button asChild className="transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                    <Link href="/auth">Registrar</Link>
                  </Button>
                </div>
              </>
            ) : user.role === 'company' ? (
              // Company Navigation
              <>
                <Link href="/empresa/dashboard" className={`text-gray-700 hover:text-primary font-medium ${isActive('/empresa/dashboard') && 'text-primary'}`}>
                  Dashboard
                </Link>
                <Link href="/empresa/consumo" className={`text-gray-700 hover:text-primary font-medium ${isActive('/empresa/consumo') && 'text-primary'}`}>
                  Consumo
                </Link>
                <Link href="/empresa/historico" className={`text-gray-700 hover:text-primary font-medium ${isActive('/empresa/historico') && 'text-primary'}`}>
                  Histórico
                </Link>
                
                <div className="flex items-center space-x-2">
                  <HelpButton />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-2 outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user.company?.logoUrl || undefined} 
                        alt={user.company?.name || "Empresa"} 
                      />
                      <AvatarFallback className="bg-primary text-white">
                        {user.company?.name ? getInitials(user.company.name) : "CO"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-gray-700">{user.company?.name || "Empresa"}</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/empresa/perfil" className="cursor-pointer flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/empresa/comprovativo" className="cursor-pointer flex items-center">
                        <FileUp className="mr-2 h-4 w-4" />
                        <span>Enviar Comprovativo</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 cursor-pointer flex items-center"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : user.role === 'individual' ? (
              // Individual Navigation
              <>
                <Link href="/individual/dashboard" className={`text-gray-700 hover:text-primary font-medium ${isActive('/individual/dashboard') && 'text-primary'}`}>
                  Dashboard
                </Link>
                <Link href="/individual/calculator" className={`text-gray-700 hover:text-primary font-medium ${isActive('/individual/calculator') && 'text-primary'}`}>
                  Calculadora
                </Link>
                <Link href="/projetos" className={`text-gray-700 hover:text-primary font-medium ${isActive('/projetos') && 'text-primary'}`}>
                  Projetos
                </Link>
                
                <div className="flex items-center space-x-2">
                  <HelpButton />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-2 outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user.individual?.profilePictureUrl || undefined}
                        alt={user.individual?.firstName ? `${user.individual.firstName} ${user.individual.lastName || ''}` : "Perfil"}
                      />
                      <AvatarFallback className="bg-green-500 text-white">
                        {user.individual?.firstName && user.individual?.lastName 
                          ? getInitials(`${user.individual.firstName} ${user.individual.lastName}`) 
                          : "PE"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-gray-700">
                      {user.individual?.firstName || "Pessoa"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/individual/profile" className="cursor-pointer flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 cursor-pointer flex items-center"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Admin Navigation
              <>
                <Link href="/admin/dashboard" className={`text-gray-700 hover:text-primary font-medium ${isActive('/admin/dashboard') && 'text-primary'}`}>
                  Dashboard
                </Link>
                <Link href="/admin/empresas" className={`text-gray-700 hover:text-primary font-medium ${isActive('/admin/empresas') && 'text-primary'}`}>
                  Empresas
                </Link>
                <Link href="/admin/ods-pendentes" className={`text-gray-700 hover:text-primary font-medium ${isActive('/admin/ods-pendentes') && 'text-primary'}`}>
                  ODS Pendentes
                </Link>
                <Link href="/admin/publications" className={`text-gray-700 hover:text-primary font-medium ${isActive('/admin/publications') && 'text-primary'}`}>
                  Publicações
                </Link>
                <Link href="/admin/relatorios" className={`text-gray-700 hover:text-primary font-medium ${isActive('/admin/relatorios') && 'text-primary'}`}>
                  Relatórios
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-2 outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-white">
                        AD
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-gray-700">Admin</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-red-600 cursor-pointer flex items-center"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-primary"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-2 pt-2 pb-3 space-y-1">
            {!user ? (
              // Public Navigation Mobile
              <>
                <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Início
                </Link>
                <Link href="/ods" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  ODS
                </Link>
                <Link href="/projetos" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Projetos
                </Link>
                <Link href="/calculadora" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Calculadora
                </Link>
                <Link href="/leaderboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Leaderboard
                </Link>
                <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-primary/10">
                  Entrar
                </Link>
                <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium bg-primary text-white hover:bg-primary-600">
                  Registrar
                </Link>
              </>
            ) : user.role === 'company' ? (
              // Company Navigation Mobile
              <>
                <Link href="/empresa/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Dashboard
                </Link>
                <Link href="/empresa/perfil" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Perfil
                </Link>
                <Link href="/empresa/consumo" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Consumo
                </Link>
                <Link href="/empresa/comprovativo" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Enviar Comprovativo
                </Link>
                <Link href="/empresa/historico" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Histórico
                </Link>
                <button 
                  onClick={() => {
                    const { showOnboarding } = require("@/hooks/use-onboarding").useOnboarding();
                    showOnboarding();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                >
                  Assistente de introdução
                </button>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50"
                >
                  Sair
                </button>
              </>
            ) : user.role === 'individual' ? (
              // Individual Navigation Mobile
              <>
                <Link href="/individual/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Dashboard
                </Link>
                <Link href="/individual/calculator" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Calculadora
                </Link>
                <Link href="/projetos" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Projetos
                </Link>
                <Link href="/individual/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Perfil
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50"
                >
                  Sair
                </button>
              </>
            ) : (
              // Admin Navigation Mobile
              <>
                <Link href="/admin/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Dashboard
                </Link>
                <Link href="/admin/empresas" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Empresas
                </Link>
                <Link href="/admin/ods-pendentes" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  ODS Pendentes
                </Link>
                <Link href="/admin/publications" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Publicações
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50"
                >
                  Sair
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

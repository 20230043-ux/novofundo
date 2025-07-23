import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  User, 
  Droplets, 
  FileUp, 
  History, 
  LogOut,
  Users,
  Goal,
  BookOpen,
  X,
  Menu,
  Download,
  Database,
  Activity
} from "lucide-react";

interface SidebarProps {
  type: 'company' | 'admin';
}

const Sidebar = ({ type }: SidebarProps) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);
  
  // Close sidebar on window resize if transitioning from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
    
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const handleLogout = () => {
    logout();
  };
  
  // Toggle button for mobile
  const MobileToggle = () => (
    <Button
      variant="ghost"
      size="icon"
      className="fixed top-4 right-4 z-50 md:hidden"
      onClick={() => setSidebarOpen(!sidebarOpen)}
    >
      {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </Button>
  );
  
  // For mobile, we'll show a different version of the sidebar that slides in
  const mobileSidebar = (
    <>
      <MobileToggle />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-200">
          {type === 'company' && user?.company ? (
            <div className="flex items-center">
              <Avatar className="w-10 h-10 mr-3">
                <AvatarImage src={user.company.logoUrl || undefined} alt={user.company.name} />
                <AvatarFallback className="bg-primary text-white">
                  {getInitials(user.company.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-800">{user.company.name}</h2>
                <p className="text-xs text-gray-500">{user.company.sector}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <Avatar className="w-10 h-10 mr-3">
                <AvatarFallback className="bg-secondary text-white">AD</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-800">Administrador</h2>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          )}
        </div>
        
        <nav className="mt-6">
          {type === 'company' ? (
            // Company Navigation
            <>
              <Link href="/empresa/dashboard" className={`flex items-center px-6 py-3 ${isActive('/empresa/dashboard') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <LayoutDashboard className="w-5 h-5 mr-3" />
                <span>Dashboard</span>
              </Link>
              <Link href="/empresa/perfil" className={`flex items-center px-6 py-3 ${isActive('/empresa/perfil') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <User className="w-5 h-5 mr-3" />
                <span>Perfil</span>
              </Link>
              <Link href="/empresa/consumo" className={`flex items-center px-6 py-3 ${isActive('/empresa/consumo') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Droplets className="w-5 h-5 mr-3" />
                <span>Inserir Consumo</span>
              </Link>
              <Link href="/empresa/comprovativo" className={`flex items-center px-6 py-3 ${isActive('/empresa/comprovativo') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <FileUp className="w-5 h-5 mr-3" />
                <span>Enviar Comprovativo</span>
              </Link>
              <Link href="/empresa/historico" className={`flex items-center px-6 py-3 ${isActive('/empresa/historico') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <History className="w-5 h-5 mr-3" />
                <span>Histórico</span>
              </Link>
            </>
          ) : (
            // Admin Navigation
            <>
              <Link href="/admin/dashboard" className={`flex items-center px-6 py-3 ${isActive('/admin/dashboard') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <LayoutDashboard className="w-5 h-5 mr-3" />
                <span>Dashboard</span>
              </Link>
              <Link href="/admin/empresas" className={`flex items-center px-6 py-3 ${isActive('/admin/empresas') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Users className="w-5 h-5 mr-3" />
                <span>Empresas</span>
              </Link>
              <Link href="/admin/individuals" className={`flex items-center px-6 py-3 ${isActive('/admin/individuals') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <User className="w-5 h-5 mr-3" />
                <span>Pessoas</span>
              </Link>
              <Link href="/admin/ods-pendentes" className={`flex items-center px-6 py-3 ${isActive('/admin/ods-pendentes') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Goal className="w-5 h-5 mr-3" />
                <span>ODS Pendentes</span>
              </Link>
              <Link href="/admin/publications" className={`flex items-center px-6 py-3 ${isActive('/admin/publications') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <BookOpen className="w-5 h-5 mr-3" />
                <span>Publicações</span>
              </Link>
              <Link href="/admin/backup" className={`flex items-center px-6 py-3 ${isActive('/admin/backup') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Download className="w-5 h-5 mr-3" />
                <span>Backup & Restauração</span>
              </Link>
              <Link href="/admin/database" className={`flex items-center px-6 py-3 ${isActive('/admin/database') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Database className="w-5 h-5 mr-3" />
                <span>Base de Dados</span>
              </Link>
              <Link href="/admin/real-time" className={`flex items-center px-6 py-3 ${isActive('/admin/real-time') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Activity className="w-5 h-5 mr-3" />
                <span>Monitor Tempo Real</span>
              </Link>
            </>
          )}
          
          <div className="mt-6 px-6">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center w-full py-3 text-red-500 hover:text-red-600"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Sair</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
  
  // Desktop sidebar
  const desktopSidebar = (
    <div className="bg-white shadow-md w-64 h-screen hidden md:block border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        {type === 'company' && user?.company ? (
          <div className="flex items-center">
            <Avatar className="w-10 h-10 mr-3">
              <AvatarImage src={user.company.logoUrl || undefined} alt={user.company.name} />
              <AvatarFallback className="bg-primary text-white">
                {getInitials(user.company.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-gray-800">{user.company.name}</h2>
              <p className="text-xs text-gray-500">{user.company.sector}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <Avatar className="w-10 h-10 mr-3">
              <AvatarFallback className="bg-secondary text-white">AD</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-gray-800">Administrador</h2>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        )}
      </div>
      
      <nav className="mt-6">
        {type === 'company' ? (
          // Company Navigation
          <>
            <Link href="/empresa/dashboard" className={`flex items-center px-6 py-3 ${isActive('/empresa/dashboard') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <LayoutDashboard className="w-5 h-5 mr-3" />
              <span>Dashboard</span>
            </Link>
            <Link href="/empresa/perfil" className={`flex items-center px-6 py-3 ${isActive('/empresa/perfil') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <User className="w-5 h-5 mr-3" />
              <span>Perfil</span>
            </Link>
            <Link href="/empresa/consumo" className={`flex items-center px-6 py-3 ${isActive('/empresa/consumo') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Droplets className="w-5 h-5 mr-3" />
              <span>Inserir Consumo</span>
            </Link>
            <Link href="/empresa/comprovativo" className={`flex items-center px-6 py-3 ${isActive('/empresa/comprovativo') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <FileUp className="w-5 h-5 mr-3" />
              <span>Enviar Comprovativo</span>
            </Link>
            <Link href="/empresa/historico" className={`flex items-center px-6 py-3 ${isActive('/empresa/historico') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <History className="w-5 h-5 mr-3" />
              <span>Histórico</span>
            </Link>
          </>
        ) : (
          // Admin Navigation
          <>
            <Link href="/admin/dashboard" className={`flex items-center px-6 py-3 ${isActive('/admin/dashboard') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <LayoutDashboard className="w-5 h-5 mr-3" />
              <span>Dashboard</span>
            </Link>
            <Link href="/admin/empresas" className={`flex items-center px-6 py-3 ${isActive('/admin/empresas') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Users className="w-5 h-5 mr-3" />
              <span>Empresas</span>
            </Link>
            <Link href="/admin/individuals" className={`flex items-center px-6 py-3 ${isActive('/admin/individuals') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <User className="w-5 h-5 mr-3" />
              <span>Pessoas</span>
            </Link>
            <Link href="/admin/ods-pendentes" className={`flex items-center px-6 py-3 ${isActive('/admin/ods-pendentes') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Goal className="w-5 h-5 mr-3" />
              <span>ODS Pendentes</span>
            </Link>
            <Link href="/admin/publications" className={`flex items-center px-6 py-3 ${isActive('/admin/publications') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <BookOpen className="w-5 h-5 mr-3" />
              <span>Publicações</span>
            </Link>
            <Link href="/admin/backup" className={`flex items-center px-6 py-3 ${isActive('/admin/backup') ? 'bg-primary-50 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Download className="w-5 h-5 mr-3" />
              <span>Backup & Restauração</span>
            </Link>
          </>
        )}
        
        <div className="mt-6 px-6">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center w-full py-3 text-red-500 hover:text-red-600"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Sair</span>
          </button>
        </div>
      </nav>
    </div>
  );
  
  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
};

export default Sidebar;

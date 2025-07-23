import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Navbar from "../../components/layout/navbar";
import Sidebar from "../../components/layout/sidebar";
import { Activity, Wifi, WifiOff, Bell, Users, FileText, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RealTimeMonitor() {
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalMessages: 0,
    userUpdates: 0,
    paymentProofs: 0,
    carbonUpdates: 0,
    projectUpdates: 0,
    investmentUpdates: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    // Monitor WebSocket connection status
    const checkWsStatus = () => {
      const wsElement = document.querySelector('[data-ws-status]');
      if (wsElement) {
        const status = wsElement.getAttribute('data-ws-status') as 'connected' | 'disconnected' | 'connecting';
        setWsStatus(status);
      }
    };

    // Check initial status
    checkWsStatus();

    // Listen for WebSocket events
    const handleWebSocketEvent = (event: CustomEvent) => {
      const message = event.detail;
      
      setReceivedMessages(prev => [{
        ...message,
        timestamp: new Date().toISOString(),
        id: Date.now()
      }, ...prev.slice(0, 49)]); // Keep last 50 messages

      // Update stats
      setStats(prev => {
        const newStats = { ...prev, totalMessages: prev.totalMessages + 1 };
        
        switch (message.type) {
          case 'user_update':
            newStats.userUpdates++;
            break;
          case 'payment_proof_update':
            newStats.paymentProofs++;
            break;
          case 'carbon_update':
            newStats.carbonUpdates++;
            break;
          case 'project_update':
            newStats.projectUpdates++;
            break;
          case 'investment_update':
            newStats.investmentUpdates++;
            break;
        }
        
        return newStats;
      });
    };

    // Listen for all WebSocket event types
    const eventTypes = [
      'websocket:user_update',
      'websocket:payment_proof_update',
      'websocket:carbon_update',
      'websocket:project_update',
      'websocket:investment_update',
      'websocket:sdg_update'
    ];

    eventTypes.forEach(eventType => {
      window.addEventListener(eventType, handleWebSocketEvent as EventListener);
    });

    // Cleanup
    return () => {
      eventTypes.forEach(eventType => {
        window.removeEventListener(eventType, handleWebSocketEvent as EventListener);
      });
    };
  }, []);

  const sendTestMessage = () => {
    // Simulate a test WebSocket message
    const testMessage = {
      type: 'test_message',
      data: {
        action: 'test',
        message: 'Mensagem de teste do monitor em tempo real',
        timestamp: new Date().toISOString()
      }
    };

    window.dispatchEvent(new CustomEvent('websocket:test', { detail: testMessage }));
    
    toast({
      title: "🧪 Teste enviado",
      description: "Mensagem de teste disparada para verificar o sistema WebSocket",
    });
  };

  const clearMessages = () => {
    setReceivedMessages([]);
    setStats({
      totalMessages: 0,
      userUpdates: 0,
      paymentProofs: 0,
      carbonUpdates: 0,
      projectUpdates: 0,
      investmentUpdates: 0
    });
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'user_update':
        return <Users className="w-4 h-4" />;
      case 'payment_proof_update':
        return <FileText className="w-4 h-4" />;
      case 'carbon_update':
        return <Calculator className="w-4 h-4" />;
      case 'project_update':
        return <Activity className="w-4 h-4" />;
      case 'investment_update':
        return <Activity className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'user_update':
        return 'bg-blue-100 text-blue-800';
      case 'payment_proof_update':
        return 'bg-green-100 text-green-800';
      case 'carbon_update':
        return 'bg-emerald-100 text-emerald-800';
      case 'project_update':
        return 'bg-purple-100 text-purple-800';
      case 'investment_update':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar type="admin" />
        
        <div className="flex-1 overflow-auto bg-gray-100 w-full">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-bold text-2xl text-gray-800">Monitor de Tempo Real</h1>
              <div className="flex items-center gap-2">
                {wsStatus === 'connected' ? (
                  <Wifi className="w-5 h-5 text-green-600" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-600" />
                )}
                <Badge 
                  variant={wsStatus === 'connected' ? 'default' : 'destructive'}
                  className={wsStatus === 'connected' ? 'bg-green-600' : ''}
                >
                  {wsStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalMessages}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.userUpdates}</div>
                  <div className="text-sm text-gray-600">Usuários</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">{stats.paymentProofs}</div>
                  <div className="text-sm text-gray-600">Comprovativos</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-emerald-600">{stats.carbonUpdates}</div>
                  <div className="text-sm text-gray-600">Carbono</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{stats.projectUpdates}</div>
                  <div className="text-sm text-gray-600">Projetos</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{stats.investmentUpdates}</div>
                  <div className="text-sm text-gray-600">Investimentos</div>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <div className="flex gap-2 mb-6">
              <Button onClick={sendTestMessage} variant="outline">
                🧪 Enviar Teste
              </Button>
              <Button onClick={clearMessages} variant="outline">
                🗑️ Limpar Mensagens
              </Button>
            </div>

            {/* Messages List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Mensagens Recebidas em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent>
                {receivedMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aguardando mensagens em tempo real...</p>
                    <p className="text-sm">As atualizações aparecerão aqui quando os usuários interagirem com a plataforma</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {receivedMessages.map((message) => (
                      <div key={message.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {getMessageTypeIcon(message.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getMessageTypeColor(message.type)}>
                              {message.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{message.data?.action || 'Atualização'}</div>
                            {message.data?.message && (
                              <div className="text-gray-600 mt-1">{message.data.message}</div>
                            )}
                            {message.data?.companyName && (
                              <div className="text-gray-600 mt-1">Empresa: {message.data.companyName}</div>
                            )}
                            {message.data?.individualName && (
                              <div className="text-gray-600 mt-1">Pessoa: {message.data.individualName}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
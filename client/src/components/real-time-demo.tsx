import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/use-websocket';
import { Wifi, WifiOff, TestTube } from 'lucide-react';

export const RealTimeDemo = () => {
  const { isConnected, sendMessage } = useWebSocket();

  const testProjectUpdate = () => {
    // Simulate a project update for testing
    const testEvent = new CustomEvent('websocket:project_update', {
      detail: {
        action: 'update',
        project: { name: 'Projeto Teste', id: 999 },
        projectId: 999
      }
    });
    window.dispatchEvent(testEvent);
  };

  const testInvestmentUpdate = () => {
    // Simulate an investment update for testing
    const testEvent = new CustomEvent('websocket:investment_update', {
      detail: {
        action: 'create',
        amount: 50000,
        projectId: 999
      }
    });
    window.dispatchEvent(testEvent);
  };

  const testPaymentProofUpdate = () => {
    // Simulate a payment proof update for testing
    const testEvent = new CustomEvent('websocket:payment_proof_update', {
      detail: {
        action: 'status_update',
        paymentProof: { 
          id: 999, 
          status: 'approved',
          amount: 25000
        }
      }
    });
    window.dispatchEvent(testEvent);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          Status em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          Status: <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        <div className="space-y-2">
          <Button
            onClick={testProjectUpdate}
            disabled={!isConnected}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Testar Projeto
          </Button>
          
          <Button
            onClick={testInvestmentUpdate}
            disabled={!isConnected}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Testar Investimento
          </Button>
          
          <Button
            onClick={testPaymentProofUpdate}
            disabled={!isConnected}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Testar Comprovativo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
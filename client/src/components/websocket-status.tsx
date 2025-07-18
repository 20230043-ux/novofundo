import { useWebSocket } from '@/hooks/use-websocket';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

export const WebSocketStatus = () => {
  const { isConnected, reconnect } = useWebSocket();

  if (isConnected) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <Wifi className="h-3 w-3 mr-1" />
        Conectado
      </Badge>
    );
  }

  return (
    <Badge 
      variant="destructive" 
      className="cursor-pointer hover:bg-red-600"
      onClick={reconnect}
      title="Clique para reconectar"
    >
      <WifiOff className="h-3 w-3 mr-1" />
      Desconectado
    </Badge>
  );
};
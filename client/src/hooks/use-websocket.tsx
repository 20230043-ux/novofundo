import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  };

  const connect = () => {
    try {
      const wsUrl = getWebSocketUrl();
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        
        // Authenticate if user is logged in
        if (user) {
          const authMessage = {
            type: 'authenticate',
            userId: user.id,
            userType: user.role,
            token: 'session-token' // In a real app, use actual session token
          };
          wsRef.current?.send(JSON.stringify(authMessage));
        }

        // Start heartbeat
        startHeartbeat();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        stopHeartbeat();
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  const startHeartbeat = () => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const handleMessage = (message: WebSocketMessage) => {
    console.log('📡 Received WebSocket message:', message);

    switch (message.type) {
      case 'connection':
      case 'authenticated':
        console.log('✅ WebSocket:', message.data?.message || message.message);
        break;

      case 'project_update':
        // Invalidate project-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${message.data.projectId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/sdgs'] });
        console.log('📦 Project updated via WebSocket');
        
        // Trigger custom event for notifications
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('websocket:project_update', { detail: message.data }));
        }
        break;

      case 'investment_update':
        // Invalidate investment-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        queryClient.invalidateQueries({ queryKey: ['/api/sdgs'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
        console.log('💰 Investment updated via WebSocket');
        
        // Trigger custom event for notifications
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('websocket:investment_update', { detail: message.data }));
        }
        break;

      case 'payment_proof_update':
        // Invalidate payment proof related queries
        queryClient.invalidateQueries({ queryKey: ['/api/payment-proofs'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-proofs'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
        console.log('📋 Payment proof updated via WebSocket');
        
        // Trigger custom event for notifications
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('websocket:payment_proof_update', { detail: message.data }));
        }
        break;

      case 'sdg_update':
        // Invalidate SDG-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/sdgs'] });
        queryClient.invalidateQueries({ queryKey: [`/api/sdgs/${message.data.sdgId}`] });
        console.log('🎯 SDG updated via WebSocket');
        break;

      case 'user_notification':
        // Handle user-specific notifications
        console.log('🔔 User notification:', message.data);
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.log('❓ Unknown WebSocket message type:', message.type);
    }
  };

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  };

  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopHeartbeat();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Re-authenticate when user changes
  useEffect(() => {
    if (isConnected && user && wsRef.current) {
      const authMessage = {
        type: 'authenticate',
        userId: user.id,
        userType: user.role,
        token: 'session-token'
      };
      wsRef.current.send(JSON.stringify(authMessage));
    }
  }, [user, isConnected]);

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage, reconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
};
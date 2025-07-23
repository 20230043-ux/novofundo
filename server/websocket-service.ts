import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface WebSocketClient {
  ws: WebSocket;
  userId?: number;
  userType?: 'admin' | 'company' | 'individual';
  authenticated: boolean;
}

interface RealTimeMessage {
  type: 'project_update' | 'investment_update' | 'payment_proof_update' | 'sdg_update' | 'user_notification' | 'user_update' | 'carbon_update';
  data: any;
  targetUsers?: string[]; // If specified, only send to these user types
  userId?: number; // If specified, only send to this specific user
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId();
      
      const client: WebSocketClient = {
        ws,
        authenticated: false
      };

      this.clients.set(clientId, client);
      console.log(`🔌 WebSocket client connected: ${clientId}`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        message: 'Connected to Fundo Verde real-time service'
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`🔌 WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(clientId);
      });
    });

    console.log('🔌 WebSocket server initialized on /ws');
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private handleClientMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'authenticate':
        if (message.token && message.userId && message.userType) {
          // In a real app, verify the token here
          client.userId = message.userId;
          client.userType = message.userType;
          client.authenticated = true;
          
          this.sendToClient(clientId, {
            type: 'authenticated',
            message: 'Successfully authenticated',
            userType: message.userType
          });
          
          console.log(`🔌 Client ${clientId} authenticated as ${message.userType} (userId: ${message.userId})`);
        }
        break;

      case 'ping':
        this.sendToClient(clientId, { type: 'pong' });
        break;
    }
  }

  private sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Failed to send message to client ${clientId}:`, error);
      }
    }
  }

  // Public methods for broadcasting updates
  broadcastProjectUpdate(projectData: any) {
    this.broadcast({
      type: 'project_update',
      data: projectData
    });
  }

  broadcastInvestmentUpdate(investmentData: any) {
    this.broadcast({
      type: 'investment_update',
      data: investmentData
    });
  }

  broadcastPaymentProofUpdate(paymentProofData: any) {
    this.broadcast({
      type: 'payment_proof_update',
      data: paymentProofData
    });
  }

  broadcastSDGUpdate(sdgData: any) {
    this.broadcast({
      type: 'sdg_update',
      data: sdgData
    });
  }

  sendUserNotification(userId: number, notification: any) {
    this.broadcast({
      type: 'user_notification',
      data: notification,
      userId
    });
  }

  broadcastUserUpdate(userData: any) {
    this.broadcast({
      type: 'user_update',
      data: userData,
      targetUsers: ['admin'] // Only send to admin users
    });
  }

  broadcastCarbonUpdate(carbonData: any) {
    this.broadcast({
      type: 'carbon_update',
      data: carbonData
    });
  }

  private broadcast(message: RealTimeMessage) {
    const payload = {
      type: message.type,
      data: message.data,
      timestamp: new Date().toISOString()
    };

    let sentCount = 0;

    this.clients.forEach((client, clientId) => {
      // Only send to authenticated clients
      if (!client.authenticated) return;

      // Filter by user ID if specified
      if (message.userId && client.userId !== message.userId) return;

      // Filter by user type if specified
      if (message.targetUsers && client.userType && !message.targetUsers.includes(client.userType)) return;

      this.sendToClient(clientId, payload);
      sentCount++;
    });

    console.log(`📡 Broadcast ${message.type} to ${sentCount} clients`);
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  getAuthenticatedClients(): number {
    return Array.from(this.clients.values()).filter(client => client.authenticated).length;
  }
}

export const webSocketService = new WebSocketService();
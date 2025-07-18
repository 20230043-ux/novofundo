import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

export const useRealTimeNotifications = () => {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (!isConnected || !user) return;

    const handleProjectUpdate = (data: any) => {
      const { action, project } = data;
      
      switch (action) {
        case 'create':
          toast({
            title: "🚀 Novo projeto publicado",
            description: `O projeto "${project.name}" foi publicado`,
          });
          break;
        case 'update':
          toast({
            title: "📝 Projeto atualizado",
            description: `O projeto "${project.name}" foi atualizado`,
          });
          break;
        case 'delete':
          toast({
            title: "🗑️ Projeto removido",
            description: "Um projeto foi removido da plataforma",
          });
          break;
      }
    };

    const handleInvestmentUpdate = (data: any) => {
      if (user.role === 'admin') {
        toast({
          title: "💰 Novo investimento",
          description: "Um novo investimento foi registrado",
        });
      }
    };

    const handlePaymentProofUpdate = (data: any) => {
      const { action, paymentProof } = data;
      
      if (user.role === 'admin') {
        switch (action) {
          case 'status_update':
            toast({
              title: "📋 Comprovativo processado",
              description: `Status atualizado para ${paymentProof.status}`,
            });
            break;
          case 'sdg_assignment':
            toast({
              title: "🎯 ODS atribuído",
              description: "ODS foi atribuído a um comprovativo",
            });
            break;
        }
      } else if (paymentProof.userId === user.id || paymentProof.companyId === user.company?.id) {
        // Notify user if it's their payment proof
        switch (action) {
          case 'status_update':
            const statusText = paymentProof.status === 'approved' ? 'aprovado' : 'rejeitado';
            toast({
              title: `📋 Comprovativo ${statusText}`,
              description: `Seu comprovativo foi ${statusText} pelo administrador`,
              variant: paymentProof.status === 'approved' ? 'default' : 'destructive'
            });
            break;
        }
      }
    };

    // These would be connected to the WebSocket events in a real implementation
    // For now, we'll use a global event system that the WebSocket hook can trigger
    if (typeof window !== 'undefined') {
      window.addEventListener('websocket:project_update', (e: any) => handleProjectUpdate(e.detail));
      window.addEventListener('websocket:investment_update', (e: any) => handleInvestmentUpdate(e.detail));
      window.addEventListener('websocket:payment_proof_update', (e: any) => handlePaymentProofUpdate(e.detail));

      return () => {
        window.removeEventListener('websocket:project_update', handleProjectUpdate as any);
        window.removeEventListener('websocket:investment_update', handleInvestmentUpdate as any);
        window.removeEventListener('websocket:payment_proof_update', handlePaymentProofUpdate as any);
      };
    }
  }, [isConnected, user, toast]);

  return { isConnected };
};
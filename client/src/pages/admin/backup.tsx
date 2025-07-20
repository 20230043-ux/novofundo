import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Upload, 
  Database,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileBox,
  Users,
  User,
  BookOpen,
  HardDrive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import { apiRequest } from "@/lib/queryClient";

interface Backup {
  name: string;
  size: number;
  createdAt: string;
  sizeFormatted: string;
}

interface BackupResponse {
  success: boolean;
  backups?: Backup[];
  message?: string;
  filename?: string;
}

const AdminBackup = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupDescription, setBackupDescription] = useState("");
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Buscar lista de backups
  const { data: backupsData, isLoading } = useQuery<BackupResponse>({
    queryKey: ['/api/admin/backup/list'],
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  // Mutation para criar backup completo
  const createFullBackupMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await fetch('/api/admin/backup/create-full', {
        method: 'POST',
        body: JSON.stringify({ description }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar backup');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "✅ Backup criado com sucesso!",
        description: `Arquivo: ${data.filename}`,
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backup/list'] });
      setBackupDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao criar backup",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
        duration: 4000,
      });
    }
  });

  // Mutation para criar backup específico
  const createSpecificBackupMutation = useMutation({
    mutationFn: async ({ type, entityId }: { type: string; entityId: number }) => {
      const response = await fetch('/api/admin/backup/create-specific', {
        method: 'POST',
        body: JSON.stringify({ type, entityId }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar backup específico');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "✅ Backup específico criado!",
        description: `Arquivo: ${data.filename}`,
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backup/list'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao criar backup",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
        duration: 4000,
      });
    }
  });

  // Mutation para restaurar backup
  const restoreBackupMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('backup', file);
      
      return fetch('/api/admin/backup/restore', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }).then(res => res.json());
    },
    onSuccess: (data: any) => {
      toast({
        title: "✅ Backup restaurado com sucesso!",
        description: data.message,
        duration: 3000,
      });
      // Atualizar cache após restauração
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao restaurar backup",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
        duration: 4000,
      });
    }
  });

  const handleCreateFullBackup = () => {
    setIsCreatingBackup(true);
    createFullBackupMutation.mutate(backupDescription, {
      onSettled: () => setIsCreatingBackup(false)
    });
  };

  const handleDownloadBackup = (filename: string) => {
    window.open(`/api/admin/backup/download/${filename}`, '_blank');
  };

  const handleRestoreBackup = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast({
        title: "❌ Arquivo inválido",
        description: "Selecione um arquivo ZIP de backup",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsRestoring(true);
    restoreBackupMutation.mutate(file, {
      onSettled: () => setIsRestoring(false)
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      <Sidebar type="admin" />
      
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="font-bold text-2xl text-gray-800">Backup & Restauração</h1>
            <Badge variant="outline" className="mt-2 md:mt-0">
              Sistema de Backup Avançado
            </Badge>
          </div>

          {/* Seção de Criação de Backup */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Backup Completo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Backup Completo do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Cria um backup completo incluindo todas as empresas, pessoas, projetos, fotos, logos e comprovativos.
                </p>
                
                <div>
                  <Label htmlFor="description">Descrição do Backup (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Ex: Backup antes da atualização mensal"
                    value={backupDescription}
                    onChange={(e) => setBackupDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleCreateFullBackup}
                  disabled={isCreatingBackup || createFullBackupMutation.isPending}
                  className="w-full"
                >
                  {(isCreatingBackup || createFullBackupMutation.isPending) ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Criando Backup...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Criar Backup Completo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Restauração */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Restaurar Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                    <div className="text-sm text-yellow-700">
                      <strong>Atenção:</strong> A restauração irá substituir todos os dados atuais pelos dados do backup.
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">
                  Selecione um arquivo ZIP de backup para restaurar todo o sistema.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelected}
                  className="hidden"
                />

                <Button 
                  onClick={handleRestoreBackup}
                  disabled={isRestoring || restoreBackupMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  {(isRestoring || restoreBackupMutation.isPending) ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Restaurando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar e Restaurar Backup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <CardContent className="p-4">
                <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <h3 className="font-semibold text-lg">Empresas</h3>
                <p className="text-sm text-gray-600">Logos + Dados + Comprovativos</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-4">
                <User className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <h3 className="font-semibold text-lg">Pessoas</h3>
                <p className="text-sm text-gray-600">Fotos + Dados + Comprovativos</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-4">
                <BookOpen className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <h3 className="font-semibold text-lg">Projetos</h3>
                <p className="text-sm text-gray-600">Imagens + Atualizações + Dados</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-4">
                <HardDrive className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                <h3 className="font-semibold text-lg">Admin</h3>
                <p className="text-sm text-gray-600">Publicações + Configurações</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Backups Existentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileBox className="w-5 h-5 mr-2" />
                  Backups Disponíveis
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/backup/list'] })}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Atualizar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-4" />
                  <p className="text-gray-500">Carregando backups...</p>
                </div>
              ) : !backupsData?.success || !backupsData?.backups?.length ? (
                <div className="text-center py-8">
                  <FileBox className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">Nenhum backup encontrado</p>
                  <p className="text-gray-400 text-sm">Crie seu primeiro backup usando as opções acima</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {backupsData.backups.map((backup, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{backup.name}</h4>
                        <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDate(backup.createdAt)}
                          </span>
                          <span className="flex items-center">
                            <HardDrive className="w-4 h-4 mr-1" />
                            {backup.sizeFormatted}
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleDownloadBackup(backup.name)}
                        className="ml-4"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instruções */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Como Funciona o Sistema de Backup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-green-700">✅ O que é incluído no backup:</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Todas as informações das empresas e dados de login</li>
                    <li>• Logos das empresas com nomes organizados</li>
                    <li>• Informações pessoais e fotos de perfil</li>
                    <li>• Todos os projetos com imagens e atualizações</li>
                    <li>• Comprovativos de pagamento organizados por entidade</li>
                    <li>• Estrutura de pastas para facilitar a restauração</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-blue-700">📁 Organização dos arquivos:</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• <strong>empresas/</strong> - Uma pasta para cada empresa</li>
                    <li>• <strong>pessoas/</strong> - Uma pasta para cada pessoa</li>
                    <li>• <strong>projetos/</strong> - Projetos com medias organizadas</li>
                    <li>• <strong>dados.json</strong> - Informações detalhadas de cada entidade</li>
                    <li>• <strong>backup-metadata.json</strong> - Informações do backup</li>
                    <li>• Arquivos renomeados para fácil identificação</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminBackup;
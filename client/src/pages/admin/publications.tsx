import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { investmentEvents } from "@/lib/investment-events";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BookOpen, 
  Plus, 
  Upload, 
  Edit, 
  Trash2, 
  Clock,
  FileText,
  PlusCircle,
  Image,
  Calendar,
  ArrowRight,
  Goal,
  Eye,
  UploadCloud,
  FileVideo,
  X
} from "lucide-react";
import { Link } from "wouter";

// Define form schemas
const projectSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  sdgId: z.string().min(1, "Selecione um ODS"),
  peopleCount: z.string().min(1, "O número de pessoas é obrigatório").refine(
    val => !isNaN(parseInt(val)) && parseInt(val) >= 0,
    "O número de pessoas deve ser um número válido e não negativo"
  ),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const updateSchema = z.object({
  title: z.string().min(2, "O título deve ter pelo menos 2 caracteres"),
  content: z.string().min(10, "O conteúdo deve ter pelo menos 10 caracteres"),
});

const investmentSchema = z.object({
  totalInvested: z.string().min(1, "O valor investido é obrigatório"),
});

type UpdateFormValues = z.infer<typeof updateSchema>;
type InvestmentFormValues = z.infer<typeof investmentSchema>;

const AdminPublications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("projects");
  const [projectImage, setProjectImage] = useState<File | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isAddUpdateOpen, setIsAddUpdateOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isEditInvestmentOpen, setIsEditInvestmentOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<any | null>(null);
  const [editProjectImage, setEditProjectImage] = useState<File | null>(null);
  
  // Multiple timestamps for immediate cache busting
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const [projectTimestamps, setProjectTimestamps] = useState<Record<number, number>>({});
  const [forceRender, setForceRender] = useState(0);
  
  // Force component to re-render
  const triggerRender = useCallback(() => {
    setForceRender(prev => prev + 1);
  }, []);
  
  // Function to force immediate image refresh for specific project
  const forceProjectImageRefresh = (projectId: number) => {
    const newTimestamp = Date.now();
    setImageTimestamp(newTimestamp);
    setProjectTimestamps(prev => ({
      ...prev,
      [projectId]: newTimestamp
    }));
    
    // Force queries to refetch immediately
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    queryClient.refetchQueries({ queryKey: ['/api/projects'] });
  };
  
  // Fetch all projects with real-time optimized caching
  const { data: projects, isLoading: isLoadingProjects, refetch: refetchProjects } = useQuery({
    queryKey: ['/api/projects', imageTimestamp, forceRender],
    enabled: !!user && user.role === 'admin',
    staleTime: 0, // Always consider data stale for immediate updates
    gcTime: 0, // Don't cache query results for images
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    queryFn: async () => {
      const response = await fetch(`/api/projects?t=${imageTimestamp}&force=${forceRender}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    }
  });
  
  // Fetch all SDGs
  const { data: sdgs, isLoading: isLoadingSdgs } = useQuery({
    queryKey: ['/api/sdgs'],
    enabled: !!user && user.role === 'admin',
    staleTime: 1000 * 60 * 60, // 1 hour
  });
  
  // Project form
  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      sdgId: "",
      peopleCount: "",
    },
  });
  
  // Update form
  const updateForm = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });
  
  // Investment form
  const investmentForm = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      totalInvested: "",
    },
  });
  
  // State for media files
  const [updateMediaFiles, setUpdateMediaFiles] = useState<File[]>([]);
  
  // Create project mutation with instant optimistic update
  const createProjectMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        body: data,
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Erro ao criar projeto");
      }
      
      return await res.json();
    },
    onMutate: async (formData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/projects'] });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData(['/api/projects']);

      // Optimistically update to instantly show the new project
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const sdgId = parseInt(formData.get('sdgId') as string);
      
      const optimisticProject = {
        id: Date.now(), // Temporary ID
        name,
        description,
        sdgId,
        imageUrl: projectImage ? URL.createObjectURL(projectImage) : '/placeholder-project.jpg',
        totalInvested: formData.get('totalInvested') || '0',
        peopleCount: parseInt(formData.get('peopleCount') as string) || 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        _optimistic: true // Flag to identify optimistic updates
      };

      queryClient.setQueryData(['/api/projects'], (old: any[]) => 
        old ? [optimisticProject, ...old] : [optimisticProject]
      );

      // Return context with previous value
      return { previousProjects };
    },
    onError: (err, formData, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(['/api/projects'], context.previousProjects);
      }
      
      toast({
        title: "Erro ao criar projeto",
        description: "Houve um erro. Tente novamente.",
        variant: "destructive",
      });
    },
    onSuccess: (newProject) => {
      // Replace optimistic update with real data
      queryClient.setQueryData(['/api/projects'], (old: any[]) => {
        if (!old) return [newProject];
        return old.map(project => 
          project._optimistic && project.name === newProject.name 
            ? newProject 
            : project
        );
      });
      
      // Force complete refresh to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      // Switch to projects tab and reset form
      setActiveTab("projects");
      projectForm.reset();
      setProjectImage(null);
      
      toast({
        title: "Projeto criado",
        description: "Projeto publicado instantaneamente.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });
  
  // Delete project mutation with instant optimistic update
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Erro ao excluir projeto");
      }
      
      return await res.json();
    },
    onMutate: async (projectId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/projects'] });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData(['/api/projects']);

      // Optimistically remove the project from the list
      queryClient.setQueryData(['/api/projects'], (old: any[]) => 
        old ? old.filter(project => project.id !== projectId) : []
      );

      // Return context with previous value
      return { previousProjects };
    },
    onError: (err, projectId, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(['/api/projects'], context.previousProjects);
      }
      
      toast({
        title: "Erro ao excluir projeto",
        description: "Não foi possível excluir o projeto. Tente novamente.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      // Close dialog
      setIsDeleteAlertOpen(false);
      setProjectToDelete(null);
      
      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído com sucesso.",
      });
    },
  });
  
  // Add project update mutation with optimistic update
  const addUpdateMutation = useMutation({
    mutationFn: async ({ projectId, data, files }: { projectId: number, data: UpdateFormValues, files: File[] }) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", data.content);
      
      // Add files to formData
      if (files.length > 0) {
        files.forEach((file, index) => {
          formData.append("media", file);
        });
      }
      
      const res = await fetch(`/api/admin/projects/${projectId}/updates`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Erro ao adicionar atualização");
      }
      
      return await res.json();
    },
    onSuccess: ({ projectId }) => {
      // Invalidate all related queries for comprehensive updates
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      
      // Force refetch to ensure fresh data
      queryClient.refetchQueries({ queryKey: ['/api/projects'] });
      
      // Close dialog
      setIsAddUpdateOpen(false);
      setSelectedProject(null);
      updateForm.reset();
      setUpdateMediaFiles([]);
      
      toast({
        title: "Atualização adicionada",
        description: "A atualização foi adicionada com sucesso ao projeto.",
      });
    },
    onError: (err) => {
      toast({
        title: "Erro ao adicionar atualização",
        description: "Houve um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Edit project mutation with optimistic update
  const editProjectMutation = useMutation({
    mutationFn: async ({ projectId, data, image }: { projectId: number, data: ProjectFormValues, image: File | null }) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("sdgId", data.sdgId);
      formData.append("peopleCount", data.peopleCount);
      
      // Se tiver uma nova imagem, adiciona ao formData
      if (image) {
        formData.append("image", image);
      }
      
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Erro ao editar projeto");
      }
      
      return await res.json();
    },

    onSuccess: (updatedProject) => {
      // IMMEDIATE image cache busting for this specific project
      forceProjectImageRefresh(updatedProject.id);
      
      // Additional aggressive cache invalidation
      queryClient.removeQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${updatedProject.id}`] });
      
      // Force multiple immediate refetches to ensure fresh images
      setTimeout(() => refetchProjects(), 50);
      setTimeout(() => refetchProjects(), 200);
      setTimeout(() => refetchProjects(), 500);
      
      // Notify other tabs/windows about the project update
      localStorage.setItem('project-updated', Date.now().toString());
      localStorage.setItem('project-cache-clear', Date.now().toString());
      
      // Trigger storage event for cross-tab synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'project-updated',
        newValue: updatedProject.id.toString()
      }));
      
      // Close dialog and reset form
      projectForm.reset();
      setIsEditProjectOpen(false);
      setProjectToEdit(null);
      setEditProjectImage(null);
      
      toast({
        title: "Projeto atualizado",
        description: "A imagem foi atualizada e aparecerá imediatamente.",
      });
    },
    onError: (err) => {
      toast({
        title: "Erro ao editar projeto",
        description: "Houve um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Edit investment mutation with instant optimistic updates
  const editInvestmentMutation = useMutation({
    mutationFn: async ({ projectId, totalInvested }: { projectId: number, totalInvested: string }) => {
      const data = { totalInvested };
      
      const res = await fetch(`/api/admin/projects/${projectId}/investment`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao atualizar valor investido");
      }
      
      return { success: true, projectId, totalInvested };
    },
    onMutate: async ({ projectId, totalInvested }) => {
      console.log('Investment mutation started:', { projectId, totalInvested });
      
      // Cancel outgoing refetches for all project queries
      await queryClient.cancelQueries({ queryKey: ['/api/projects'] });

      // Get current query key with imageTimestamp and forceRender
      const currentQueryKey = ['/api/projects', imageTimestamp, forceRender];
      const previousProjects = queryClient.getQueryData(currentQueryKey);
      
      console.log('Previous projects data:', previousProjects);

      // Force an immediate update to trigger UI refresh
      const numValue = parseFloat(totalInvested);
      const updateProject = (project: any) => {
        if (project.id === projectId) {
          const updated = { 
            ...project, 
            totalInvested: numValue,
            displayInvestment: { 
              displayAmount: numValue
            }
          };
          console.log('Updating project:', updated);
          return updated;
        }
        return project;
      };

      // Update all possible query variations
      queryClient.setQueryData(currentQueryKey, (old: any[]) => {
        if (!old) return old;
        const updated = old.map(updateProject);
        console.log('Updated projects for current key:', updated);
        return updated;
      });

      queryClient.setQueryData(['/api/projects'], (old: any[]) => {
        if (!old) return old;
        const updated = old.map(updateProject);
        console.log('Updated projects for base key:', updated);
        return updated;
      });

      // Emit global investment update event for instant UI updates
      investmentEvents.emit(projectId, numValue);

      // Force React to re-render by updating timestamp and trigger render
      const newTimestamp = Date.now();
      setImageTimestamp(newTimestamp);
      triggerRender();

      // Return context with previous value
      return { previousProjects, currentQueryKey };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProjects && context?.currentQueryKey) {
        queryClient.setQueryData(context.currentQueryKey, context.previousProjects);
      }
      
      toast({
        title: "Erro ao atualizar valor",
        description: "Houve um erro. Tente novamente.",
        variant: "destructive",
      });
    },
    onSuccess: (data, { projectId, totalInvested }) => {
      console.log('Investment mutation success:', { projectId, totalInvested });
      
      // Emit global investment update event again to ensure all components are updated
      const numValue = parseFloat(totalInvested);
      investmentEvents.emit(projectId, numValue);
      
      // Force immediate cache invalidation and refresh
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.refetchQueries({ queryKey: ['/api/projects'] });
      
      // Force timestamp update to trigger re-render
      const newTimestamp = Date.now();
      setImageTimestamp(newTimestamp);
      triggerRender();
      
      // Close dialog
      setIsEditInvestmentOpen(false);
      setProjectToEdit(null);
      investmentForm.reset();
      
      toast({
        title: "Valor atualizado instantaneamente",
        description: "O valor investido foi atualizado em todos os componentes.",
      });
    },
  });
  
  // Submit new project
  const onProjectSubmit = (data: ProjectFormValues) => {
    if (!projectImage) {
      toast({
        title: "Imagem obrigatória",
        description: "Por favor, selecione uma imagem para o projeto.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("sdgId", data.sdgId);
    formData.append("peopleCount", data.peopleCount);
    formData.append("image", projectImage);
    
    createProjectMutation.mutate(formData);
  };
  
  // Submit project update
  const onUpdateSubmit = (data: UpdateFormValues) => {
    if (!selectedProject) {
      toast({
        title: "Erro",
        description: "Nenhum projeto selecionado.",
        variant: "destructive",
      });
      return;
    }
    
    addUpdateMutation.mutate({ 
      projectId: selectedProject.id, 
      data,
      files: updateMediaFiles
    });
  };
  
  // Submit investment update
  const onInvestmentSubmit = (data: InvestmentFormValues) => {
    if (!projectToEdit) {
      toast({
        title: "Erro",
        description: "Nenhum projeto selecionado.",
        variant: "destructive",
      });
      return;
    }
    
    // Limpa o valor para garantir que só temos números
    const cleanValue = data.totalInvested.replace(/[^\d]/g, '');
    
    console.log("Enviando valor:", {
      original: data.totalInvested,
      limpo: cleanValue
    });
    
    editInvestmentMutation.mutate({ 
      projectId: projectToEdit.id, 
      totalInvested: cleanValue
    });
  };
  
  // Handle project image change
  const handleProjectImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProjectImage(e.target.files[0]);
    }
  };
  
  // Handle edit project image change
  const handleEditProjectImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditProjectImage(e.target.files[0]);
    }
  };
  
  // Submit edit project form
  const onEditProjectSubmit = (data: ProjectFormValues) => {
    if (!projectToEdit) {
      toast({
        title: "Erro",
        description: "Nenhum projeto selecionado para edição.",
        variant: "destructive",
      });
      return;
    }
    
    editProjectMutation.mutate({
      projectId: projectToEdit.id,
      data,
      image: editProjectImage
    });
  };
  
  // Open update dialog
  const openUpdateDialog = (project: any) => {
    setSelectedProject(project);
    setIsAddUpdateOpen(true);
    setUpdateMediaFiles([]);
    updateForm.reset({
      title: "",
      content: "",
    });
  };
  
  // Open edit investment dialog
  const openEditInvestmentDialog = (project: any) => {
    setProjectToEdit(project);
    setIsEditInvestmentOpen(true);
    
    // Verificar o valor atual diretamente do banco de dados
    fetch(`/api/projects/${project.id}`)
      .then(res => res.json())
      .then(updatedProject => {
        // Verificar se existe um valor específico para exibição
        const displayValue = updatedProject.displayInvestment?.displayAmount || updatedProject.totalInvested;
        console.log("Valor para exibição:", displayValue);
        investmentForm.reset({
          totalInvested: displayValue ? displayValue.toString() : "0",
        });
      })
      .catch(err => {
        console.error("Erro ao buscar projeto:", err);
        // Fallback para o valor local se falhar
        const fallbackValue = project.displayInvestment?.displayAmount || project.totalInvested;
        investmentForm.reset({
          totalInvested: fallbackValue ? fallbackValue.toString() : "0",
        });
      });
  };
  
  // Open edit project dialog
  const openEditDialog = (project: any) => {
    setProjectToEdit(project);
    setIsEditProjectOpen(true);
    setEditProjectImage(null);
    
    // Substituir o formulário existente para edição
    projectForm.reset({
      name: project.name,
      description: project.description,
      sdgId: project.sdgId.toString(),
      peopleCount: project.peopleCount ? project.peopleCount.toString() : "0",
    });
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = (project: any) => {
    setProjectToDelete(project);
    setIsDeleteAlertOpen(true);
  };
  
  // Handle delete project confirmation
  const handleDeleteProject = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
    }
  };
  
  // Handle media files selection for project update
  const handleUpdateMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUpdateMediaFiles([...updateMediaFiles, ...filesArray]);
    }
  };
  
  // Format currency
  const formatCurrency = (value: string | number) => {
    if (!value) return "0 Kz";
    
    try {
      // Primeiro convertemos para string para garantir formato consistente
      let valueStr = String(value);
      
      // Remove caracteres não numéricos, exceto ponto decimal
      valueStr = valueStr.replace(/[^0-9.]/g, '');
      
      // Converte para número
      const num = parseFloat(valueStr);
      
      if (isNaN(num)) return "0 Kz";
      
      return new Intl.NumberFormat('pt-AO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num) + " Kz";
    } catch (error) {
      console.error("Erro ao formatar valor:", error);
      return "0 Kz";
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar type="admin" />
        
        <div className="flex-1 overflow-auto bg-gray-100 w-full">
          <div className="container mx-auto px-4 py-8">
            <h1 className="font-bold text-2xl text-gray-800 mb-6">Gerenciar Publicações</h1>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="projects" className="flex items-center gap-2 tabs-trigger">
                  <BookOpen className="h-4 w-4" />
                  <span>Projetos</span>
                </TabsTrigger>
                <TabsTrigger value="new-project" className="flex items-center gap-2 tabs-trigger">
                  <Plus className="h-4 w-4" />
                  <span>Novo Projeto</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Projects List Tab */}
              <TabsContent value="projects">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Projetos Existentes
                    </CardTitle>
                    <CardDescription>
                      Gerencie os projetos existentes e adicione atualizações.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingProjects ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : projects && Array.isArray(projects) && projects.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Projeto</TableHead>
                              <TableHead>ODS</TableHead>
                              <TableHead>Valor Investido</TableHead>
                              <TableHead>Atualizações</TableHead>
                              <TableHead>Pessoas</TableHead>
                              <TableHead>Pessoas Investidoras</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Array.isArray(projects) && projects.map((project: any) => (
                              <TableRow key={project.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <img 
                                      src={`${project.imageUrl}?t=${projectTimestamps[project.id] || imageTimestamp}&id=${project.id}&r=${Math.random()}`} 
                                      alt={project.name} 
                                      className="w-10 h-10 object-cover rounded"
                                      key={`${project.id}-${projectTimestamps[project.id] || imageTimestamp}-${Date.now()}`}
                                      onError={(e) => {
                                        // Fallback if image fails to load
                                        e.currentTarget.src = '/api/placeholder/40/40';
                                      }}
                                    />
                                    <div>
                                      <p className="font-medium">{project.name}</p>
                                      <p className="text-xs text-gray-500">
                                        Criado em {formatDate(project.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {project.sdg && (
                                    <Badge
                                      style={{ backgroundColor: project.sdg.color }}
                                      className="text-white"
                                    >
                                      ODS {project.sdg.number}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
    <div className="flex items-center gap-2">
      <Button
        variant="link"
        className="p-0 h-auto font-normal"
        onClick={(e) => {
          e.stopPropagation();
          openEditInvestmentDialog(project);
        }}
      >
        {formatCurrency(project.displayInvestment?.displayAmount || project.totalInvested)}
        <Edit className="h-3 w-3 ml-2 text-gray-600" />
      </Button>
    </div>
  </TableCell>
                                <TableCell>
                                  {project.updates && project.updates.length > 0 ? (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                      {project.updates.length} atualizações
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                      Sem atualizações
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      {project.peopleCount || 0} pessoas
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {project.investments && project.investments.length > 0 ? (
                                    <div className="flex -space-x-2">
                                      {project.investments.slice(0, 3).map((investment: any, index: number) => (
                                        <Avatar key={index} className="h-6 w-6 border-2 border-white">
                                          <AvatarImage src={investment.company.logoUrl} alt={investment.company.name} />
                                          <AvatarFallback className="text-xs bg-primary text-white">
                                            {investment.company.name.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                      ))}
                                      {project.investments.length > 3 && (
                                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 border-2 border-white">
                                          +{project.investments.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-sm">Nenhuma</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => openUpdateDialog(project)}
                                      className="text-primary"
                                    >
                                      <PlusCircle className="h-4 w-4 mr-1" />
                                      <span>Atualização</span>
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => openEditDialog(project)}
                                      className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      <span>Editar</span>
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      asChild
                                    >
                                      <Link href={`/projeto/${project.id}`} className="text-gray-600">
                                        <Eye className="h-4 w-4 mr-1" />
                                        <span>Ver</span>
                                      </Link>
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => openDeleteDialog(project)}
                                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      <span>Eliminar</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 mb-4">Nenhum projeto encontrado.</p>
                        <Button onClick={() => setActiveTab("new-project")}>
                          Criar Projeto
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* New Project Tab */}
              <TabsContent value="new-project" id="new-project-tab">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" />
                      Criar Novo Projeto
                    </CardTitle>
                    <CardDescription>
                      Crie um novo projeto vinculado a um Objetivo de Desenvolvimento Sustentável.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...projectForm}>
                      <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-6">
                        <FormField
                          control={projectForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Projeto</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Reflorestamento da Reserva Natural" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={projectForm.control}
                          name="sdgId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ODS Relacionado</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um ODS" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {!isLoadingSdgs && sdgs && Array.isArray(sdgs) && sdgs.map((sdg: any) => (
                                    <SelectItem 
                                      key={sdg.id} 
                                      value={sdg.id.toString()}
                                    >
                                      ODS {sdg.number}: {sdg.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={projectForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição do Projeto</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Descreva o projeto detalhadamente..." 
                                  className="min-h-32"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={projectForm.control}
                          name="peopleCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Pessoas Impactadas</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Ex: 500" 
                                  min="0"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div>
                          <FormLabel>Imagem do Projeto</FormLabel>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              {projectImage ? (
                                <div className="mb-3">
                                  <img 
                                    src={URL.createObjectURL(projectImage)} 
                                    alt="Preview" 
                                    className="mx-auto h-32 w-auto rounded-md" 
                                  />
                                </div>
                              ) : (
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              )}
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="project-image-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-600"
                                >
                                  <span>{projectImage ? "Alterar imagem" : "Carregar uma imagem"}</span>
                                  <input
                                    id="project-image-upload"
                                    name="project-image-upload"
                                    type="file"
                                    className="sr-only"
                                    onChange={handleProjectImageChange}
                                    accept="image/*"
                                  />
                                </label>
                                {!projectImage && <p className="pl-1">ou arraste e solte</p>}
                              </div>
                              <p className="text-xs text-gray-500">
                                PNG, JPG até 5MB
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          type="submit"
                          disabled={createProjectMutation.isPending}
                          className="w-full sm:w-auto"
                        >
                          {createProjectMutation.isPending ? "Criando..." : "Criar Projeto"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Project Update Dialog */}
            <Dialog open={isAddUpdateOpen} onOpenChange={setIsAddUpdateOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-primary" />
                    Adicionar Atualização ao Projeto
                  </DialogTitle>
                  <DialogDescription>
                    {selectedProject && (
                      <div className="flex items-center mt-1">
                        <Badge
                          style={{ backgroundColor: selectedProject.sdg?.color }}
                          className="text-white mr-2"
                        >
                          ODS {selectedProject.sdg?.number}
                        </Badge>
                        <span>{selectedProject.name}</span>
                      </div>
                    )}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...updateForm}>
                  <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-6">
                    <FormField
                      control={updateForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título da Atualização</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Progresso do Reflorestamento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={updateForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conteúdo</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva os avanços e novidades do projeto..." 
                              className="min-h-32"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <div>
                        <Label>Arquivos de Mídia (opcional)</Label>
                        <div className="mt-2">
                          <div className="flex items-center justify-center w-full">
                            <Label
                              htmlFor="media-upload"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-gray-500" />
                                <p className="mb-2 text-sm text-gray-500">
                                  <span className="font-semibold">Clique para enviar arquivos</span> ou arraste e solte
                                </p>
                                <p className="text-xs text-gray-500">
                                  Imagens e vídeos são suportados
                                </p>
                              </div>
                              <input
                                id="media-upload"
                                type="file"
                                className="hidden"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleUpdateMediaChange}
                              />
                            </Label>
                          </div>
                        </div>
                      </div>
                      
                      {updateMediaFiles.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Arquivos selecionados ({updateMediaFiles.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {updateMediaFiles.map((file, index) => (
                              <div key={index} className="relative group">
                                <div className="w-16 h-16 border rounded-md flex items-center justify-center bg-gray-50">
                                  {file.type.startsWith('image/') ? (
                                    <img 
                                      src={URL.createObjectURL(file)} 
                                      alt={file.name} 
                                      className="max-w-full max-h-full object-contain rounded-md"
                                    />
                                  ) : (
                                    <FileVideo className="w-8 h-8 text-gray-400" />
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    const newFiles = [...updateMediaFiles];
                                    newFiles.splice(index, 1);
                                    setUpdateMediaFiles(newFiles);
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <p className="text-xs text-gray-500 truncate w-16 text-center mt-1">
                                  {file.name.length > 10 ? `${file.name.substring(0, 7)}...` : file.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddUpdateOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={addUpdateMutation.isPending}
                      >
                        {addUpdateMutation.isPending ? "Adicionando..." : "Adicionar Atualização"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Help Cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Sobre os Projetos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Os projetos representam iniciativas concretas para atingir os Objetivos de Desenvolvimento Sustentável. 
                    Eles são financiados com os valores pagos pelas empresas para compensação de carbono.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Atualizações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Mantenha as empresas informadas sobre o progresso dos projetos que elas financiam através de atualizações regulares.
                    Inclua fotos, vídeos e detalhes sobre os avanços e resultados alcançados.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Goal className="h-5 w-5 text-primary" />
                    Investimentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Os investimentos são criados automaticamente quando um comprovativo é aprovado e um ODS é atribuído.
                    O sistema direciona os valores para os projetos relacionados ao ODS selecionado.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Edit Project Dialog */}
            <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg flex items-center gap-2">
                    <Edit className="h-5 w-5 text-amber-600" />
                    Editar Projeto
                  </DialogTitle>
                  <DialogDescription>
                    {projectToEdit && (
                      <div className="flex items-center mt-1">
                        <Badge
                          style={{ backgroundColor: projectToEdit.sdg?.color }}
                          className="text-white mr-2"
                        >
                          ODS {projectToEdit.sdg?.number}
                        </Badge>
                        <span>{projectToEdit.name}</span>
                      </div>
                    )}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...projectForm}>
                  <form onSubmit={projectForm.handleSubmit(onEditProjectSubmit)} className="space-y-6">
                    <FormField
                      control={projectForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Projeto</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Reflorestamento da Reserva Natural" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={projectForm.control}
                      name="sdgId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ODS Relacionado</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um ODS" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {!isLoadingSdgs && sdgs && Array.isArray(sdgs) && sdgs.map((sdg: any) => (
                                <SelectItem 
                                  key={sdg.id} 
                                  value={sdg.id.toString()}
                                >
                                  ODS {sdg.number}: {sdg.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={projectForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição do Projeto</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o projeto detalhadamente..." 
                              className="min-h-32"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={projectForm.control}
                      name="peopleCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Pessoas Impactadas</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ex: 500" 
                              min="0"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <FormLabel>Imagem do Projeto</FormLabel>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          {editProjectImage ? (
                            <div className="mb-3">
                              <img 
                                src={URL.createObjectURL(editProjectImage)} 
                                alt="Preview" 
                                className="mx-auto h-32 w-auto rounded-md" 
                              />
                            </div>
                          ) : projectToEdit ? (
                            <div className="mb-3">
                              <img 
                                src={`${projectToEdit.imageUrl}?t=${projectTimestamps[projectToEdit.id] || imageTimestamp}&id=${projectToEdit.id}&r=${Math.random()}`} 
                                alt={projectToEdit.name} 
                                className="mx-auto h-32 w-auto rounded-md" 
                                key={`edit-${projectToEdit.id}-${projectTimestamps[projectToEdit.id] || imageTimestamp}`}
                              />
                            </div>
                          ) : (
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          )}
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="edit-project-image-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-600 mx-auto"
                            >
                              <span>{editProjectImage ? "Alterar imagem" : "Alterar imagem (opcional)"}</span>
                              <input
                                id="edit-project-image-upload"
                                name="edit-project-image-upload"
                                type="file"
                                className="sr-only"
                                onChange={handleEditProjectImageChange}
                                accept="image/*"
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG até 5MB
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditProjectOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={editProjectMutation.isPending}
                      >
                        {editProjectMutation.isPending ? "Atualizando..." : "Atualizar Projeto"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Delete Project Alert Dialog */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-600">
                    Eliminar Projeto
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {projectToDelete && (
                      <>
                        Tem certeza que deseja eliminar o projeto <strong>{projectToDelete.name}</strong>?
                        <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                          <p>Esta ação não pode ser desfeita. Isso irá:</p>
                          <ul className="list-disc list-inside mt-2">
                            <li>Eliminar permanentemente o projeto</li>
                            <li>Remover todas as atualizações associadas</li>
                            <li>Desassociar todos os investimentos</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteProject}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleteProjectMutation.isPending ? "Eliminando..." : "Eliminar Projeto"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {/* Edit Investment Dialog */}
        <Dialog open={isEditInvestmentOpen} onOpenChange={setIsEditInvestmentOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Editar Valor Investido
              </DialogTitle>
              <DialogDescription>
                {projectToEdit ? `Projeto: ${projectToEdit.name}` : 'Edite o valor total investido neste projeto.'}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...investmentForm}>
              <form onSubmit={investmentForm.handleSubmit(onInvestmentSubmit)} className="space-y-4">
                <FormField
                  control={investmentForm.control}
                  name="totalInvested"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total Investido (Kz)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 5000000" 
                          {...field} 
                          onChange={(e) => {
                            // Remove formatação para armazenar apenas o número
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditInvestmentOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={editInvestmentMutation.isPending}
                  >
                    {editInvestmentMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminPublications;

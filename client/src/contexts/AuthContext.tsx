import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'company' | 'individual';
  company?: {
    id: number;
    name: string;
    sector: string;
    logoUrl?: string;
    phone?: string;
    location?: string;
    employeeCount?: number;
  };
  individual?: {
    id: number;
    firstName: string;
    lastName: string;
    phone?: string;
    location?: string;
    occupation?: string;
    profilePictureUrl?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  registerIndividual: (data: RegisterIndividualData) => Promise<void>;
  updateUser: (userData: User) => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  sector: string;
  logoUrl?: string;
}

interface RegisterIndividualData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  occupation?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/login', { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      queryClient.removeQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest('POST', '/api/register', {
        ...data,
        role: 'company',
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
  });

  const registerIndividualMutation = useMutation({
    mutationFn: async (data: RegisterIndividualData) => {
      const response = await apiRequest('POST', '/api/register-individual', {
        ...data,
        role: 'individual',
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  };

  const registerIndividual = async (data: RegisterIndividualData) => {
    await registerIndividualMutation.mutateAsync(data);
  };

  const updateUser = (userData: User) => {
    queryClient.setQueryData(['/api/user'], userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        registerIndividual,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { adminService } from '../services/adminService';
import type { UserCreateIn } from '../types/api';

export function useUsers(params?: { page?: number; limit?: number; role?: string }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.getUsers(params),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreateIn) => adminService.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      message.success('Utilisateur créé avec succès.');
    },
    onError: () => message.error("Erreur lors de la création de l'utilisateur."),
  });
}

export function useToggleUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminService.toggleUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      message.success('Statut utilisateur mis à jour.');
    },
    onError: () => message.error('Erreur lors de la modification.'),
  });
}

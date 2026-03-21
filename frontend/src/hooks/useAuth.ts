import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import type { LoginRequest, RegisterRequest, Role } from '../types/auth';

export function useLogin() {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: ({ token, user }) => {
      login(token.access_token, user);
      const redirectMap: Record<Role, string> = {
        ADMIN: '/admin',
        RH: '/rh',
        AGENT: '/agent',
        CANDIDATE: '/candidate',
        VISITOR: '/',
      };
      navigate(redirectMap[token.role] ?? '/');
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      message.error(typeof detail === 'string' ? detail : 'Email ou mot de passe incorrect.');
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  return () => {
    logout();
    navigate('/login');
  };
}

export function useRegister() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: () => {
      message.success('Inscription réussie. Connectez-vous.');
      navigate('/login');
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      message.error(typeof detail === 'string' ? detail : "Erreur lors de l'inscription.");
    },
  });
}

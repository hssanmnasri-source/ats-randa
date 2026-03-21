export type Role = 'VISITOR' | 'CANDIDATE' | 'AGENT' | 'RH' | 'ADMIN';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  is_active: boolean;
  departement?: string | null;
  id_filiale?: number | null;
}

export interface TokenOut {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
}

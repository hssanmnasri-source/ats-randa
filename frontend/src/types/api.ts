export interface UserOut {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  departement?: string | null;
  id_filiale?: number | null;
  is_active: boolean;
}

export interface UserListOut {
  total: number;
  users: UserOut[];
}

export interface UserCreateIn {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: string;
  departement?: string | null;
  id_filiale?: number | null;
}

// GET /api/rh/dashboard
export interface RHDashboardStats {
  candidates?: { total: number };
  cvs?: {
    total: number;
    new_7_days?: number;
    by_statut?: Record<string, number>;
    by_source?: Record<string, number>;
  };
  offers?: {
    total: number;
    active: number;
    my_total?: number;
    my_active?: number;
  };
}

// GET /api/admin/stats
export interface AdminStats {
  users?: { total: number; par_role?: Record<string, number> };
  cvs?: { total: number; par_statut?: Record<string, number> };
  offres?: { total: number; par_statut?: Record<string, number> };
  candidatures?: {
    total: number;
    acceptees?: number;
    refusees?: number;
    en_attente?: number;
  };
  candidats?: { total: number };
}

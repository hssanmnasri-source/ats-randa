export interface AdminStats {
  users: {
    total: number
    actifs: number
    par_role: Record<string, number>
    nouveaux_7j: number
  }
  cvs: {
    total: number
    indexes: number
    erreurs: number
    par_statut: Record<string, number>
    par_source: Record<string, number>
    nouveaux_7j: number
    nouveaux_30j: number
  }
  offres: {
    total: number
    actives: number
    archivees: number
  }
  matching: {
    total_resultats: number
    par_decision: Record<string, number>
    score_moyen: number
  }
  candidats: {
    total: number
  }
  top_rh: Array<{
    nom: string
    prenom: string
    email: string
    nb_offres: number
  }>
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  services: {
    postgresql: string
    pgvector: string
    redis: string
    celery: string
  }
  metrics: {
    db_size: string
    redis_memory: string
    celery_workers: number
    cvs_pending_embedding: number
  }
  timestamp: string
}

export interface AuditLog {
  id: number
  user_id: number | null
  action: string
  resource: string | null
  resource_id: number | null
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
  user_nom?: string
  user_email?: string
}

export interface UserWithStats {
  id: number
  nom: string
  prenom: string
  email: string
  role: string
  departement: string | null
  is_active: boolean
  created_at: string
  nb_offres?: number
  nb_cvs?: number
  nb_candidatures?: number
}

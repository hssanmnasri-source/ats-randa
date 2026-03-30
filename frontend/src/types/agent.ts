export interface AgentStats {
  total_cvs: number
  indexes: number
  en_attente: number
  erreurs: number
  total_candidatures: number
  retenus: number
  refuses: number
  pending: number
}

export interface AgentCandidat {
  cv_id: number
  candidate_id: number
  nom: string
  prenom: string
  email: string | null
  cv_statut: string
  date_upload: string
  nb_candidatures: number
  meilleur_score: number | null
  meilleure_decision: string | null
}

export interface AgentDashboard {
  stats: AgentStats
  candidats_recents: AgentCandidat[]
}

export interface OCRQuality {
  score: number
  niveau: 'EXCELLENT' | 'BON' | 'MOYEN' | 'FAIBLE' | 'ECHEC'
  message: string
  conseils: string[]
  nb_caracteres: number
  nb_mots: number
  a_email: boolean
  a_telephone: boolean
  a_sections: boolean
}

export interface BatchUploadResult {
  fichier: string
  statut: 'OK' | 'ERREUR'
  cv_id: number | null
  candidate_id?: number
  ocr_quality?: OCRQuality
  message: string
}

export interface BatchUploadResponse {
  total: number
  reussis: number
  erreurs: number
  resultats: BatchUploadResult[]
}

export interface HistoryEntry {
  cv_id: number
  date: string
  candidat_nom: string
  candidat_prenom: string
  candidat_email: string | null
  cv_statut: string
  nb_offres_matchees: number
  meilleur_score: number | null
  decisions: {
    retained: number
    refused: number
    pending: number
  }
  offres: Array<{
    offre_id: number
    offre_titre: string
    decision: string
    score: number
  }>
}

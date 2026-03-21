// CV from candidate space
export interface CVOut {
  id: number;
  id_candidate: number;
  date_depot: string;
  statut: string;
  source?: string | null;
  fichier_pdf?: string | null;
  cv_entities?: Record<string, unknown> | null;
  score_final: number;
}

export interface CVListOut {
  total: number;
  cvs: CVOut[];
}

// CV detail (with candidate info)
export interface CVDetailOut {
  id: number;
  id_candidate: number;
  id_agent?: number | null;
  statut: string;
  source: string;
  date_depot: string;
  fichier_pdf?: string | null;
  cv_entities?: unknown | null;
  candidate?: CandidateOut | null;
}

// Agent CV list
export interface AgentCVListOut {
  total: number;
  page: number;
  pages: number;
  cvs: CVDetailOut[];
}

export interface CandidateOut {
  id: number;
  nom?: string | null;
  prenom?: string | null;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  date_naissance?: string | null;
  created_at: string;
}

export interface CandidateProfileOut {
  id: number;
  nom?: string | null;
  prenom?: string | null;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  date_naissance?: string | null;
  created_at: string;
}

export interface LangueIn {
  langue: string;
  niveau?: string;
}

export interface CVFormIn {
  titre_poste: string;
  resume: string;
  experience_annees: number;
  niveau_etude: string;
  competences: string[];
  langues?: LangueIn[];
  telephone?: string | null;
  adresse?: string | null;
  disponibilite?: string | null;
  salaire_souhaite?: string | null;
}

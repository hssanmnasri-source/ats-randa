// ── CV ────────────────────────────────────────────────────────────────────────

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

export interface AgentCVListOut {
  total: number;
  page: number;
  pages: number;
  cvs: CVDetailOut[];
}

// ── Candidate ─────────────────────────────────────────────────────────────────

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
  // Extended
  photo_url?:           string | null;
  titre_poste?:         string | null;
  niveau_etude?:        string | null;
  salaire_actuel?:      string | null;
  disponibilite?:       string | null;
  genre?:               string | null;
  situation_familiale?: string | null;
  nationalite?:         string | null;
  has_driving_license:  boolean;
  owns_car:             boolean;
  has_handicap:         boolean;
  visibility_status:    'VISIBLE' | 'ANONYMOUS' | 'INVISIBLE';
  alert_frequency:      'DAILY' | 'TWICE_WEEK' | 'WEEKLY' | 'NEVER';
  created_at: string;
}

// ── CV Form ───────────────────────────────────────────────────────────────────

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

// ── Experiences & Skills ──────────────────────────────────────────────────────

export interface ExperienceOut {
  id:           number;
  poste?:       string | null;
  entreprise?:  string | null;
  date_debut?:  string | null;
  date_fin?:    string | null;
  description?: string | null;
}

export interface SkillOut {
  id:             number;
  nom_competence: string;
  niveau:         string;
}

// ── Profile completion ────────────────────────────────────────────────────────

export interface SectionCompletion {
  label:  string;
  weight: number;
  score:  number;
  filled: boolean;
}

export interface ProfileCompletionOut {
  total:    number;
  sections: Record<string, SectionCompletion>;
}

export interface FullProfileOut {
  profile:     CandidateProfileOut;
  completion:  ProfileCompletionOut;
  experiences: ExperienceOut[];
  skills:      SkillOut[];
  langues:     Array<{ langue: string; niveau?: string }>;
}

// ── Cover Letters ─────────────────────────────────────────────────────────────

export interface CoverLetterOut {
  id:          number;
  titre:       string;
  contenu:     string;
  created_at:  string;
  updated_at?: string;
}

export interface CoverLetterListOut {
  total:         number;
  cover_letters: CoverLetterOut[];
}

// ── Documents ─────────────────────────────────────────────────────────────────

export interface DocumentOut {
  id:         number;
  nom:        string;
  type_doc?:  string | null;
  taille?:    number | null;
  created_at: string;
}

export interface DocumentListOut {
  total:     number;
  documents: DocumentOut[];
}

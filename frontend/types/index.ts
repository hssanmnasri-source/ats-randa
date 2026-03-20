export interface User { id: number; email: string; nom?: string; prenom?: string; role: string; }
export interface AuthState { user: User | null; token: string | null; login: (token: string, user: User) => void; logout: () => void; }
export interface Offer { id: number; titre: string; description?: string; statut: string; date_publication: string; competences_requises?: string[]; experience_requise?: number; }
export interface CV { id: number; id_candidate: number; statut: string; source?: string; fichier_pdf?: string; cv_entities?: Record<string, unknown>; score_final: number; date_depot: string; }
export interface Resultat { id: number; id_cv: number; id_offre: number; rang?: number; score_final: number; score_matching: number; score_skills: number; score_experience: number; score_langue: number; decision: string; date_analyse: string; }
export interface Application { id: number; id_offre: number; id_cv: number; score_final: number; decision: string; date_candidature: string; offre?: { id: number; titre: string; statut: string; }; }
export interface Candidate { id: number; nom?: string; prenom?: string; email?: string; telephone?: string; created_at: string; }
export interface DashboardStats { total_cvs: number; total_candidates: number; total_offers: number; cvs_by_source?: Record<string, number>; cvs_by_status?: Record<string, number>; }

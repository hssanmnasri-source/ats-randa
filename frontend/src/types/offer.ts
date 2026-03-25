export type OfferStatut = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface OfferDetails {
  reference_interne?: string;
  type_poste?: string;
  disponibilite?: string;
  salaire_min?: number;
  salaire_max?: number;
  salaire_periode?: string;
  niveau_etude?: string;
  niveau_experience?: string;
  langues?: string[];
  permis?: boolean;
  metiers?: string[];
  pays?: string;
  region?: string;
  ville?: string;
  mobilite_locale?: boolean;
  mobilite_internationale?: boolean;
  anonyme?: boolean;
  url_externe?: string;
  notification_email?: string;
  email_responsable?: string;
}

export interface JobOffer {
  id: number;
  titre: string;
  description: string;
  competences_requises: string[];
  experience_requise: number;
  langue_requise: string;
  date_publication: string;
  plateforme_source: string;
  statut: OfferStatut;
  id_rh?: number | null;
  details?: OfferDetails | null;
}

export interface OfferListOut {
  total: number;
  offers: JobOffer[];
}

export interface PublicOfferListOut {
  total: number;
  page: number;
  limit: number;
  offers: JobOffer[];
}

export interface CreateOfferRequest {
  // Core
  titre: string;
  description: string;
  competences_requises?: string[];
  experience_requise?: number;
  langue_requise?: string;
  // Extended
  reference_interne?: string;
  type_poste?: string;
  disponibilite?: string;
  salaire_min?: number;
  salaire_max?: number;
  salaire_periode?: string;
  niveau_etude?: string;
  niveau_experience?: string;
  langues?: string[];
  permis?: boolean;
  metiers?: string[];
  pays?: string;
  region?: string;
  ville?: string;
  mobilite_locale?: boolean;
  mobilite_internationale?: boolean;
  anonyme?: boolean;
  url_externe?: string;
  notification_email?: string;
  email_responsable?: string;
}

export interface UpdateOfferRequest {
  titre?: string | null;
  description?: string | null;
  competences_requises?: string[] | null;
  experience_requise?: number | null;
  langue_requise?: string | null;
  reference_interne?: string | null;
  type_poste?: string | null;
  disponibilite?: string | null;
  salaire_min?: number | null;
  salaire_max?: number | null;
  salaire_periode?: string | null;
  niveau_etude?: string | null;
  niveau_experience?: string | null;
  langues?: string[] | null;
  permis?: boolean | null;
  metiers?: string[] | null;
  pays?: string | null;
  region?: string | null;
  ville?: string | null;
  mobilite_locale?: boolean | null;
  mobilite_internationale?: boolean | null;
  anonyme?: boolean | null;
  url_externe?: string | null;
  notification_email?: string | null;
  email_responsable?: string | null;
}

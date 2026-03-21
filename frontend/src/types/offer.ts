export type OfferStatut = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

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
  titre: string;
  description: string;
  competences_requises?: string[];
  experience_requise?: number;
  langue_requise?: string;
}

export interface UpdateOfferRequest {
  titre?: string | null;
  description?: string | null;
  competences_requises?: string[] | null;
  experience_requise?: number | null;
  langue_requise?: string | null;
}

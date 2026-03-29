export interface RHStats {
  mes_offres: {
    actives: number
    archivees: number
    total: number
  }
  candidatures: {
    total: number
    pending: number
    retained: number
    refused: number
    nouvelles_24h: number
  }
  cvtheque: {
    total_cvs: number
    avec_embedding: number
  }
}

export interface CVSearchResult {
  cv_id: number
  nom: string
  prenom: string
  email: string
  telephone: string
  source: 'KEEJOB' | 'AGENT' | 'CANDIDAT'
  score: number
  extrait: string
}

export interface CVSearchResponse {
  query: string
  total: number
  results: CVSearchResult[]
}

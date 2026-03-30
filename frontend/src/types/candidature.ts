export interface TimelineStep {
  statut: string
  label: string
  description: string
  date: string | null
  done: boolean
  active: boolean
  color: string
}

export interface CandidatureDetail {
  id: number
  offre_id: number
  offre_titre: string
  date_candidature: string
  decision: string
  score_final: number
  score_matching: number
  score_skills: number
  score_experience: number
  score_langue: number
  feedback_rh: string | null
  feedback_visible: boolean
  date_decision: string | null
  timeline: TimelineStep[]
}

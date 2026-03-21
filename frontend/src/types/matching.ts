export type Decision = 'RETAINED' | 'PENDING' | 'REFUSED';

export interface ResultatOut {
  id: number;
  id_cv: number;
  rang?: number;
  score_final: number;
  score_matching: number;
  score_skills: number;
  score_experience: number;
  score_langue?: number;
  decision: Decision;
  date_analyse: string;
}

export interface MatchingResultsOut {
  offer_id: number;
  titre: string;
  total: number;
  skip: number;
  limit: number;
  resultats: ResultatOut[];
}

export interface UpdateDecisionRequest {
  decision: Decision;
}

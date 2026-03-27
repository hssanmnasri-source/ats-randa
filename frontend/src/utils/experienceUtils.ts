import type { ExperienceOut } from '../types/cv';

export function calcExpYears(experiences: ExperienceOut[]): number {
  if (!experiences.length) return 0;
  let total = 0;
  const now = new Date();
  for (const exp of experiences) {
    const start = exp.date_debut ? new Date(exp.date_debut) : null;
    const end   = exp.is_current ? now : (exp.date_fin ? new Date(exp.date_fin) : null);
    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      total += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    }
  }
  return Math.round(total);
}

import React from 'react';
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type {
  CandidateProfileOut,
  ExperienceOut,
  SkillOut,
  FormationOut,
} from '../../types/cv';
import { mediaUrl } from '../../services/api';
import { COLORS } from '../../theme';
import { calcExpYears } from '../../utils/experienceUtils';

// ── Local print-specific constants (not in theme.ts) ────────────────────────
const GOLD_LIGHT = '#F5E9C8';
const TEXT_MID   = '#444444';
const TEXT_SOFT  = '#666666';

// ── Aliases for readability in print layout ───────────────────────────────────
const PRIMARY  = COLORS.primary;
const GOLD     = COLORS.gold;
const TEXT_DARK = COLORS.textDark;
const BG_WHITE  = COLORS.white;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d?: string | null) {
  if (!d) return '';
  // Accepts "YYYY-MM-DD", "MM/YYYY", "YYYY" – just return as-is if not ISO
  if (d.length === 10 && d.includes('-')) {
    const [y, m] = d.split('-');
    const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  }
  return d;
}

function levelLabel(niveau: string) {
  const map: Record<string, string> = {
    BEGINNER:     'Débutant',
    INTERMEDIATE: 'Intermédiaire',
    EXPERT:       'Expert',
  };
  return map[niveau] ?? niveau;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionBanner({ title }: { title: string }) {
  return (
    <div style={{
      background: PRIMARY,
      color: BG_WHITE,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1.5,
      padding: '5px 14px',
      marginBottom: 10,
      marginTop: 18,
      textTransform: 'uppercase',
      borderLeft: `4px solid ${GOLD}`,
    }}>
      {title}
    </div>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text?: string | null }) {
  if (!text) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4, fontSize: 11 }}>
      <span style={{ color: PRIMARY, marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ color: TEXT_MID }}>{text}</span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ color: GOLD, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </span>
      <div style={{ color: TEXT_DARK, fontSize: 11, marginTop: 1 }}>{value}</div>
    </div>
  );
}

// ── Main CVDocument ───────────────────────────────────────────────────────────

export interface CVDocumentProps {
  profile:    CandidateProfileOut;
  experiences: ExperienceOut[];
  skills:     SkillOut[];
  langues:    Array<{ langue: string; niveau?: string }>;
  formations: FormationOut[];
}

const CVDocument = React.forwardRef<HTMLDivElement, CVDocumentProps>(
  ({ profile, experiences, skills, langues, formations }, ref) => {
    const expYears = calcExpYears(experiences);
    const fullName = [profile.prenom, profile.nom].filter(Boolean).join(' ');

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
          background: BG_WHITE,
          fontFamily: '"Segoe UI", Arial, sans-serif',
          color: TEXT_DARK,
          fontSize: 12,
          lineHeight: 1.55,
          boxSizing: 'border-box',
        }}
      >
        {/* ── Header banner ────────────────────────────── */}
        <div style={{
          background: PRIMARY,
          padding: '18px 24px 14px',
          borderBottom: `4px solid ${GOLD}`,
        }}>
          <div style={{ color: BG_WHITE, fontSize: 19, fontWeight: 700, letterSpacing: 0.5 }}>
            {fullName || 'Mon CV'}
          </div>
          {profile.titre_poste && (
            <div style={{ color: GOLD_LIGHT, fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>
              {profile.titre_poste}
            </div>
          )}
        </div>

        {/* ── Identity block ───────────────────────────── */}
        <div style={{
          display: 'flex',
          gap: 0,
          padding: '16px 24px',
          borderBottom: `1px solid #E8D5B0`,
          background: '#FDFAF4',
        }}>
          {/* Photo */}
          <div style={{ flexShrink: 0, marginRight: 20 }}>
            {profile.photo_url ? (
              <img
                src={mediaUrl(profile.photo_url)}
                alt="Photo"
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `3px solid ${GOLD}`,
                }}
              />
            ) : (
              <div style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: `${PRIMARY}20`,
                border: `3px solid ${GOLD}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <UserOutlined style={{ fontSize: 36, color: PRIMARY }} />
              </div>
            )}
          </div>

          {/* Contact info */}
          <div style={{ flex: 1 }}>
            <InfoRow icon={<MailOutlined />}        text={profile.email} />
            <InfoRow icon={<PhoneOutlined />}       text={profile.telephone} />
            <InfoRow icon={<EnvironmentOutlined />} text={[profile.adresse, profile.ville, profile.region].filter(Boolean).join(', ') || null} />
            <InfoRow icon={<CalendarOutlined />}    text={profile.disponibilite ? `Disponible : ${profile.disponibilite}` : null} />
          </div>

          {/* Stats column */}
          <div style={{
            borderLeft: `2px solid ${GOLD}`,
            paddingLeft: 16,
            minWidth: 150,
            flexShrink: 0,
          }}>
            <StatBox label="Étude"      value={profile.niveau_etude} />
            <StatBox label="Expérience" value={expYears > 0 ? `${expYears} an${expYears > 1 ? 's' : ''}` : undefined} />
            <StatBox label="Situation"  value={profile.situation_familiale} />
            <StatBox label="Ville"      value={profile.ville} />
            <StatBox label="Salaire"    value={profile.salaire_actuel} />
            <StatBox label="Nationalité" value={profile.nationalite} />
          </div>
        </div>

        <div style={{ padding: '0 24px 24px' }}>

          {/* ── Expériences ────────────────────────────── */}
          {experiences.length > 0 && (
            <>
              <SectionBanner title="Expériences professionnelles" />
              {experiences.map((exp, i) => (
                <div key={exp.id ?? i} style={{ display: 'flex', gap: 12, marginBottom: 12, pageBreakInside: 'avoid' }}>
                  {/* Date column */}
                  <div style={{ minWidth: 90, flexShrink: 0, textAlign: 'right', color: TEXT_SOFT, fontSize: 10, paddingTop: 1 }}>
                    {exp.is_current
                      ? <>{formatDate(exp.date_debut)}<br /><span style={{ color: PRIMARY, fontWeight: 600 }}>En cours</span></>
                      : <>{formatDate(exp.date_debut)}{exp.date_debut && exp.date_fin ? ' — ' : ''}{formatDate(exp.date_fin)}</>
                    }
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, borderLeft: `2px solid ${GOLD}20`, paddingLeft: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: TEXT_DARK }}>
                      • {exp.poste || 'Poste'}
                      {exp.entreprise && (
                        <span style={{ fontWeight: 400, color: PRIMARY }}> — {exp.entreprise}</span>
                      )}
                    </div>
                    {exp.type_contrat && (
                      <div style={{ fontSize: 10, color: GOLD, fontWeight: 600, marginTop: 1 }}>
                        {exp.type_contrat}{exp.secteur_activite ? ` · ${exp.secteur_activite}` : ''}
                      </div>
                    )}
                    {(exp.description || exp.missions) && (
                      <div style={{ fontSize: 11, color: TEXT_MID, marginTop: 4, whiteSpace: 'pre-line' }}>
                        {exp.description || exp.missions}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── Formations ─────────────────────────────── */}
          {formations.length > 0 && (
            <>
              <SectionBanner title="Diplômes et formations" />
              {formations.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, pageBreakInside: 'avoid' }}>
                  {/* Date column */}
                  <div style={{ minWidth: 90, flexShrink: 0, textAlign: 'right', color: TEXT_SOFT, fontSize: 10, paddingTop: 1 }}>
                    {f.date_fin
                      ? <>{formatDate(f.date_debut)}{f.date_debut ? ' — ' : ''}{formatDate(f.date_fin)}</>
                      : formatDate(f.date_debut)
                    }
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, borderLeft: `2px solid ${GOLD}20`, paddingLeft: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: TEXT_DARK }}>
                      • {f.diplome || 'Diplôme'}
                    </div>
                    {f.etablissement && (
                      <div style={{ fontSize: 11, color: PRIMARY, marginTop: 1 }}>
                        {f.etablissement}{f.pays ? ` · ${f.pays}` : ''}
                      </div>
                    )}
                    {(f.statut || f.mention) && (
                      <div style={{ fontSize: 10, color: GOLD, fontWeight: 600, marginTop: 1 }}>
                        {[f.statut, f.mention].filter(Boolean).join(' — ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── Compétences ────────────────────────────── */}
          {skills.length > 0 && (
            <>
              <SectionBanner title="Compétences" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', paddingLeft: 4 }}>
                {skills.map((s) => (
                  <span key={s.id} style={{ fontSize: 11, color: TEXT_MID }}>
                    <span style={{ color: PRIMARY, marginRight: 4 }}>•</span>
                    <strong>{s.nom_competence}</strong>
                    <span style={{ color: TEXT_SOFT, fontSize: 10 }}> ({levelLabel(s.niveau)})</span>
                  </span>
                ))}
              </div>
            </>
          )}

          {/* ── Langues ────────────────────────────────── */}
          {langues.length > 0 && (
            <>
              <SectionBanner title="Langues" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', paddingLeft: 4 }}>
                {langues.map((l, i) => (
                  <span key={i} style={{ fontSize: 11, color: TEXT_MID }}>
                    <span style={{ color: PRIMARY, marginRight: 4 }}>•</span>
                    <strong>{l.langue}</strong>
                    {l.niveau && (
                      <span style={{ color: TEXT_SOFT, fontSize: 10 }}> ({l.niveau})</span>
                    )}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* ── Mobilité ───────────────────────────────── */}
          {(profile.mobilite_tn || profile.mobilite_intl) && (
            <>
              <SectionBanner title="Mobilité" />
              <div style={{ paddingLeft: 4, fontSize: 11, color: TEXT_MID }}>
                {profile.mobilite_tn && <span><span style={{ color: PRIMARY, marginRight: 4 }}>•</span>Mobilité nationale (Tunisie)</span>}
                {profile.mobilite_tn && profile.mobilite_intl && <span style={{ margin: '0 10px' }}>|</span>}
                {profile.mobilite_intl && <span><span style={{ color: PRIMARY, marginRight: 4 }}>•</span>Mobilité internationale</span>}
              </div>
            </>
          )}

        </div>

        {/* Print-only CSS */}
        <style>{`
          @media print {
            @page { size: A4; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>
      </div>
    );
  }
);

CVDocument.displayName = 'CVDocument';
export default CVDocument;

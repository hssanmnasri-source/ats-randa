import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Tag,
} from 'antd';
import {
  EditOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusCircleOutlined,
  EyeOutlined,
  BankOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../theme';
import type { FullProfileOut, ExperienceOut } from '../../types/cv';
import AvatarUpload from './AvatarUpload';

const { Text } = Typography;

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcExpYears(experiences: ExperienceOut[]): number {
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

function AddLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{ color: COLORS.gold, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      <PlusCircleOutlined style={{ fontSize: 11 }} />
      {label}
    </span>
  );
}

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Text
        type="secondary"
        style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.9, display: 'block', marginBottom: 3 }}
      >
        {label}
      </Text>
      {children}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  data: FullProfileOut;
}

export default function ProfileSummaryCard({ data }: Props) {
  const navigate  = useNavigate();
  const { profile, experiences } = data;
  const expYears  = calcExpYears(experiences);
  const lastExp   = experiences[0] ?? null;
  const fullName  = [profile.prenom, profile.nom].filter(Boolean).join(' ');
  const location  = [profile.ville, profile.region].filter(Boolean).join(', ');

  const goProfile = () => navigate('/candidate/profile');

  return (
    <Card
      styles={{ body: { padding: 0 } }}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(139,26,26,0.10)',
        border: `1px solid ${COLORS.grayBorder}`,
        marginBottom: 24,
      }}
    >
      {/* ── Header banner ────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, #6B1414 100%)`,
        padding: '18px 24px 14px',
        borderBottom: `3px solid ${COLORS.gold}`,
      }}>
        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700, display: 'block' }}>
          {fullName || 'Mon Profil Candidat'}
        </Text>
        {profile.titre_poste && (
          <Text style={{ color: '#F5E9C8', fontSize: 13, fontStyle: 'italic' }}>
            {profile.titre_poste}
          </Text>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────── */}
      <div style={{ padding: '20px 24px' }}>
        <Row gutter={24} align="top" wrap={false}>

          {/* Avatar with upload */}
          <Col flex="none">
            <AvatarUpload photoUrl={profile.photo_url} size={88} />
          </Col>

          {/* Info grid */}
          <Col flex="1" style={{ minWidth: 0 }}>
            <Row gutter={[20, 14]}>

              {/* Col 1 – Titre + Dernier emploi */}
              <Col xs={24} sm={8}>
                <InfoItem label="Titre du profil">
                  {profile.titre_poste
                    ? <Text strong style={{ fontSize: 13 }}>{profile.titre_poste}</Text>
                    : <AddLink label="Ajouter un titre" onClick={goProfile} />
                  }
                </InfoItem>

                <div style={{ marginTop: 10 }}>
                  <InfoItem label="Dernier emploi">
                    {lastExp ? (
                      <div>
                        <Text style={{ fontSize: 12, fontWeight: 600, display: 'block' }}>{lastExp.poste ?? '—'}</Text>
                        {lastExp.entreprise && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            <BankOutlined style={{ marginRight: 4 }} />
                            {lastExp.entreprise}
                          </Text>
                        )}
                      </div>
                    ) : (
                      <AddLink label="Ajouter une expérience" onClick={goProfile} />
                    )}
                  </InfoItem>
                </div>
              </Col>

              {/* Col 2 – Étude + Expérience */}
              <Col xs={24} sm={8}>
                <InfoItem label="Niveau d'étude">
                  {profile.niveau_etude
                    ? (
                      <Tag
                        style={{
                          background: `${COLORS.primary}15`,
                          border: `1px solid ${COLORS.primary}40`,
                          color: COLORS.primary,
                          fontWeight: 600,
                          marginTop: 2,
                        }}
                      >
                        {profile.niveau_etude}
                      </Tag>
                    )
                    : <AddLink label="Ajouter" onClick={goProfile} />
                  }
                </InfoItem>

                <div style={{ marginTop: 10 }}>
                  <InfoItem label="Expérience">
                    {expYears > 0 ? (
                      <Space size={4}>
                        <ClockCircleOutlined style={{ color: COLORS.primary, fontSize: 13 }} />
                        <Text strong style={{ color: COLORS.primary, fontSize: 13 }}>
                          {expYears} an{expYears > 1 ? 's' : ''}
                        </Text>
                      </Space>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 12 }}>Non renseignée</Text>
                    )}
                  </InfoItem>
                </div>
              </Col>

              {/* Col 3 – Statut + Disponibilité */}
              <Col xs={24} sm={8}>
                <InfoItem label="Statut professionnel">
                  {profile.statut_pro
                    ? (
                      <Tag
                        color="success"
                        style={{ marginTop: 2, fontWeight: 600 }}
                      >
                        {profile.statut_pro}
                      </Tag>
                    )
                    : <AddLink label="Ajouter" onClick={goProfile} />
                  }
                </InfoItem>

                <div style={{ marginTop: 10 }}>
                  <InfoItem label="Disponibilité">
                    {profile.disponibilite
                      ? <Text style={{ fontSize: 12 }}>{profile.disponibilite}</Text>
                      : <Text type="secondary" style={{ fontSize: 12 }}>Non renseignée</Text>
                    }
                  </InfoItem>
                </div>
              </Col>

            </Row>
          </Col>
        </Row>

        {/* ── Contact bar ──────────────────────────────── */}
        <div style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: `1px solid ${COLORS.grayBorder}`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px 28px',
          alignItems: 'center',
        }}>
          {location && (
            <Space size={5}>
              <EnvironmentOutlined style={{ color: COLORS.primary, fontSize: 13 }} />
              <Text style={{ fontSize: 12 }}>{location}</Text>
            </Space>
          )}
          {profile.email && (
            <Space size={5}>
              <MailOutlined style={{ color: COLORS.primary, fontSize: 13 }} />
              <Text style={{ fontSize: 12 }}>{profile.email}</Text>
            </Space>
          )}
          {profile.telephone && (
            <Space size={5}>
              <PhoneOutlined style={{ color: COLORS.primary, fontSize: 13 }} />
              <Text style={{ fontSize: 12 }}>{profile.telephone}</Text>
            </Space>
          )}
          {!location && !profile.telephone && (
            <AddLink label="Ajouter vos coordonnées" onClick={goProfile} />
          )}
        </div>

        {/* ── Actions ──────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <Button
            icon={<EditOutlined />}
            onClick={goProfile}
            style={{ borderColor: COLORS.primary, color: COLORS.primary }}
          >
            Modifier mon profil CV
          </Button>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => navigate('/candidate/cv-generator')}
            style={{ background: COLORS.primary, borderColor: COLORS.primary }}
          >
            Voir mon CV généré
          </Button>
        </div>
      </div>
    </Card>
  );
}

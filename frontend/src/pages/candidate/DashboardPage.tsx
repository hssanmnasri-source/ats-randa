import { Row, Col, Card, Tag, Typography, Button, Empty, Skeleton, Progress, Space, Divider } from 'antd';
import {
  FileTextOutlined,
  SendOutlined,
  CheckCircleOutlined,
  FilePdfOutlined,
  RightOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMyCVs } from '../../hooks/useCVs';
import { usePublicOffers } from '../../hooks/useOffers';
import { useFullProfile } from '../../hooks/useCandidate';
import ProfileSummaryCard from '../../components/candidate/ProfileSummaryCard';
import { COLORS } from '../../theme';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

dayjs.extend(relativeTime);
dayjs.locale('fr');

const { Text, Title } = Typography;

// ── CV status helpers ─────────────────────────────────────────────────────────

const CV_STATUS: Record<string, { label: string; color: string }> = {
  INDEXED:  { label: 'Indexé',           color: 'success'    },
  PARSING:  { label: "En cours d'analyse", color: 'processing' },
  UPLOADED: { label: 'Reçu',             color: 'processing' },
  ERROR:    { label: 'Erreur',           color: 'error'      },
};

// ── Profile completion section breakdown ──────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  personal:     'Informations personnelles',
  professional: 'Identité professionnelle',
  experiences:  'Expériences',
  degrees:      'Diplômes & Formations',
  skills:       'Compétences',
  languages:    'Langues',
  photo:        'Photo de profil',
  extras:       'Infos complémentaires',
};

function completionColor(pct: number) {
  if (pct >= 80) return COLORS.success;
  if (pct >= 50) return COLORS.gold;
  return COLORS.error;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CandidateDashboard() {
  const navigate = useNavigate();

  const { data: profile,  isLoading: loadingProfile } = useFullProfile();
  const { data: cvList,   isLoading: loadingCv      } = useMyCVs();
  const { data: offersData, isLoading: loadingOffers } = usePublicOffers({ limit: 5 });

  const myCv      = cvList?.cvs?.[0] ?? null;
  const cvStatus  = myCv ? (CV_STATUS[myCv.statut] ?? { label: myCv.statut, color: 'default' }) : null;
  const completion = profile?.completion;
  const pct        = completion?.total ?? 0;

  return (
    <div>

      {/* ── Profile summary card ───────────────────── */}
      {loadingProfile ? (
        <Card style={{ marginBottom: 24, borderRadius: 12 }}>
          <Skeleton active avatar paragraph={{ rows: 4 }} />
        </Card>
      ) : profile ? (
        <ProfileSummaryCard data={profile} />
      ) : null}

      {/* ── Quick stats + lower cards ──────────────── */}
      <Row gutter={[20, 20]}>

        {/* Profile completion */}
        <Col xs={24} md={8}>
          <Card
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { padding: '18px 20px' } }}
          >
            <Space align="center" style={{ marginBottom: 14 }}>
              <TrophyOutlined style={{ color: COLORS.gold, fontSize: 18 }} />
              <Title level={5} style={{ margin: 0 }}>Complétude du profil</Title>
            </Space>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Progress
                type="circle"
                percent={pct}
                size={90}
                strokeColor={completionColor(pct)}
                format={(p) => (
                  <span style={{ fontWeight: 700, color: completionColor(pct ?? 0), fontSize: 18 }}>
                    {p}%
                  </span>
                )}
              />
            </div>

            {completion && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(completion.sections).map(([key, sec]) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{ fontSize: 11, color: COLORS.textMedium }}>
                        {SECTION_LABELS[key] ?? sec.label}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: 600, color: sec.filled ? COLORS.success : COLORS.textMedium }}>
                        {sec.filled ? <CheckCircleOutlined /> : `${sec.score}/${sec.weight}`}
                      </Text>
                    </div>
                    <Progress
                      percent={sec.weight > 0 ? Math.round((sec.score / sec.weight) * 100) : 0}
                      showInfo={false}
                      size="small"
                      strokeColor={sec.filled ? COLORS.success : COLORS.gold}
                      railColor="#F0F0F0"
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              block
              onClick={() => navigate('/candidate/profile')}
              style={{ marginTop: 14, borderColor: COLORS.primary, color: COLORS.primary }}
              icon={<RightOutlined />}
            >
              Compléter mon profil
            </Button>
          </Card>
        </Col>

        {/* Mon CV */}
        <Col xs={24} md={8}>
          <Card
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { padding: '18px 20px' } }}
            loading={loadingCv}
          >
            <Space align="center" style={{ marginBottom: 14 }}>
              <FileTextOutlined style={{ color: COLORS.primary, fontSize: 18 }} />
              <Title level={5} style={{ margin: 0 }}>Mon CV</Title>
            </Space>

            {myCv ? (
              <div>
                <Tag color={cvStatus?.color} style={{ fontWeight: 600, marginBottom: 10 }}>
                  {cvStatus?.label}
                </Tag>
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
                  Déposé le {dayjs(myCv.date_depot).format('DD/MM/YYYY')}
                </Text>
                {myCv.score_final > 0 && (
                  <Text style={{ fontSize: 12 }}>
                    Score global : <strong style={{ color: COLORS.primary }}>{Math.round(myCv.score_final * 100)}%</strong>
                  </Text>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                  <Button
                    block
                    type="primary"
                    icon={<FilePdfOutlined />}
                    onClick={() => navigate('/candidate/cv-generator')}
                    style={{ background: COLORS.primary, borderColor: COLORS.primary }}
                  >
                    Générer mon CV PDF
                  </Button>
                  <Button
                    block
                    onClick={() => navigate('/candidate/cv')}
                    style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                  >
                    Gérer mon CV
                  </Button>
                </div>
              </div>
            ) : (
              <Empty description="Aucun CV déposé" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button
                  type="primary"
                  onClick={() => navigate('/candidate/cv')}
                  style={{ background: COLORS.primary, borderColor: COLORS.primary }}
                >
                  Créer mon CV
                </Button>
              </Empty>
            )}
          </Card>
        </Col>

        {/* Offres récentes */}
        <Col xs={24} md={8}>
          <Card
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { padding: '18px 20px' } }}
            loading={loadingOffers}
          >
            <Space align="center" style={{ marginBottom: 14 }}>
              <SendOutlined style={{ color: COLORS.primary, fontSize: 18 }} />
              <Title level={5} style={{ margin: 0 }}>Offres récentes</Title>
            </Space>

            {offersData?.offers?.length ? (
              <>
                <div>
                  {offersData.offers.map((offer, i) => (
                    <div key={offer.id}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', padding: '6px 0', cursor: 'pointer' }}
                        onClick={() => navigate(`/offers/${offer.id}`)}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            strong
                            style={{ fontSize: 12, color: COLORS.primary, display: 'block' }}
                            ellipsis
                          >
                            {offer.titre}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {dayjs(offer.date_publication).fromNow()}
                          </Text>
                        </div>
                        <RightOutlined style={{ color: COLORS.grayBorder, fontSize: 11, marginLeft: 8 }} />
                      </div>
                      {i < offersData.offers.length - 1 && <Divider style={{ margin: '0' }} />}
                    </div>
                  ))}
                </div>
                <Button
                  block
                  onClick={() => navigate('/')}
                  style={{ marginTop: 10, borderColor: COLORS.primary, color: COLORS.primary }}
                  icon={<RightOutlined />}
                >
                  Toutes les offres
                </Button>
              </>
            ) : (
              <Empty description="Aucune offre disponible" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

      </Row>
    </div>
  );
}

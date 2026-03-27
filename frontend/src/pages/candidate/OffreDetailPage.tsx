import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Button, Card, Col, Divider, Row,
  Space, Spin, Tag, Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  SolutionOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SendOutlined,
  TeamOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { usePublicOfferDetail, useApplyToOffer } from '../../hooks/usePublicOffers';
import type { PublicOffer } from '../../types/offer';
import { COLORS } from '../../theme';
import { useNotificationStore } from '../../store/notificationStore';

const { Title, Text, Paragraph } = Typography;

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function SimilarOfferCard({ offer, onClick }: { offer: PublicOffer; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px',
        border: `1px solid ${COLORS.grayBorder}`,
        borderRadius: 8,
        cursor: 'pointer',
        marginBottom: 8,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = COLORS.primary)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = COLORS.grayBorder)}
    >
      <Text strong style={{ fontSize: 13, color: COLORS.primary, display: 'block' }}>{offer.titre}</Text>
      <Text style={{ fontSize: 11, color: COLORS.textMedium }}>
        {offer.experience_requise > 0 ? `${offer.experience_requise} an(s)` : 'Débutant'}
        {offer.ville && ` · ${offer.ville}`}
      </Text>
    </div>
  );
}

export default function OffreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notifySuccess = useNotificationStore((s) => s.success);
  const notifyError   = useNotificationStore((s) => s.error);
  const offerId = Number(id);

  const { data: offer, isLoading, isError } = usePublicOfferDetail(offerId);
  const { mutate: apply, isPending: isApplying } = useApplyToOffer();

  const handleApply = () => {
    apply(offerId, {
      onSuccess: () => notifySuccess('Candidature envoyée avec succès !'),
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { detail?: string } } })
          ?.response?.data?.detail ?? 'Erreur lors de la candidature.';
        notifyError(msg);
      },
    });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !offer) {
    return (
      <Alert
        type="error"
        message="Offre introuvable ou inactive."
        action={<Button size="small" onClick={() => navigate('/candidate/offres')}>Retour aux offres</Button>}
      />
    );
  }

  const days = daysSince(offer.date_publication);
  const dateLabel = days === 0 ? "Aujourd'hui" : days === 1 ? 'Hier' : `Il y a ${days} jour(s)`;
  const scoreColor =
    offer.mon_score_matching === null ? COLORS.textMedium
    : offer.mon_score_matching >= 0.7 ? COLORS.success
    : offer.mon_score_matching >= 0.4 ? COLORS.warning
    : COLORS.error;

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        type="text"
        onClick={() => navigate('/candidate/offres')}
        style={{ marginBottom: 16, color: COLORS.primary }}
      >
        Retour aux offres
      </Button>

      <Row gutter={20} align="top">
        {/* ── Main content ─────────────────────────── */}
        <Col xs={24} lg={16}>
          <Card style={{ borderColor: COLORS.grayBorder, marginBottom: 16 }}>
            {/* Header */}
            <Space size={6} wrap style={{ marginBottom: 8 }}>
              {offer.is_new && <Tag color="orange">NOUVEAU</Tag>}
              <Tag color="default" style={{ textTransform: 'capitalize' }}>
                {offer.plateforme_source}
              </Tag>
            </Space>
            <Title level={3} style={{ color: COLORS.primary, marginBottom: 12 }}>
              {offer.titre}
            </Title>
            <Space size={16} wrap style={{ marginBottom: 16 }}>
              {offer.ville && (
                <Text style={{ color: COLORS.textMedium }}>
                  <EnvironmentOutlined style={{ marginRight: 4 }} />{offer.ville}
                </Text>
              )}
              <Text style={{ color: COLORS.textMedium }}>
                <SolutionOutlined style={{ marginRight: 4 }} />
                {offer.experience_requise > 0 ? `${offer.experience_requise} an(s) d'expérience` : 'Débutant accepté'}
              </Text>
              <Text style={{ color: COLORS.textMedium }}>
                <TranslationOutlined style={{ marginRight: 4 }} />
                {offer.langue_requise === 'fr' ? 'Français' : offer.langue_requise === 'en' ? 'Anglais' : offer.langue_requise}
              </Text>
              <Text style={{ color: COLORS.textMedium }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />{dateLabel}
              </Text>
              <Text style={{ color: COLORS.textMedium }}>
                <TeamOutlined style={{ marginRight: 4 }} />{offer.nb_candidatures} candidat(s)
              </Text>
            </Space>

            <Divider style={{ margin: '12px 0' }} />

            {/* Description */}
            <Title level={5} style={{ color: COLORS.textDark }}>Description du poste</Title>
            <Paragraph style={{ whiteSpace: 'pre-wrap', color: COLORS.textMedium }}>
              {offer.description}
            </Paragraph>

            {/* Competences */}
            {offer.competences_requises.length > 0 && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <Title level={5} style={{ color: COLORS.textDark }}>Compétences requises</Title>
                <Space size={[8, 8]} wrap>
                  {offer.competences_requises.map((c) => (
                    <Tag key={c} color="geekblue">{c}</Tag>
                  ))}
                </Space>
              </>
            )}
          </Card>
        </Col>

        {/* ── Right sidebar ────────────────────────── */}
        <Col xs={24} lg={8}>
          {/* Apply card */}
          <Card
            style={{ borderColor: COLORS.primary, marginBottom: 16, borderWidth: 2 }}
            styles={{ body: { padding: '20px' } }}
          >
            {offer.mon_score_matching !== null ? (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: COLORS.textMedium, display: 'block', marginBottom: 4 }}>
                  Votre correspondance
                </Text>
                <Title level={2} style={{ color: scoreColor, margin: 0 }}>
                  {Math.round(offer.mon_score_matching * 100)}%
                </Title>
                <Text style={{ fontSize: 11, color: COLORS.textMedium }}>
                  {offer.mon_score_matching >= 0.7
                    ? 'Excellent profil !'
                    : offer.mon_score_matching >= 0.4
                    ? 'Profil compatible'
                    : 'Profil partiel'}
                </Text>
              </div>
            ) : (
              <Text style={{ fontSize: 12, color: COLORS.textMedium, display: 'block', marginBottom: 12, textAlign: 'center' }}>
                Complétez votre CV pour voir votre score de correspondance.
              </Text>
            )}
            <Button
              type="primary"
              icon={<SendOutlined />}
              block
              size="large"
              loading={isApplying}
              onClick={handleApply}
              style={{ background: COLORS.primary, borderColor: COLORS.primary }}
            >
              Postuler à cette offre
            </Button>
          </Card>

          {/* Similar offers */}
          {offer.offres_similaires.length > 0 && (
            <Card
              size="small"
              title={<Text strong style={{ color: COLORS.primary }}>Offres similaires</Text>}
              style={{ borderColor: COLORS.grayBorder }}
            >
              {offer.offres_similaires.map((o) => (
                <SimilarOfferCard
                  key={o.id}
                  offer={o}
                  onClick={() => navigate(`/candidate/offres/${o.id}`)}
                />
              ))}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}

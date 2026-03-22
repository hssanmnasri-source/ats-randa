import { Tag, Button, Card, Typography, Space, Divider, Spin, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GlobalOutlined,
  TeamOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { usePublicOffer } from '../../hooks/useOffers';
import { useAuthStore } from '../../store/authStore';
import { candidateService } from '../../services/candidateService';
import dayjs from 'dayjs';

export default function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { data: offer, isLoading } = usePublicOffer(Number(id));

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'CANDIDATE') {
      message.warning('Seuls les candidats peuvent postuler.');
      return;
    }
    try {
      await candidateService.applyToOffer(Number(id));
      message.success('Candidature envoyée avec succès !');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      if (detail && typeof detail === 'object' && (detail as Record<string, string>).error === 'cv_required') {
        message.error('Vous devez créer votre CV avant de postuler.');
        navigate('/candidate/cv');
      } else if (typeof detail === 'string' && detail.includes('déjà postulé')) {
        message.warning('Vous avez déjà postulé à cette offre.');
      } else {
        message.error('Erreur lors de la candidature.');
      }
    }
  };

  if (isLoading)
    return (
      <Spin
        style={{ display: 'block', textAlign: 'center', padding: 60 }}
      />
    );
  if (!offer) return null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ paddingLeft: 0, marginBottom: 16 }}
      >
        Retour aux offres
      </Button>

      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {offer.titre}
            </Typography.Title>
            <Space style={{ marginTop: 8, color: '#888', fontSize: 13 }}>
              {offer.experience_requise > 0 && (
                <span>
                  <TeamOutlined /> {offer.experience_requise} ans d'expérience
                </span>
              )}
              {offer.langue_requise && (
                <span>
                  <GlobalOutlined /> {offer.langue_requise}
                </span>
              )}
              <span>
                <CalendarOutlined /> Publiée le{' '}
                {dayjs(offer.date_publication).format('DD/MM/YYYY')}
              </span>
            </Space>
          </div>
          <Button type="primary" size="large" onClick={handleApply}>
            {isAuthenticated ? 'Postuler' : 'Se connecter pour postuler'}
          </Button>
        </div>

        <Divider />

        <Typography.Title level={5}>Description du poste</Typography.Title>
        <Typography.Paragraph style={{ whiteSpace: 'pre-line' }}>
          {offer.description}
        </Typography.Paragraph>

        <Divider />

        <Typography.Title level={5}>Compétences requises</Typography.Title>
        <Space wrap>
          {offer.competences_requises.map((c) => (
            <Tag key={c} color="blue">
              {c}
            </Tag>
          ))}
        </Space>
      </Card>
    </div>
  );
}

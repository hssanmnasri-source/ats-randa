import { useState } from 'react';
import {
  Row,
  Col,
  Input,
  Select,
  Space,
  Typography,
  Pagination,
  Empty,
  Spin,
  message,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePublicOffers } from '../../hooks/useOffers';
import { useAuthStore } from '../../store/authStore';
import OfferCard from '../../components/offer/OfferCard';
import { candidateService } from '../../services/candidateService';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [langue, setLangue] = useState<string | undefined>();

  const { data, isLoading } = usePublicOffers({
    search: search || undefined,
    page,
    limit: 9,
  });

  const handleApply = async (offerId: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'CANDIDATE') {
      message.warning('Seuls les candidats peuvent postuler.');
      return;
    }
    try {
      await candidateService.applyToOffer(offerId);
      message.success('Candidature envoyée !');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      if (detail && typeof detail === 'object' && (detail as Record<string, string>).error === 'cv_required') {
        message.error('Créez votre CV avant de postuler.');
        navigate('/candidate/cv');
      } else if (typeof detail === 'string' && detail.includes('déjà postulé')) {
        message.warning('Vous avez déjà postulé à cette offre.');
      } else {
        message.error('Erreur lors de la candidature.');
      }
    }
  };

  const allOffers = data?.offers ?? [];
  const filtered = langue
    ? allOffers.filter((o) => o.langue_requise === langue)
    : allOffers;

  return (
    <div>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(160deg, #3D0C02 0%, #8B1A1A 50%, #C9A84C 100%)',
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        marginBottom: 40,
        borderRadius: 16,
      }}>
        <img src="/logo-randa.png" alt="ATS RANDA" style={{ height: 80, objectFit: 'contain', marginBottom: 16 }} />
        <Typography.Title level={2} style={{ color: '#F0D080', margin: 0, textAlign: 'center' }}>
          Offres d'emploi RANDA
        </Typography.Title>
        <Typography.Text style={{ color: '#C9A84C', marginTop: 8, marginBottom: 24, textAlign: 'center' }}>
          Découvrez les opportunités et postulez en quelques clics
        </Typography.Text>
        <Space wrap style={{ justifyContent: 'center' }}>
          <Input
            placeholder="Rechercher un poste..."
            prefix={<SearchOutlined style={{ color: '#8B1A1A' }} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 320, borderRadius: 8 }}
            allowClear
          />
          <Select
            placeholder="Langue"
            allowClear
            style={{ width: 160 }}
            onChange={(v) => { setLangue(v); setPage(1); }}
            options={['ar', 'fr', 'en', 'fr/en'].map((l) => ({ label: l, value: l }))}
          />
        </Space>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          description="Aucune offre disponible pour le moment."
          style={{ padding: 60 }}
        />
      ) : (
        <>
          <Row gutter={[24, 0]}>
            {filtered.map((offer) => (
              <Col key={offer.id} xs={24} md={12} lg={8}>
                <OfferCard offer={offer} showApply onApply={handleApply} />
              </Col>
            ))}
          </Row>

          {(data?.total ?? 0) > 9 && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Pagination
                current={page}
                total={data?.total ?? 0}
                pageSize={9}
                onChange={setPage}
                showTotal={(t) => `${t} offres`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

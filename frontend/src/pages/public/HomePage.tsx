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
    } catch {
      message.error('Erreur lors de la candidature.');
    }
  };

  const allOffers = data?.offers ?? [];
  const filtered = langue
    ? allOffers.filter((o) => o.langue_requise === langue)
    : allOffers;

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '40px 0 32px' }}>
        <Typography.Title level={2}>Offres d'emploi</Typography.Title>
        <Typography.Text type="secondary">
          Découvrez les opportunités chez RANDA
        </Typography.Text>
      </div>

      <Space
        wrap
        style={{ marginBottom: 24, justifyContent: 'center', width: '100%' }}
      >
        <Input
          placeholder="Rechercher un poste..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 320 }}
          allowClear
        />
        <Select
          placeholder="Langue"
          allowClear
          style={{ width: 160 }}
          onChange={(v) => {
            setLangue(v);
            setPage(1);
          }}
          options={['ar', 'fr', 'en', 'fr/en'].map((l) => ({
            label: l,
            value: l,
          }))}
        />
      </Space>

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

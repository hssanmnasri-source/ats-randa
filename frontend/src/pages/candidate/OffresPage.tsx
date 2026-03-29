import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Card, Col, Empty, Input, Pagination,
  Row, Select, Slider, Space, Spin, Tag, Tooltip, Typography,
} from 'antd';
import {
  SolutionOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  HeartFilled,
  SearchOutlined,
  TeamOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { usePublicOffers } from '../../hooks/usePublicOffers';
import { useFavorites } from '../../hooks/useFavorites';
import type { OffersFilters, PublicOffer } from '../../types/offer';
import { COLORS } from '../../theme';

const { Title, Text, Paragraph } = Typography;

const LANGUE_OPTIONS = [
  { label: 'Toutes langues', value: '' },
  { label: 'Français',       value: 'fr' },
  { label: 'Anglais',        value: 'en' },
  { label: 'Arabe',          value: 'ar' },
];

const EXP_MARKS: Record<number, string> = {
  0: '0',
  2: '2 ans',
  5: '5 ans',
  10: '10+',
};

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function OfferCard({
  offer,
  onClick,
  isFav,
  onToggleFav,
}: {
  offer: PublicOffer;
  onClick: () => void;
  isFav: boolean;
  onToggleFav: (e: React.MouseEvent) => void;
}) {
  const days = daysSince(offer.date_publication);
  const dateLabel = days === 0 ? "Aujourd'hui" : days === 1 ? 'Hier' : `Il y a ${days} j`;

  return (
    <Card
      hoverable
      onClick={onClick}
      style={{ marginBottom: 12, borderColor: COLORS.grayBorder, cursor: 'pointer' }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <Row justify="space-between" align="top" wrap={false} style={{ gap: 8 }}>
        <Col flex="1" style={{ minWidth: 0 }}>
          <Space size={6} style={{ flexWrap: 'wrap', marginBottom: 4 }}>
            {offer.is_new && <Tag color="orange" style={{ margin: 0 }}>NOUVEAU</Tag>}
            <Tag color="default" style={{ margin: 0, textTransform: 'capitalize' }}>
              {offer.plateforme_source}
            </Tag>
          </Space>
          <Title
            level={5}
            style={{ margin: '4px 0 6px', color: COLORS.primary }}
            ellipsis={{ rows: 1 }}
          >
            {offer.titre}
          </Title>
          <Paragraph
            ellipsis={{ rows: 2 }}
            style={{ color: COLORS.textMedium, marginBottom: 10, fontSize: 13 }}
          >
            {offer.description}
          </Paragraph>
          <Space size={[6, 6]} wrap>
            {offer.competences_requises.slice(0, 4).map((c) => (
              <Tag key={c} color="geekblue" style={{ fontSize: 11 }}>{c}</Tag>
            ))}
            {offer.competences_requises.length > 4 && (
              <Tag style={{ fontSize: 11 }}>+{offer.competences_requises.length - 4}</Tag>
            )}
          </Space>
        </Col>
        <Col flex="none" style={{ textAlign: 'right', minWidth: 120 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
            <Tooltip title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
              <Button
                type="text"
                size="small"
                icon={
                  isFav
                    ? <HeartFilled style={{ color: COLORS.primary, fontSize: 16 }} />
                    : <HeartOutlined style={{ color: COLORS.textMedium, fontSize: 16 }} />
                }
                onClick={onToggleFav}
                style={{ padding: '0 4px' }}
              />
            </Tooltip>
          </div>
          <Text style={{ fontSize: 12, color: COLORS.textMedium, display: 'block', marginBottom: 4 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />{dateLabel}
          </Text>
          {offer.ville && (
            <Text style={{ fontSize: 12, color: COLORS.textMedium, display: 'block', marginBottom: 4 }}>
              <EnvironmentOutlined style={{ marginRight: 4 }} />{offer.ville}
            </Text>
          )}
          <Text style={{ fontSize: 12, color: COLORS.textMedium, display: 'block', marginBottom: 4 }}>
            <SolutionOutlined style={{ marginRight: 4 }} />
            {offer.experience_requise > 0 ? `${offer.experience_requise} an(s)` : 'Débutant accepté'}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.textMedium, display: 'block' }}>
            <TeamOutlined style={{ marginRight: 4 }} />{offer.nb_candidatures} candidat(s)
          </Text>
        </Col>
      </Row>
    </Card>
  );
}

export default function OffresPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<OffersFilters>({ page: 1, limit: 15 });
  const [search, setSearch]   = useState('');
  const [expMin, setExpMin]   = useState<number>(0);

  const { data, isLoading } = usePublicOffers(filters);
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleSearch = () => {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));
  };

  const handleExpChange = (val: number) => {
    setExpMin(val);
    setFilters((f) => ({ ...f, experience_min: val > 0 ? val : undefined, page: 1 }));
  };

  const handleLangue = (val: string) => {
    setFilters((f) => ({ ...f, langue: val || undefined, page: 1 }));
  };

  const handleReset = () => {
    setSearch('');
    setExpMin(0);
    setFilters({ page: 1, limit: 15 });
  };

  return (
    <Row gutter={20} align="top">
      {/* ── Sidebar filtres ──────────────────────── */}
      <Col xs={24} md={6}>
        <Card
          size="small"
          title={<Text strong style={{ color: COLORS.primary }}>Filtres</Text>}
          style={{ borderColor: COLORS.grayBorder, position: 'sticky', top: 16 }}
        >
          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 12, color: COLORS.textMedium, display: 'block', marginBottom: 6 }}>
              <TranslationOutlined style={{ marginRight: 4 }} />Langue
            </Text>
            <Select
              options={LANGUE_OPTIONS}
              value={filters.langue || ''}
              onChange={handleLangue}
              style={{ width: '100%' }}
              size="small"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 12, color: COLORS.textMedium, display: 'block', marginBottom: 6 }}>
              <SolutionOutlined style={{ marginRight: 4 }} />
              Expérience min. : {expMin > 0 ? `${expMin} an(s)` : 'Toutes'}
            </Text>
            <Slider
              min={0}
              max={10}
              step={1}
              value={expMin}
              marks={EXP_MARKS}
              onChange={handleExpChange}
              tooltip={{ formatter: (v) => `${v} an(s)` }}
              styles={{ track: { background: COLORS.primary } }}
            />
          </div>

          <Button block size="small" onClick={handleReset} style={{ marginTop: 8 }}>
            Réinitialiser
          </Button>
        </Card>
      </Col>

      {/* ── Liste offres ─────────────────────────── */}
      <Col xs={24} md={18}>
        {/* Search bar */}
        <Input.Search
          placeholder="Rechercher un poste, une compétence..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={handleSearch}
          onPressEnter={handleSearch}
          enterButton={<SearchOutlined />}
          style={{ marginBottom: 16 }}
          allowClear
          onClear={() => setFilters((f) => ({ ...f, search: undefined, page: 1 }))}
        />

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : !data || data.offers.length === 0 ? (
          <Empty description="Aucune offre ne correspond à vos critères." />
        ) : (
          <>
            <Text style={{ color: COLORS.textMedium, display: 'block', marginBottom: 12 }}>
              <strong style={{ color: COLORS.textDark }}>{data.total}</strong> offre(s) trouvée(s)
            </Text>
            {data.offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onClick={() => navigate(`/candidate/offres/${offer.id}`)}
                isFav={isFavorite(offer.id)}
                onToggleFav={(e) => { e.stopPropagation(); toggleFavorite(offer); }}
              />
            ))}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Pagination
                current={filters.page ?? 1}
                pageSize={filters.limit ?? 15}
                total={data.total}
                onChange={(page) => setFilters((f) => ({ ...f, page }))}
                showSizeChanger={false}
                showTotal={(total, range) => `${range[0]}-${range[1]} sur ${total}`}
              />
            </div>
          </>
        )}
      </Col>
    </Row>
  );
}

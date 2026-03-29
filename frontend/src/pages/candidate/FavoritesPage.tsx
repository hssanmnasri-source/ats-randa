import { useNavigate } from 'react-router-dom';
import {
  Button, Card, Col, Empty, Row, Space, Tag, Tooltip, Typography,
} from 'antd';
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  HeartFilled,
  SolutionOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useFavorites } from '../../hooks/useFavorites';
import type { PublicOffer } from '../../types/offer';
import { COLORS } from '../../theme';

const { Title, Text, Paragraph } = Typography;

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function FavoriteCard({
  offer,
  onClick,
  onRemove,
}: {
  offer: PublicOffer;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
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
            <Tooltip title="Retirer des favoris">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined style={{ fontSize: 15 }} />}
                onClick={onRemove}
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

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();

  return (
    <div>
      <Title level={4} style={{ marginBottom: 4 }}>
        <HeartFilled style={{ color: COLORS.primary, marginRight: 8 }} />
        Offres favorites
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {favorites.length > 0
          ? `${favorites.length} offre(s) sauvegardée(s)`
          : 'Sauvegardez les offres qui vous intéressent pour y revenir plus tard.'}
      </Text>

      {favorites.length === 0 ? (
        <Empty
          image={<HeartFilled style={{ fontSize: 48, color: COLORS.gold }} />}
          description="Aucune offre sauvegardée pour l'instant"
          style={{ padding: 48 }}
        >
          <Button
            type="primary"
            style={{ background: COLORS.primary, borderColor: COLORS.primary }}
            onClick={() => navigate('/candidate/offres')}
          >
            Parcourir les offres
          </Button>
        </Empty>
      ) : (
        favorites.map((offer: PublicOffer) => (
          <FavoriteCard
            key={offer.id}
            offer={offer}
            onClick={() => navigate(`/candidate/offres/${offer.id}`)}
            onRemove={(e) => { e.stopPropagation(); removeFavorite(offer.id); }}
          />
        ))
      )}
    </div>
  );
}

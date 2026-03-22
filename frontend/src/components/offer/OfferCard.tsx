import { Card, Tag, Space, Typography, Button } from 'antd';
import { ClockCircleOutlined, TeamOutlined, GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { JobOffer } from '../../types/offer';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

dayjs.extend(relativeTime);
dayjs.locale('fr');

interface Props {
  offer: JobOffer;
  showApply?: boolean;
  onApply?: (id: number) => void;
}

export default function OfferCard({ offer, showApply = true, onApply }: Props) {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      onClick={() => navigate(`/offers/${offer.id}`)}
      style={{
        marginBottom: 16,
        borderLeft: '4px solid #8B1A1A',
        borderRadius: 12,
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      }}
      actions={
        showApply
          ? [
              <Button
                key="apply"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply ? onApply(offer.id) : navigate(`/offers/${offer.id}`);
                }}
                style={{ background: '#8B1A1A', color: '#fff', border: 'none' }}
              >
                Postuler
              </Button>,
            ]
          : undefined
      }
    >
      <Card.Meta
        title={
          <Typography.Title level={5} style={{ margin: 0 }}>
            {offer.titre}
          </Typography.Title>
        }
        description={
          <Typography.Paragraph ellipsis={{ rows: 2 }} type="secondary">
            {offer.description}
          </Typography.Paragraph>
        }
      />
      <Space wrap style={{ marginTop: 12 }}>
        {offer.competences_requises.slice(0, 4).map((c) => (
          <Tag key={c} color="blue">
            {c}
          </Tag>
        ))}
        {offer.competences_requises.length > 4 && (
          <Tag>+{offer.competences_requises.length - 4}</Tag>
        )}
      </Space>
      <Space
        style={{ marginTop: 12, fontSize: 12, color: '#888' }}
        split="·"
      >
        {offer.experience_requise > 0 && (
          <span>
            <TeamOutlined /> {offer.experience_requise} ans
          </span>
        )}
        {offer.langue_requise && (
          <span>
            <GlobalOutlined /> {offer.langue_requise}
          </span>
        )}
        <span>
          <ClockCircleOutlined /> {dayjs(offer.date_publication).fromNow()}
        </span>
      </Space>
    </Card>
  );
}

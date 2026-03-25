import { Empty, Typography } from 'antd';
import { HeartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function FavoritesPage() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 4 }}>Offres favorites</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Sauvegardez les offres qui vous intéressent pour y revenir plus tard.
      </Text>
      <Empty
        image={<HeartOutlined style={{ fontSize: 48, color: '#C9A84C' }} />}
        description="Aucune offre sauvegardée pour l'instant"
        style={{ padding: 48 }}
      />
    </div>
  );
}

import { Row, Col, Card, Typography, Spin } from 'antd';
import {
  FileTextOutlined,
  TeamOutlined,
  AimOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import StatsCard from '../../components/dashboard/StatsCard';
import MatchChart from '../../components/dashboard/MatchChart';
import { useRHDashboard } from '../../hooks/useDashboard';
import { useRHOffers } from '../../hooks/useOffers';
import { COLORS } from '../../theme';

export default function RHDashboard() {
  const { data: stats, isLoading: loadingStats } = useRHDashboard();
  const { data: offersData, isLoading: loadingOffers } = useRHOffers({ limit: 10 });

  // Graphique par statut CV
  const cvStatutData = stats?.cvs?.by_statut
    ? Object.entries(stats.cvs.by_statut).map(([name, candidats]) => ({
        name,
        candidats,
      }))
    : [];

  // Graphique offres
  const offersChartData = (offersData?.offers ?? []).map((o) => ({
    name: o.titre.length > 22 ? o.titre.slice(0, 22) + '…' : o.titre,
    candidats: 0,
  }));

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        Tableau de bord RH
      </Typography.Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Offres actives"
            value={stats?.offers?.active ?? 0}
            icon={<FileTextOutlined />}
            color={COLORS.primary}
            loading={loadingStats}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Total offres"
            value={stats?.offers?.total ?? 0}
            icon={<FileTextOutlined />}
            color="#722ed1"
            loading={loadingStats}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="CVs en base"
            value={stats?.cvs?.total ?? 0}
            icon={<TeamOutlined />}
            color={COLORS.secondary}
            loading={loadingStats}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Candidats"
            value={stats?.candidates?.total ?? 0}
            icon={<AimOutlined />}
            color={COLORS.warning}
            loading={loadingStats}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="CVs indexés vs uploadés">
            {loadingStats ? (
              <Spin style={{ display: 'block', textAlign: 'center', padding: 40 }} />
            ) : (
              <MatchChart data={cvStatutData} height={300} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Mes offres">
            {loadingOffers ? (
              <Spin style={{ display: 'block', textAlign: 'center', padding: 40 }} />
            ) : (
              <MatchChart data={offersChartData} height={300} />
            )}
          </Card>
          <Card style={{ marginTop: 16 }}>
            <StatsCard
              title="CVs indexés"
              value={stats?.cvs?.by_statut?.INDEXED ?? 0}
              icon={<CheckCircleOutlined />}
              color={COLORS.secondary}
              loading={loadingStats}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

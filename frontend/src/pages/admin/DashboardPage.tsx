import { Row, Col, Card, Typography, Statistic } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  AimOutlined,
  UserOutlined,
  SendOutlined,
} from '@ant-design/icons';
import StatsCard from '../../components/dashboard/StatsCard';
import MatchChart from '../../components/dashboard/MatchChart';
import { useAdminStats } from '../../hooks/useDashboard';
import { COLORS } from '../../theme';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  const roleChartData = stats?.users?.par_role
    ? Object.entries(stats.users.par_role).map(([name, candidats]) => ({
        name,
        candidats,
      }))
    : [];

  const cvStatutData = stats?.cvs?.par_statut
    ? Object.entries(stats.cvs.par_statut).map(([name, candidats]) => ({
        name,
        candidats,
      }))
    : [];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        Tableau de bord Administration
      </Typography.Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Utilisateurs"
            value={stats?.users?.total ?? 0}
            icon={<UserOutlined />}
            color={COLORS.primary}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="CVs en base"
            value={stats?.cvs?.total ?? 0}
            icon={<FileTextOutlined />}
            color={COLORS.secondary}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Offres"
            value={stats?.offres?.total ?? 0}
            icon={<TeamOutlined />}
            color="#722ed1"
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Candidatures"
            value={stats?.candidatures?.total ?? 0}
            icon={<SendOutlined />}
            color={COLORS.warning}
            loading={isLoading}
          />
        </Col>
      </Row>

      {/* Candidatures details */}
      {stats?.candidatures && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="En attente"
                value={stats.candidatures.en_attente ?? 0}
                valueStyle={{ color: COLORS.warning }}
                prefix={<AimOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Acceptées"
                value={stats.candidatures.acceptees ?? 0}
                valueStyle={{ color: COLORS.secondary }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Refusées"
                value={stats.candidatures.refusees ?? 0}
                valueStyle={{ color: COLORS.danger }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Utilisateurs par rôle">
            <MatchChart data={roleChartData} height={250} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="CVs par statut">
            <MatchChart data={cvStatutData} height={250} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

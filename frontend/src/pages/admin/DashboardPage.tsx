import { Row, Col, Card, Typography } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  AimOutlined,
  UserOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import StatsCard from '../../components/dashboard/StatsCard';
import MatchChart from '../../components/dashboard/MatchChart';
import { useAdminStats } from '../../hooks/useDashboard';
import { COLORS } from '../../theme';

const CARD_STYLE = {
  borderRadius: 12,
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  const roleChartData = stats?.users?.par_role
    ? Object.entries(stats.users.par_role).map(([name, candidats]) => ({ name, candidats }))
    : [];

  const cvStatutData = stats?.cvs?.par_statut
    ? Object.entries(stats.cvs.par_statut).map(([name, candidats]) => ({ name, candidats }))
    : [];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        Tableau de bord Administration
      </Typography.Title>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Utilisateurs"
            value={stats?.users?.total ?? 0}
            icon={<UserOutlined />}
            color={COLORS.primary}
            iconBg="#FFF0F0"
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="CVs en base"
            value={stats?.cvs?.total ?? 0}
            icon={<FileTextOutlined />}
            color={COLORS.secondary}
            iconBg="#F0FFF0"
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Offres"
            value={stats?.offres?.total ?? 0}
            icon={<TeamOutlined />}
            color={COLORS.gold}
            iconBg="#FFF8E6"
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Candidatures"
            value={stats?.candidatures?.total ?? 0}
            icon={<SendOutlined />}
            color={COLORS.warning}
            iconBg="#FFFBE6"
            loading={isLoading}
          />
        </Col>
      </Row>

      {/* Candidatures breakdown */}
      {stats?.candidatures && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card style={CARD_STYLE} styles={{ body: { padding: '16px 20px' } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#FFFBE6', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: COLORS.warning,
                }}>
                  <ClockCircleOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#595959' }}>En attente</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.warning, lineHeight: 1.2 }}>
                    {stats.candidatures.en_attente ?? 0}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={CARD_STYLE} styles={{ body: { padding: '16px 20px' } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#F0FFF0', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: COLORS.success,
                }}>
                  <CheckCircleOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#595959' }}>Acceptées</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.success, lineHeight: 1.2 }}>
                    {stats.candidatures.acceptees ?? 0}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={CARD_STYLE} styles={{ body: { padding: '16px 20px' } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#FFF0F0', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: COLORS.danger,
                }}>
                  <CloseCircleOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#595959' }}>Refusées</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.danger, lineHeight: 1.2 }}>
                    {stats.candidatures.refusees ?? 0}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={<span style={{ color: COLORS.primary, fontWeight: 600 }}>Utilisateurs par rôle</span>}
            style={CARD_STYLE}
            extra={<AimOutlined style={{ color: COLORS.gold }} />}
          >
            <MatchChart data={roleChartData} height={250} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={<span style={{ color: COLORS.primary, fontWeight: 600 }}>CVs par statut</span>}
            style={CARD_STYLE}
            extra={<FileTextOutlined style={{ color: COLORS.gold }} />}
          >
            <MatchChart data={cvStatutData} height={250} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

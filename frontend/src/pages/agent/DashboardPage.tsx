import { Row, Col, Typography } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, SyncOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import StatsCard from '../../components/dashboard/StatsCard';
import { useAgentCVs } from '../../hooks/useCVs';
import { COLORS } from '../../theme';

export default function AgentDashboard() {
  const { data, isLoading } = useAgentCVs({ limit: 1 });

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        Tableau de bord Agent
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Total CVs enregistrés"
            value={data?.total ?? 0}
            icon={<FileTextOutlined />}
            color={COLORS.primary}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="CVs indexés"
            value="—"
            icon={<CheckCircleOutlined />}
            color={COLORS.secondary}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="En cours d'analyse"
            value="—"
            icon={<SyncOutlined />}
            color={COLORS.warning}
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Erreurs"
            value="—"
            icon={<ExclamationCircleOutlined />}
            color={COLORS.danger}
            loading={isLoading}
          />
        </Col>
      </Row>
    </div>
  );
}

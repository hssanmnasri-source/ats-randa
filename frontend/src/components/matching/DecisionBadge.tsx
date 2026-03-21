import { Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { Decision } from '../../types/matching';

const CONFIG: Record<Decision, { color: string; label: string; icon: React.ReactNode }> = {
  RETAINED: { color: 'success', label: 'Retenu', icon: <CheckCircleOutlined /> },
  REFUSED: { color: 'error', label: 'Refusé', icon: <CloseCircleOutlined /> },
  PENDING: { color: 'warning', label: 'En attente', icon: <ClockCircleOutlined /> },
};

export default function DecisionBadge({ decision }: { decision: Decision }) {
  const cfg = CONFIG[decision] ?? CONFIG.PENDING;
  return (
    <Tag color={cfg.color} icon={cfg.icon}>
      {cfg.label}
    </Tag>
  );
}

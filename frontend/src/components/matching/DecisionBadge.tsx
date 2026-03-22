import { Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { Decision } from '../../types/matching';

const CONFIG: Record<Decision, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  RETAINED: { bg: '#52C41A', text: '#fff', label: 'Retenu', icon: <CheckCircleOutlined /> },
  REFUSED: { bg: '#8B1A1A', text: '#fff', label: 'Refusé', icon: <CloseCircleOutlined /> },
  PENDING: { bg: '#C9A84C', text: '#3D0C02', label: 'En attente', icon: <ClockCircleOutlined /> },
};

export default function DecisionBadge({ decision }: { decision: Decision }) {
  const cfg = CONFIG[decision] ?? CONFIG.PENDING;
  return (
    <Tag
      icon={cfg.icon}
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.bg, fontWeight: 600 }}
    >
      {cfg.label}
    </Tag>
  );
}

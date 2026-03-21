import { Tag } from 'antd';
import type { OfferStatut } from '../../types/offer';

const CONFIG: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: 'success', label: 'Active' },
  INACTIVE: { color: 'default', label: 'Inactive' },
  ARCHIVED: { color: 'warning', label: 'Archivée' },
};

export default function OfferBadge({ status }: { status: OfferStatut | string }) {
  const cfg = CONFIG[status] ?? { color: 'default', label: status };
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
}

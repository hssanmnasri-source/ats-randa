import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  value: number | string;
  icon?: ReactNode;
  color?: string;
  iconBg?: string;
  suffix?: string;
  loading?: boolean;
}

export default function StatsCard({
  title,
  value,
  icon,
  color = '#8B1A1A',
  iconBg = '#FFF0F0',
  suffix,
  loading,
}: Props) {
  return (
    <Card
      loading={loading}
      style={{
        borderTop: `4px solid ${color}`,
        borderRadius: 12,
        transition: 'box-shadow 0.3s ease',
      }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {icon && (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
        <Statistic
          title={<span style={{ color: '#595959', fontWeight: 500 }}>{title}</span>}
          value={value}
          suffix={suffix}
          valueStyle={{ color, fontWeight: 700, fontSize: 24 }}
        />
      </div>
    </Card>
  );
}

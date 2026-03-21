import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  value: number | string;
  icon?: ReactNode;
  color?: string;
  suffix?: string;
  loading?: boolean;
}

export default function StatsCard({ title, value, icon, color = '#1a73e8', suffix, loading }: Props) {
  return (
    <Card loading={loading} style={{ borderTop: `3px solid ${color}` }}>
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        prefix={icon}
        valueStyle={{ color }}
      />
    </Card>
  );
}

import { Breadcrumb, Typography } from 'antd';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  extra?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, extra }: Props) {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumbs && (
        <Breadcrumb
          items={breadcrumbs.map((b) => ({ title: b.href ? <a href={b.href}>{b.title}</a> : b.title }))}
          style={{ marginBottom: 8 }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>{title}</Typography.Title>
          {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
        </div>
        {extra && <div>{extra}</div>}
      </div>
    </div>
  );
}

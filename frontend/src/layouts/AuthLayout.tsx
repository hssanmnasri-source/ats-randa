import { Layout, Typography } from 'antd';
import { Outlet } from 'react-router-dom';
import { COLORS } from '../theme';

const { Content } = Layout;

export default function AuthLayout() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <Typography.Title level={3} style={{ color: COLORS.dark, marginBottom: 32 }}>
          🏢 ATS RANDA
        </Typography.Title>
        <Outlet />
      </Content>
    </Layout>
  );
}

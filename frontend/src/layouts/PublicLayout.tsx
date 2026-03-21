import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/common/AppHeader';

const { Content, Footer } = Layout;

export default function PublicLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />
      <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center', color: '#888' }}>
        ATS RANDA © {new Date().getFullYear()} — Système de Gestion des Candidatures
      </Footer>
    </Layout>
  );
}

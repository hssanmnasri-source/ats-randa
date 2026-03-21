import { useState } from 'react';
import { Table, Tag, Button, Switch, Space, Select, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useUsers, useToggleUser } from '../../hooks/useAdmin';
import type { UserOut } from '../../types/api';
import PageHeader from '../../components/common/PageHeader';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'red',
  RH: 'purple',
  AGENT: 'orange',
  CANDIDATE: 'blue',
  VISITOR: 'default',
};

export default function UsersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const { data, isLoading } = useUsers({ page, limit: 20, role: roleFilter });
  const {
    mutate: toggle,
    isPending,
    variables: togglingId,
  } = useToggleUser();

  const columns: ColumnsType<UserOut> = [
    {
      title: 'Nom',
      key: 'nom',
      render: (_, r) => `${r.prenom} ${r.nom}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (r) => (
        <Tag color={ROLE_COLORS[r] ?? 'default'}>{r}</Tag>
      ),
    },
    {
      title: 'Département',
      dataIndex: 'departement',
      key: 'departement',
      width: 130,
      render: (d) => d ?? '—',
    },
    {
      title: 'Actif',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active, r) => (
        <Switch
          checked={active}
          loading={isPending && togglingId === r.id}
          onChange={() => toggle(r.id)}
          size="small"
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle={`${data?.total ?? 0} utilisateurs`}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/users/new')}
          >
            Créer utilisateur
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }}>
        <Typography.Text>Filtrer par rôle :</Typography.Text>
        <Select
          placeholder="Tous les rôles"
          allowClear
          style={{ width: 160 }}
          onChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
          options={['ADMIN', 'RH', 'AGENT', 'CANDIDATE', 'VISITOR'].map((r) => ({
            label: r,
            value: r,
          }))}
        />
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.users ?? []}
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.total ?? 0,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `${t} utilisateurs`,
        }}
      />
    </div>
  );
}

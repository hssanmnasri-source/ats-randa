import { useState } from 'react';
import { Table, Tag, Input, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { useAgentCVs } from '../../hooks/useCVs';
import type { CVDetailOut } from '../../types/cv';
import PageHeader from '../../components/common/PageHeader';
import dayjs from 'dayjs';

const STATUS_COLOR: Record<string, string> = {
  UPLOADED: 'processing',
  PARSING: 'processing',
  INDEXED: 'success',
  ERROR: 'error',
};

const STATUS_LABEL: Record<string, string> = {
  UPLOADED: 'Uploadé',
  PARSING: 'Analyse...',
  INDEXED: 'Indexé',
  ERROR: 'Erreur',
};

export default function CVListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAgentCVs({
    page,
    limit: 20,
    search: search || undefined,
  });

  const columns: ColumnsType<CVDetailOut> = [
    {
      title: 'Fichier',
      key: 'fichier',
      render: (_, r) => r.fichier_pdf ?? `CV #${r.id}`,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 110,
      render: (s) => s ? <Tag>{s}</Tag> : '—',
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 110,
      render: (s) => (
        <Tag color={STATUS_COLOR[s] ?? 'default'}>
          {STATUS_LABEL[s] ?? s}
        </Tag>
      ),
    },
    {
      title: 'Candidat',
      key: 'candidat',
      render: (_, r) =>
        r.candidate
          ? `${r.candidate.prenom ?? ''} ${r.candidate.nom ?? ''}`.trim() ||
            r.candidate.email
          : '—',
    },
    {
      title: 'Date',
      dataIndex: 'date_depot',
      key: 'date_depot',
      width: 120,
      render: (d) => dayjs(d).format('DD/MM/YYYY'),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Liste des CVs"
        subtitle={`${data?.total ?? 0} CVs enregistrés`}
      />
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Rechercher..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 280 }}
          allowClear
        />
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.cvs ?? []}
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.total ?? 0,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `${t} CVs`,
        }}
      />
    </div>
  );
}

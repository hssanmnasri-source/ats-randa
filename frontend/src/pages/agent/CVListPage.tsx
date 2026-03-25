import { useState } from 'react';
import { Table, Tag, Input, Space, Select, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
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

const STATUS_OPTIONS = [
  { value: 'UPLOADED', label: 'Uploadé' },
  { value: 'PARSING', label: 'Analyse...' },
  { value: 'INDEXED', label: 'Indexé' },
  { value: 'ERROR', label: 'Erreur' },
];

export default function CVListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState<string>('UPLOADED');

  const { data, isLoading } = useAgentCVs({
    page,
    limit: 20,
    search: search || undefined,
    statut: statut || undefined,
  });

  const columns: ColumnsType<CVDetailOut> = [
    {
      title: 'Fichier',
      key: 'fichier',
      render: (_, r) => r.fichier_pdf ?? `CV #${r.id}`,
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
      title: 'Email',
      key: 'email',
      render: (_, r) => r.candidate?.email ?? '—',
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
        title="Mes CVs uploadés"
        subtitle={`${data?.total ?? 0} CV(s) trouvé(s)`}
      />
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Rechercher par nom, prénom, email..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          value={statut || undefined}
          placeholder="Tous les statuts"
          allowClear
          style={{ width: 160 }}
          options={STATUS_OPTIONS}
          onChange={(val) => {
            setStatut(val ?? '');
            setPage(1);
          }}
        />
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => navigate('/agent/upload')}
        >
          Uploader un CV
        </Button>
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
          showTotal: (t) => `${t} CV(s)`,
        }}
      />
    </div>
  );
}

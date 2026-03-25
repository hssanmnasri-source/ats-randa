import { useRef } from 'react';
import {
  Button, Card, Table, Tag, Popconfirm, Typography, Upload, Select, Space, Empty,
} from 'antd';
import {
  UploadOutlined, DeleteOutlined, FolderOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { useCandidateDocuments, useUploadDocument, useDeleteDocument } from '../../hooks/useCandidate';
import type { DocumentOut } from '../../types/cv';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const DOC_TYPES = ['CV', 'Diplôme', 'CIN', 'Attestation', 'Autre'];
const TYPE_COLORS: Record<string, string> = {
  CV: 'blue', Diplôme: 'purple', CIN: 'cyan', Attestation: 'green', Autre: 'default',
};

function formatSize(bytes?: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function DocumentsPage() {
  const { data, isLoading } = useCandidateDocuments();
  const { mutate: upload, isPending: uploading } = useUploadDocument();
  const { mutate: remove } = useDeleteDocument();
  const typeRef = useRef<string>('Autre');

  const handleUpload = (file: File) => {
    upload({ file, type_doc: typeRef.current });
    return false; // prevent default ant upload behavior
  };

  const columns = [
    {
      title: 'Nom du fichier',
      dataIndex: 'nom',
      key: 'nom',
      render: (nom: string) => (
        <Space>
          <FileTextOutlined style={{ color: '#8B1A1A' }} />
          <Text>{nom}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type_doc',
      key: 'type_doc',
      width: 120,
      render: (t: string) => <Tag color={TYPE_COLORS[t] ?? 'default'}>{t || 'Autre'}</Tag>,
    },
    {
      title: 'Taille',
      dataIndex: 'taille',
      key: 'taille',
      width: 100,
      render: (t: number) => <Text type="secondary">{formatSize(t)}</Text>,
    },
    {
      title: 'Déposé le',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (d: string) => <Text type="secondary">{dayjs(d).format('DD/MM/YYYY')}</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, row: DocumentOut) => (
        <Popconfirm
          title="Supprimer ce document ?"
          onConfirm={() => remove(row.id)}
          okText="Oui"
          cancelText="Non"
        >
          <Button type="text" icon={<DeleteOutlined />} danger size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Mes Documents</Title>
          <Text type="secondary">Centralisez vos fichiers (CV, diplômes, CIN…) — PDF et Word acceptés.</Text>
        </div>

        <Space>
          <Select
            defaultValue="Autre"
            options={DOC_TYPES.map((t) => ({ value: t, label: t }))}
            style={{ width: 130 }}
            onChange={(v) => { typeRef.current = v; }}
            placeholder="Type"
          />
          <Upload
            accept=".pdf,.doc,.docx"
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={uploading}
              style={{ background: '#8B1A1A', borderColor: '#8B1A1A' }}
            >
              Uploader
            </Button>
          </Upload>
        </Space>
      </div>

      {!isLoading && !data?.documents?.length ? (
        <Card>
          <Empty
            image={<FolderOutlined style={{ fontSize: 48, color: '#C9A84C' }} />}
            description="Aucun document — uploadez votre CV, diplômes ou pièce d'identité"
            style={{ padding: 32 }}
          />
        </Card>
      ) : (
        <Table<DocumentOut>
          dataSource={data?.documents ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          size="middle"
        />
      )}

      <Card size="small" style={{ marginTop: 16, background: '#FFF9E6', borderColor: '#C9A84C' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Formats acceptés : PDF, DOC, DOCX · Taille max : 10 Mo par fichier.
        </Text>
      </Card>
    </div>
  );
}

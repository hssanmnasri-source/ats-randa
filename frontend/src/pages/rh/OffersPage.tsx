import { useState } from 'react';
import { Table, Button, Space, Popconfirm, Tag, Typography, Select, message } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, AimOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRHOffers, useArchiveOffer } from '../../hooks/useOffers';
import { useRunMatching } from '../../hooks/useMatching';
import type { JobOffer, OfferStatut } from '../../types/offer';
import PageHeader from '../../components/common/PageHeader';
import dayjs from 'dayjs';
import api from '../../services/api';
import { COLORS } from '../../theme';

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  BROUILLON:     { label: 'Brouillon',              color: '#8B8B8B', bg: '#F5F5F5' },
  EN_VALIDATION: { label: 'En validation',          color: '#1677ff', bg: '#E6F4FF' },
  PROCHAINEMENT: { label: 'Prochainement en ligne', color: '#722ED1', bg: '#F9F0FF' },
  ACTIVE:        { label: 'En ligne',               color: '#52C41A', bg: '#F6FFED' },
  INACTIVE:      { label: 'Inactive',               color: '#FAAD14', bg: '#FFFBE6' },
  DESACTIVEE:    { label: 'Désactivée',             color: COLORS.gold, bg: '#FFFBE6' },
  EXPIREE:       { label: 'Expirée',                color: '#FF4D4F', bg: '#FFF1F0' },
  REFUSEE:       { label: 'Refusée',                color: COLORS.primary, bg: '#FFF0F0' },
  ARCHIVED:      { label: 'Archivée',               color: '#595959', bg: '#F5F5F5' },
};

const TRANSITIONS: Record<string, OfferStatut[]> = {
  BROUILLON:     ['EN_VALIDATION', 'ARCHIVED'],
  EN_VALIDATION: ['BROUILLON', 'ARCHIVED'],
  PROCHAINEMENT: ['ACTIVE', 'DESACTIVEE', 'ARCHIVED'],
  ACTIVE:        ['DESACTIVEE', 'ARCHIVED'],
  INACTIVE:      ['ACTIVE', 'ARCHIVED'],
  DESACTIVEE:    ['ACTIVE', 'ARCHIVED'],
  EXPIREE:       ['ARCHIVED'],
  REFUSEE:       ['BROUILLON'],
  ARCHIVED:      [],
};

function StatutSelect({ offer, onUpdated }: { offer: JobOffer; onUpdated: () => void }) {
  const [loading, setLoading] = useState(false);
  const statut = offer.statut;
  const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG['ACTIVE'];
  const transitions = TRANSITIONS[statut] || [];

  const handleChange = async (newStatut: string) => {
    setLoading(true);
    try {
      await api.patch(`/api/rh/offers/${offer.id}/statut`, { statut: newStatut });
      message.success(`Statut mis à jour : ${cfg.label} → ${STATUT_CONFIG[newStatut]?.label || newStatut}`);
      onUpdated();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Erreur lors du changement de statut');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      value={statut}
      size="small"
      loading={loading}
      disabled={transitions.length === 0}
      style={{ width: 180 }}
      onChange={handleChange}
      labelRender={() => (
        <Tag style={{
          background: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.color}50`,
          borderRadius: 20, fontWeight: 700, fontSize: 11,
          padding: '0 8px', margin: 0,
        }}>
          {cfg.label}
        </Tag>
      )}
      options={[
        { value: statut, label: cfg.label, disabled: true },
        ...transitions.map((s) => ({
          value: s,
          label: STATUT_CONFIG[s]?.label || s,
        })),
      ]}
    />
  );
}

export default function OffersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useRHOffers({ page, limit: 10 });
  const { mutate: archive, isPending: archiving } = useArchiveOffer();
  const { mutate: runMatching, isPending: matching, variables: matchingOfferId } = useRunMatching();

  const columns: ColumnsType<JobOffer> = [
    {
      title: 'Titre',
      dataIndex: 'titre',
      key: 'titre',
      render: (t, r) => (
        <Typography.Link onClick={() => navigate(`/rh/offers/${r.id}/edit`)}>
          {t}
        </Typography.Link>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 200,
      render: (_, r) => (
        <StatutSelect
          offer={r}
          onUpdated={() => qc.invalidateQueries({ queryKey: ['offers', 'rh'] })}
        />
      ),
    },
    {
      title: 'Langue',
      dataIndex: 'langue_requise',
      key: 'langue',
      width: 90,
      render: (l) => <Tag>{l}</Tag>,
    },
    {
      title: 'Publiée le',
      dataIndex: 'date_publication',
      key: 'date_publication',
      width: 120,
      render: (d) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, r) => (
        <Space size="small">
          <Button
            size="small"
            icon={<AimOutlined />}
            type="primary"
            loading={matching && matchingOfferId === r.id}
            onClick={() => runMatching(r.id)}
          >
            Matching
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/rh/offers/${r.id}/edit`)}
          />
          <Popconfirm
            title="Archiver cette offre ?"
            onConfirm={() => archive(r.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button size="small" danger icon={<DeleteOutlined />} loading={archiving} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Offres d'emploi"
        subtitle={`${data?.total ?? 0} offres au total`}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/rh/offers/new')}
          >
            Nouvelle offre
          </Button>
        }
      />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.offers ?? []}
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.total ?? 0,
          pageSize: 10,
          onChange: setPage,
          showTotal: (t) => `${t} offres`,
        }}
      />
    </div>
  );
}

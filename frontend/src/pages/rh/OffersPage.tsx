import { useState } from 'react';
import { Table, Button, Space, Popconfirm, Tag, Typography } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AimOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useRHOffers, useArchiveOffer } from '../../hooks/useOffers';
import { useRunMatching } from '../../hooks/useMatching';
import type { JobOffer } from '../../types/offer';
import OfferBadge from '../../components/offer/OfferBadge';
import PageHeader from '../../components/common/PageHeader';
import dayjs from 'dayjs';

export default function OffersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useRHOffers({ page, limit: 10 });
  const { mutate: archive, isPending: archiving } = useArchiveOffer();
  const {
    mutate: runMatching,
    isPending: matching,
    variables: matchingOfferId,
  } = useRunMatching();

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
      width: 110,
      render: (s) => <OfferBadge status={s} />,
    },
    {
      title: 'Langue',
      dataIndex: 'langue_requise',
      key: 'langue',
      width: 100,
      render: (l) => <Tag>{l}</Tag>,
    },
    {
      title: 'Publiée le',
      dataIndex: 'date_publication',
      key: 'date_publication',
      width: 130,
      render: (d) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
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
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={archiving}
            />
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

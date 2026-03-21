import { Table, Tag, Button, Popconfirm, Empty, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '../../services/candidateService';
import type { ApplicationOut } from '../../services/candidateService';
import PageHeader from '../../components/common/PageHeader';
import dayjs from 'dayjs';

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const { data: applications, isLoading } = useQuery({
    queryKey: ['candidate', 'applications'],
    queryFn: () => candidateService.getMyApplications(),
  });

  const { mutate: withdraw, isPending } = useMutation({
    mutationFn: (id: number) => candidateService.withdrawApplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate', 'applications'] });
      message.success('Candidature retirée.');
    },
    onError: () => message.error('Erreur lors du retrait.'),
  });

  const columns: ColumnsType<ApplicationOut> = [
    {
      title: 'Offre',
      key: 'offre',
      render: (_, r) => r.titre_offre ?? `Offre #${r.id_offre}`,
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 130,
      render: (s) => (
        <Tag
          color={
            s === 'RETAINED'
              ? 'success'
              : s === 'REFUSED'
              ? 'error'
              : 'processing'
          }
        >
          {s === 'RETAINED'
            ? 'Retenu'
            : s === 'REFUSED'
            ? 'Refusé'
            : 'En cours'}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '—'),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, r) => (
        <Popconfirm
          title="Retirer cette candidature ?"
          onConfirm={() => withdraw(r.id)}
          okText="Oui"
          cancelText="Non"
        >
          <Button size="small" danger loading={isPending}>
            Retirer
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Mes candidatures"
        subtitle={`${applications?.length ?? 0} candidature${(applications?.length ?? 0) > 1 ? 's' : ''}`}
      />
      {applications?.length === 0 ? (
        <Empty
          description="Vous n'avez pas encore de candidatures."
          style={{ padding: 60 }}
        />
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={applications ?? []}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  );
}

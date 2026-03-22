import { Table, Tag, Button, Popconfirm, Empty, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '../../services/candidateService';
import type { ApplicationOut } from '../../services/candidateService';
import PageHeader from '../../components/common/PageHeader';
import dayjs from 'dayjs';

const DECISION_COLOR: Record<string, string> = {
  RETAINED: 'success',
  REFUSED: 'error',
  PENDING: 'processing',
};

const DECISION_LABEL: Record<string, string> = {
  RETAINED: 'Retenu ✓',
  REFUSED: 'Refusé',
  PENDING: 'En attente',
};

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['candidate', 'applications'],
    queryFn: () => candidateService.getMyApplications(),
  });

  const { mutate: withdraw, isPending, variables: withdrawingId } = useMutation({
    mutationFn: (id: number) => candidateService.withdrawApplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate', 'applications'] });
      message.success('Candidature retirée.');
    },
    onError: () => message.error('Erreur lors du retrait.'),
  });

  const applications = data?.candidatures ?? [];
  const total = data?.total ?? 0;

  const columns: ColumnsType<ApplicationOut> = [
    {
      title: 'Offre',
      key: 'offre',
      render: (_, r) => r.offre?.titre ?? `Offre #${r.id_offre}`,
    },
    {
      title: 'Statut',
      key: 'decision',
      width: 140,
      render: (_, r) => (
        <Tag color={DECISION_COLOR[r.decision] ?? 'default'}>
          {DECISION_LABEL[r.decision] ?? r.decision}
        </Tag>
      ),
    },
    {
      title: 'Date',
      key: 'date',
      width: 130,
      render: (_, r) =>
        r.date_candidature ? dayjs(r.date_candidature).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Action',
      key: 'action',
      width: 110,
      render: (_, r) =>
        r.decision === 'PENDING' ? (
          <Popconfirm
            title="Retirer cette candidature ?"
            onConfirm={() => withdraw(r.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button size="small" danger loading={isPending && withdrawingId === r.id}>
              Retirer
            </Button>
          </Popconfirm>
        ) : (
          <Tag color="default">—</Tag>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Mes candidatures"
        subtitle={`${total} candidature${total > 1 ? 's' : ''}`}
      />
      {applications.length === 0 && !isLoading ? (
        <Empty description="Vous n'avez pas encore de candidatures." style={{ padding: 60 }} />
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={applications}
          loading={isLoading}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} candidatures` }}
        />
      )}
    </div>
  );
}

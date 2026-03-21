import { Table, Button, Space, Popconfirm } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ResultatOut, Decision } from '../../types/matching';
import ScoreBar from './ScoreBar';
import DecisionBadge from './DecisionBadge';

interface Props {
  data: ResultatOut[];
  loading?: boolean;
  onDecision?: (resultId: number, decision: Decision) => void;
  updatingId?: number | null;
}

export default function MatchResultTable({ data, loading, onDecision, updatingId }: Props) {
  const columns: ColumnsType<ResultatOut> = [
    {
      title: '#',
      dataIndex: 'rang',
      key: 'rang',
      width: 50,
      render: (r) => r ?? '—',
    },
    {
      title: 'CV',
      dataIndex: 'id_cv',
      key: 'id_cv',
      width: 80,
      render: (id) => `CV #${id}`,
    },
    {
      title: 'Score global',
      key: 'global',
      width: 150,
      render: (_, r) => <ScoreBar score={r.score_final} label="Score global" />,
      sorter: (a, b) => a.score_final - b.score_final,
      defaultSortOrder: 'descend',
    },
    {
      title: 'Sémantique',
      key: 'semantique',
      width: 140,
      render: (_, r) => <ScoreBar score={r.score_matching} label="Sémantique (40%)" />,
    },
    {
      title: 'Compétences',
      key: 'competences',
      width: 140,
      render: (_, r) => <ScoreBar score={r.score_skills} label="Compétences (35%)" />,
    },
    {
      title: 'Expérience',
      key: 'experience',
      width: 130,
      render: (_, r) => <ScoreBar score={r.score_experience} label="Expérience (15%)" />,
    },
    {
      title: 'Langue',
      key: 'langue',
      width: 120,
      render: (_, r) => (
        <ScoreBar score={r.score_langue ?? 0} label="Langue (10%)" />
      ),
    },
    {
      title: 'Décision',
      key: 'decision',
      width: 120,
      render: (_, r) => <DecisionBadge decision={r.decision} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 170,
      render: (_, r) =>
        onDecision ? (
          <Space size="small">
            <Popconfirm
              title="Retenir ce candidat ?"
              onConfirm={() => onDecision(r.id, 'RETAINED')}
              okText="Oui"
              cancelText="Non"
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                loading={updatingId === r.id}
                disabled={r.decision === 'RETAINED'}
              >
                Retenir
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Refuser ce candidat ?"
              onConfirm={() => onDecision(r.id, 'REFUSED')}
              okText="Oui"
              cancelText="Non"
            >
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                loading={updatingId === r.id}
                disabled={r.decision === 'REFUSED'}
              >
                Refuser
              </Button>
            </Popconfirm>
          </Space>
        ) : null,
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 20, showTotal: (t) => `${t} résultats` }}
      scroll={{ x: 1100 }}
    />
  );
}

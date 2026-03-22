import { Table, Progress, Tag, Avatar, Tooltip, Space, Popconfirm, Button } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ResultatOut, Decision } from '../../types/matching';

interface Props {
  data: ResultatOut[];
  loading?: boolean;
  onDecision?: (resultId: number, decision: Decision) => void;
  updatingId?: number | null;
}

const getScoreColor = (score: number): string => {
  if (score >= 0.70) return '#52C41A';
  if (score >= 0.50) return '#C9A84C';
  if (score >= 0.30) return '#FAAD14';
  return '#8B1A1A';
};

const getScoreLabel = (score: number): string => {
  if (score >= 0.70) return 'Excellent';
  if (score >= 0.50) return 'Bon';
  if (score >= 0.30) return 'Moyen';
  return 'Faible';
};

function ScoreMini({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = getScoreColor(score);
  return (
    <div style={{ minWidth: 80 }}>
      <Progress
        percent={pct}
        size="small"
        strokeColor={color}
        showInfo={false}
        style={{ margin: 0 }}
      />
      <div style={{ fontSize: 12, fontWeight: 700, color, textAlign: 'center', marginTop: 2 }}>
        {pct}%
      </div>
    </div>
  );
}

const HEADER_STYLE = { background: '#3D0C02', color: '#F0D080' };

export default function MatchResultTable({ data, loading, onDecision, updatingId }: Props) {
  const columns: ColumnsType<ResultatOut> = [
    {
      title: <span style={HEADER_STYLE}>#</span>,
      dataIndex: 'rang',
      key: 'rang',
      width: 60,
      render: (rang: number, _: ResultatOut, index: number) => (
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: index < 3 ? '#C9A84C' : '#F0F0F0',
          color: index < 3 ? '#3D0C02' : '#595959',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 13, margin: '0 auto',
        }}>
          {rang ?? index + 1}
        </div>
      ),
    },
    {
      title: 'Candidat',
      key: 'candidat',
      width: 200,
      render: (_, r) => {
        const name = [r.candidat_prenom, r.candidat_nom].filter(Boolean).join(' ') || `CV #${r.id_cv}`;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar icon={<UserOutlined />} style={{ background: '#8B1A1A', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A1A' }}>{name}</div>
              {r.candidat_email && (
                <div style={{ fontSize: 11, color: '#8B8B8B' }}>{r.candidat_email}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Score Global',
      key: 'global',
      width: 130,
      sorter: (a, b) => a.score_final - b.score_final,
      defaultSortOrder: 'descend',
      render: (_, r) => {
        const score = r.score_final;
        const color = getScoreColor(score);
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.1 }}>
              {Math.round(score * 100)}%
            </div>
            <Tag style={{ background: color, color: '#fff', border: 'none', fontSize: 10, marginTop: 2 }}>
              {getScoreLabel(score)}
            </Tag>
          </div>
        );
      },
    },
    {
      title: (
        <Tooltip title="Similarité sémantique pgvector — 40% du score">
          <span>🧠 Sémantique<br /><small style={{ fontWeight: 400, color: '#C9A84C', fontSize: 10 }}>40%</small></span>
        </Tooltip>
      ),
      key: 'semantique',
      width: 110,
      render: (_, r) => <ScoreMini score={r.score_matching} />,
    },
    {
      title: (
        <Tooltip title="Correspondance des compétences requises — 35% du score">
          <span>🎯 Compétences<br /><small style={{ fontWeight: 400, color: '#C9A84C', fontSize: 10 }}>35%</small></span>
        </Tooltip>
      ),
      key: 'competences',
      width: 110,
      render: (_, r) => <ScoreMini score={r.score_skills} />,
    },
    {
      title: (
        <Tooltip title="Années d'expérience vs requises — 15% du score">
          <span>📅 Expérience<br /><small style={{ fontWeight: 400, color: '#C9A84C', fontSize: 10 }}>15%</small></span>
        </Tooltip>
      ),
      key: 'experience',
      width: 110,
      render: (_, r) => <ScoreMini score={r.score_experience} />,
    },
    {
      title: (
        <Tooltip title="Correspondance de langue — 10% du score">
          <span>🌐 Langue<br /><small style={{ fontWeight: 400, color: '#C9A84C', fontSize: 10 }}>10%</small></span>
        </Tooltip>
      ),
      key: 'langue',
      width: 100,
      render: (_, r) => <ScoreMini score={r.score_langue ?? 0} />,
    },
    {
      title: 'Décision',
      key: 'decision',
      width: 120,
      render: (_, r) => {
        const cfg: Record<Decision, { bg: string; text: string; label: string }> = {
          RETAINED: { bg: '#52C41A', text: '#fff', label: '✅ Retenu' },
          REFUSED:  { bg: '#8B1A1A', text: '#fff', label: '❌ Refusé' },
          PENDING:  { bg: '#C9A84C', text: '#3D0C02', label: '⏳ En attente' },
        };
        const c = cfg[r.decision] ?? cfg.PENDING;
        return (
          <Tag style={{ background: c.bg, color: c.text, border: 'none', fontWeight: 600 }}>
            {c.label}
          </Tag>
        );
      },
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
                style={{ background: '#52C41A', border: 'none' }}
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
                size="small"
                icon={<CloseOutlined />}
                loading={updatingId === r.id}
                disabled={r.decision === 'REFUSED'}
                style={{ background: '#8B1A1A', color: '#fff', border: 'none' }}
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
      size="middle"
      rowClassName={(_, index) => (index % 2 === 0 ? 'match-row-even' : 'match-row-odd')}
      style={{ borderRadius: 12, overflow: 'hidden' }}
    />
  );
}

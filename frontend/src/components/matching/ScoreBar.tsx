import { Progress, Tooltip } from 'antd';

interface Props {
  score: number; // 0 à 1
  label?: string;
  showPercent?: boolean;
}

export default function ScoreBar({ score, label, showPercent = true }: Props) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? '#52C41A' : pct >= 50 ? '#C9A84C' : pct > 30 ? '#FAAD14' : '#8B1A1A';

  return (
    <Tooltip title={label}>
      <Progress
        percent={pct}
        strokeColor={color}
        size="small"
        format={showPercent ? (p) => `${p}%` : () => ''}
        style={{ marginBottom: 0 }}
      />
    </Tooltip>
  );
}

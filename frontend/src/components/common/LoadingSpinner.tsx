import { Spin } from 'antd';

interface Props {
  fullPage?: boolean;
  tip?: string;
}

export default function LoadingSpinner({ fullPage, tip = 'Chargement...' }: Props) {
  if (fullPage) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip={tip} />
      </div>
    );
  }
  return <Spin tip={tip} />;
}

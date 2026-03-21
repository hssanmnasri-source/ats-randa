import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartData {
  name: string;
  candidats: number;
  retenus?: number;
}

interface Props {
  data: ChartData[];
  height?: number;
}

export default function MatchChart({ data, height = 300 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="candidats" name="Candidats" fill="#1a73e8" radius={[4, 4, 0, 0]} />
        {data.some((d) => d.retenus !== undefined) && (
          <Bar dataKey="retenus" name="Retenus" fill="#34a853" radius={[4, 4, 0, 0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

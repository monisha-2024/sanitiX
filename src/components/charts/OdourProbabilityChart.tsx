import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

const OdourProbabilityChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <ComposedChart width={600} height={300} data={data}>
      <XAxis dataKey="timestamp" />
      <YAxis />
      <Tooltip />
      <ReferenceLine y={0.5} label="NOW" stroke="red" />
      <Bar dataKey="predicted" fill="#413ea0" />
      <Line type="monotone" dataKey="actual" stroke="#ff7300" />
    </ComposedChart>
  );
};

export default OdourProbabilityChart;

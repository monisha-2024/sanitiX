import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const RiskTimelineChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <AreaChart width={600} height={300} data={data}>
      <XAxis dataKey="timestamp" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Area type="monotone" dataKey="risk" stroke="#ff7300" fill="#ffc658" />
    </AreaChart>
  );
};

export default RiskTimelineChart;

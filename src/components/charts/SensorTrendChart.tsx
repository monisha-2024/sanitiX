import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const SensorTrendChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="timestamp" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="temperature" stroke="#8884d8" />
      <Line type="monotone" dataKey="humidity" stroke="#82ca9d" />
      <Line type="monotone" dataKey="h2s" stroke="#FF8042" />
    </LineChart>
  );
};

export default SensorTrendChart;

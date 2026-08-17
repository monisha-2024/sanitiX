import React from 'react';
import { SAMPLE_READINGS } from '../data/sampleData';

const Dashboard: React.FC = () => {
  const predictions = SAMPLE_READINGS.slice(-5); // Last 5 predictions
  return (
    <div>
      <h1 className="text-2xl mb-4">SanitiX AI - Predictive Odour Intelligence</h1>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="p-4 bg-gray-600 rounded">Current Risk: 30%</div>
        <div className="p-4 bg-gray-600 rounded">15-Min: 20%</div>
        <div className="p-4 bg-gray-600 rounded">30-Min: 40%</div>
        <div className="p-4 bg-gray-600 rounded">60-Min: 50%</div>
      </div>
      <h2 className="text-xl mb-2">Last Predictions</h2>
      <table className="min-w-full border-collapse border border-gray-700">
        <thead>
          <tr>
            <th className="border border-gray-600">Timestamp</th>
            <th className="border border-gray-600">Risk</th>
          </tr>
        </thead>
        <tbody>
          {predictions.length === 0 ? (
            <tr>
              <td className="border border-gray-600" colSpan={2}>No predictions yet</td>
            </tr>
          ) : (predictions.map(prediction => (
            <tr key={prediction.timestamp}>
              <td className="border border-gray-600">{prediction.timestamp}</td>
              <td className="border border-gray-600">Risk: {prediction.riskCategory}</td>
            </tr>
          )))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;

import React from 'react';
import { SAMPLE_READINGS } from '../data/sampleData';

const HistoricalData: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl mb-4">Historical Data</h1>
      <button className="mb-4 bg-blue-500 p-2 rounded">Export CSV</button>
      <table className="min-w-full border-collapse border border-gray-700">
        <thead>
          <tr>
            <th className="border border-gray-600">Timestamp</th>
            <th className="border border-gray-600">Location</th>
            <th className="border border-gray-600">Temperature</th>
            <th className="border border-gray-600">Humidity</th>
            <th className="border border-gray-600">H2S</th>
            <th className="border border-gray-600">MQ135</th>
            <th className="border border-gray-600">Waste Level</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_READINGS.map((reading, index) => (
            <tr key={index}>
              <td className="border border-gray-600">{reading.timestamp}</td>
              <td className="border border-gray-600">{reading.location}</td>
              <td className="border border-gray-600">{reading.temperature}</td>
              <td className="border border-gray-600">{reading.humidity}</td>
              <td className="border border-gray-600">{reading.h2s}</td>
              <td className="border border-gray-600">{reading.mq135}</td>
              <td className="border border-gray-600">{reading.waste_level}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoricalData;

import React from 'react';

const PredictionResult: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="mt-4 p-4 bg-gray-600 rounded">
      <h2 className="text-xl">FUTURE ODOUR RISK</h2>
      <div>15-Min Risk: {data.risk15min.toFixed(2)}%</div>
      <div>30-Min Risk: {data.risk30min.toFixed(2)}%</div>
      <div>60-Min Risk: {data.risk60min.toFixed(2)}%</div>
      <div>Overall Risk: {data.overallRisk.toFixed(2)}% ({data.riskCategory})</div>
      <div>Expected Odour Time: {data.expectedOdourMinutes}</div>
      <div>Confidence: {data.confidence}%</div>
      <div>AI Recommendation: {data.recommendation}</div>
    </div>
  );
};

export default PredictionResult;

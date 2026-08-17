import React from 'react';
import { SAMPLE_READINGS } from '../data/sampleData';
import { PredictionEngine } from '../model/predictionEngine';

const Analytics: React.FC = () => {
  const metrics = PredictionEngine.getInstance().evaluateOnDataset(SAMPLE_READINGS, []); // Fetch evaluation metrics

  return (
    <div>
      <h1 className="text-2xl mb-4">Analytics</h1>
      <div className="grid grid-cols-5 gap-4">
        <div className="p-4 bg-gray-600 rounded">Accuracy: {metrics.accuracy.toFixed(2)}</div>
        <div className="p-4 bg-gray-600 rounded">Precision: {metrics.precision.toFixed(2)}</div>
        <div className="p-4 bg-gray-600 rounded">Recall: {metrics.recall.toFixed(2)}</div>
        <div className="p-4 bg-gray-600 rounded">F1 Score: {metrics.f1.toFixed(2)}</div>
        <div className="p-4 bg-gray-600 rounded">ROC AUC: {metrics.rocAuc.toFixed(2)}</div>
      </div>
      <h2 className="text-xl mt-4">Confusion Matrix</h2>
      <table className="min-w-full border-collapse border border-gray-700">
        <tbody>
          <tr>
            <td className="border border-gray-600">TP: {metrics.confusionMatrix[0][0]}</td>
            <td className="border border-gray-600">FP: {metrics.confusionMatrix[0][1]}</td>
          </tr>
          <tr>
            <td className="border border-gray-600">FN: {metrics.confusionMatrix[1][0]}</td>
            <td className="border border-gray-600">TN: {metrics.confusionMatrix[1][1]}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Analytics;

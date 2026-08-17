import React, { useState } from 'react';
import ManualInputForm from '../components/ManualInputForm';
import CSVUpload from '../components/CSVUpload';
import PredictionResult from '../components/PredictionResult';

const AIPrediction: React.FC = () => {
  const [tab, setTab] = useState<'manual' | 'csv'>('manual');
  const [result, setResult] = useState<any>(null);

  const handlePrediction = (data: any) => {
    // Invoke PredictionEngine with data
    // setResult(PredictionEngine.getInstance().predict(data));
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">AI Prediction</h1>
      <div className="mb-4">
        <button onClick={() => setTab('manual')} className={`mr-2 ${tab === 'manual' ? 'bg-blue-500' : ''}`}>Manual Input</button>
        <button onClick={() => setTab('csv')} className={`mr-2 ${tab === 'csv' ? 'bg-blue-500' : ''}`}>CSV Upload</button>
      </div>
      {tab === 'manual' && <ManualInputForm onSubmit={handlePrediction} />}
      {tab === 'csv' && <CSVUpload onSubmit={handlePrediction} />}
      {result && <PredictionResult data={result} />}
    </div>
  );
};

export default AIPrediction;

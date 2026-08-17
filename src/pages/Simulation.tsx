import React, { useState } from 'react';
import { generateDemoScenario } from '../data/sampleData'; // Import function to generate demo scenarios
import { PredictionEngine } from '../model/predictionEngine';

const Simulation: React.FC = () => {
  const [scenario, setScenario] = useState('Normal Conditions');
  const [running, setRunning] = useState(false);
  const [currentReadings, setCurrentReadings] = useState<any[]>([]);
  
  const handleStart = () => {
    setRunning(true);
    const interval = setInterval(() => {
      const nextReading = generateDemoScenario(scenario);
      setCurrentReadings(prev => [...prev, nextReading]);
      PredictionEngine.getInstance().predict([...currentReadings, nextReading]);
      
      if (!running) {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">Simulation</h1>
      <div>
        <button onClick={handleStart} className="mr-2 bg-green-500 p-2 rounded">Start</button>
        <button onClick={() => setRunning(false)} className="bg-red-500 p-2 rounded">Stop</button>
      </div>
      <p>Current Scenario: {scenario}</p>
      <p>Running: {running ? 'Yes' : 'No'}</p>
      <div>
        {currentReadings.map((reading, index) => (
          <div key={index}>{JSON.stringify(reading)}</div>
        ))}
      </div>
    </div>
  );
};

export default Simulation;

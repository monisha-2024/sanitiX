import React, { useState } from 'react';
import { LocationType } from '../types';

const locations = Object.values(LocationType);

const ManualInputForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    temperature: 0,
    humidity: 0,
    waste_level: 0,
    mq135: 0,
    h2s: 0,
    methane: 0,
    time_since_cleaning: 0,
    location: locations[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {Object.keys(formData).map((key) => (
        <div key={key} className="mb-2">
          <label className="block">{key}</label>
          {key === 'location' ? (
            <select name={key} value={formData[key as keyof typeof formData]} onChange={handleChange}>
              {locations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              name={key as keyof typeof formData}
              value={formData[key as keyof typeof formData]}
              onChange={handleChange}
              className="border px-2 py-1"
            />
          )}
        </div>
      ))}
      <button type="submit" className="bg-blue-500 p-2 rounded">Run AI Prediction</button>
    </form>
  );
};

export default ManualInputForm;

import React, { useState } from 'react';
import Papa from 'papaparse';

const CSVUpload: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [fileName, setFileName] = useState('');
  const [rowCount, setRowCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    if (file) {
      setFileName(file.name);
      Papa.parse(file, {
        complete: (results) => {
          setRowCount(results.data.length);
          onSubmit(results.data);
        },
        header: true
      });
    }
  };

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileChange} className="mb-2" />
      <p>{fileName ? `File: ${fileName} (${rowCount} rows)` : 'No file selected'}</p>
      <button onClick={() => onSubmit(null)} className="bg-blue-500 p-2 rounded">Analyze</button>
    </div>
  );
};

export default CSVUpload;

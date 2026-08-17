import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Wind, History, BarChart2, Play, Info } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gray-800 p-4">
      <nav>
        <ul className="space-y-2">
          <li><Link to="/" className="flex items-center"><Home className="mr-2" />Dashboard</Link></li>
          <li><Link to="/ai-prediction" className="flex items-center"><Wind className="mr-2" />AI Prediction</Link></li>
          <li><Link to="/historical-data" className="flex items-center"><History className="mr-2" />Historical Data</Link></li>
          <li><Link to="/analytics" className="flex items-center"><BarChart2 className="mr-2" />Analytics</Link></li>
          <li><Link to="/simulation" className="flex items-center"><Play className="mr-2" />Simulation</Link></li>
          <li><Link to="/about" className="flex items-center"><Info className="mr-2" />About</Link></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

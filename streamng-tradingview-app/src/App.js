import './App.css';
import { useEffect } from 'react';
import fetchData from './tv_chart';

export default function App() {
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <main>
      <div id="chart-div"></div>
      {/* Your component JSX */}
    </main>
  );
}
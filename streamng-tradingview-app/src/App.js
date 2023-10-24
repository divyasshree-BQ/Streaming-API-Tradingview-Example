import { fetchData } from './tv';
import { useEffect } from 'react';
import './App.css';

export default function App() {
  console.log("YOU WERE CALLED");

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <main>
      <div style={{
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        left: '200px'
      }} id="chart-div"><h1>TradingView Chart USDT</h1></div>
    </main>
  );
}
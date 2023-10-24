import { createChart } from "lightweight-charts";

export default async function tradingViewrenderer(values) {
  console.log("values inside tv", values);

   const chart = createChart(document.getElementById("firstContainer"), {
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
    },
  });
  const candlestickSeries = chart.addCandlestickSeries();
  const data_new = [];
  for (let i = 0; i < values.length; i++) {
    console.log("IIII",values[i]);
    console.log(typeof(values[i]))
    let trade = {
      time: Math.round(new Date(values[i]?.Block?.Time).getTime() / 1000),
      open: +values[i].open,
      high: values[i].high,
      low: values[i].low,
      close: +values[i].close,
    };
    data_new.push(trade);
  }
  if (data_new != null) {
    candlestickSeries.setData(data_new);
  }
}

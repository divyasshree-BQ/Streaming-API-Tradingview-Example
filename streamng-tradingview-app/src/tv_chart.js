import { createChart } from "lightweight-charts";
import axios from "axios";

export default async function fetchData() {
  try {
    const response = await axios.post(
      "https://streaming.bitquery.io/graphql",
      {
        query: `
        {
          EVM(dataset: combined) {
            DEXTradeByTokens(
              orderBy: {ascendingByField: "Block_Time"}
              where: {Trade: {Currency: {SmartContract: {is: "0xdac17f958d2ee523a2206206994597c13d831ec7"}}}}
              limit: {count: 10}
            ) {
              Block {
                Time(interval: {in: days, count: 10})
              }
              volume: sum(of: Trade_Amount)
              Trade {
                high: Price(maximum: Trade_Price)
                low: Price(minimum: Trade_Price)
                open: Price(minimum: Block_Number)
                close: Price(maximum: Block_Number)
              }
              count
            }
          }
        }
        
        `,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": "keyy",
        },
      }
    );

    console.log('resp: ', response);

    if (response && response.data) {
      const chartDiv = document.getElementById("chart-div");

      if (!chartDiv) {
        console.error("Error: 'chart-div' element not found.");
        throw new Error("Error: 'chart-div' element not found.");
      }

      const chart = createChart(chartDiv, {
        width: 400,
        height: 300,
      });

      const candlestickSeries = chart.addCandlestickSeries();

      const  data  = response.data.data.EVM.DEXTradeByTokens;
      console.log('data here ', data);

      const chartData = data.map((item) => ({
        time: new Date(item.Block.Time).toISOString().slice(0, 10),
        open: item.Trade.open,
        high: item.Trade.high,
        low: item.Trade.low,
        close: item.Trade.close,
      }));
      console.log('chartData ',chartData)
      candlestickSeries.setData(chartData);

    } 
  }
  catch (error) {
    console.error("Error fetching data:", error);
  }
}
import React, { useEffect, useState } from "react";
import { createChart } from "lightweight-charts";
import fetchTradeData from "./gethistorical";

// let oldtradeData = fetchTradeData();
// console.log(typeof oldtradeData);
export default function MyComponent() {
  console.log("STARTED");
  const [data, setData] = useState([]);
  const [timestamp, setTimestamp] = useState(Date.now());
  useEffect(() => {
    const url = "wss://streaming.bitquery.io/graphql";
    const firstChart = createChart(document.getElementById("firstContainer"));
    const candlestickSeries = firstChart.addCandlestickSeries();
    const volumeSeries = firstChart.addHistogramSeries({
      priceFormat: {
          type: 'volume',
      },
      priceScaleId: '', // set as an overlay by setting a blank priceScaleId
  });
  volumeSeries.priceScale().applyOptions({
    // set the positioning of the volume series
    scaleMargins: {
      top: 0.7, // highest point of the series will be 70% away from the top
      bottom: 0,
    },
  });
    firstChart.applyOptions({
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });
    firstChart.timeScale().fitContent();
    const message = JSON.stringify({
      type: "start",
      id: "1",
      payload: {
        query: `
        subscription {
          EVM(network: eth) {
            DEXTradeByTokens(
              orderBy: {ascendingByField: "Block_Time"}
              where: {Trade: {Currency: {SmartContract: {is: "0xdac17f958d2ee523a2206206994597c13d831ec7"}}, Side: {Currency: {SmartContract: {is: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"}}}}}
            ) {
              Block {
                Time(interval: {in: seconds})
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
        variables: {},
      },
      headers: {
        "X-API-KEY": "your key here",
      },
    });

    const connect = () => {
      let ws = new WebSocket(url, "graphql-ws");

      ws.onopen = () => {
        ws.send(message);
      };

      ws.onmessage = (event) => {
       
        const response = JSON.parse(event.data);
        console.log("ws.onmessage ",response)
        if (response.type === "data") {
          const newTrade = response.payload.data.EVM.DEXTradeByTokens[0];
          console.log("OUT HERE ",newTrade);

          setData([...data, newTrade]);
          setTimestamp(Date.now());

          const date = new Date(newTrade["Block"]["Time"]);

          // Get the timestamp of the Date object in milliseconds.
          const timestampInMilliseconds = Math.round(date.getTime() / 1000);
          let dextime = timestampInMilliseconds;
          let dexopen = newTrade["Trade"]["open"];
          let dexhigh = newTrade["Trade"]["high"];
          let dexlow = newTrade["Trade"]["low"];
          let dexclose = newTrade["Trade"]["close"];
         
            candlestickSeries.update({
              time: dextime,
              open: dexopen,
              high: dexhigh,
              low: dexlow,
              close: dexclose,
            });
            volumeSeries.update({
              time: timestampInMilliseconds,
              volume: newTrade["volume"],
            });
        }
      };

      ws.onclose = () => {
        // console.log("WebSocket disconnected. Retrying in 10 seconds...");
        setTimeout(connect, 10000);
      };
    };

    connect();
    const timer = setInterval(() => {
      // Update the candlestick chart with the latest trade data.
     
      const latestTrade = data[data.length - 1];
      console.log("latestTrade ", latestTrade);
      if (latestTrade) {
        candlestickSeries.update({
          time: timestamp,
          open: latestTrade["Trade"]["open"],
          high: latestTrade["Trade"]["high"],
          low: latestTrade["Trade"]["low"],
          close: latestTrade["Trade"]["close"],
        });
      }
      return () => {
        clearInterval(timer);
      };
    }, 1000);
  }, []);

  return (
    <div>
      <h1>Trade Data:</h1>
      <div id="firstContainer" style={{ height: 500, width: 80 }}></div>
   
    </div>
  );
}

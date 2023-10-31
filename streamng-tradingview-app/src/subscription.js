import React, { useEffect, useState, useRef } from "react";
import { createChart, PriceScaleMode } from "lightweight-charts";
import { getTimestampInMilliseconds } from "./utils";

export default function MyComponent() {
  console.log("STARTED");
  const [data, setData] = useState([]);
  const [timestamp, setTimestamp] = useState(Date.now());

  useEffect(() => {
    let chartContainer = document.getElementById("firstContainer");
    const url = "wss://streaming.bitquery.io/graphql";
    const firstChart = createChart(chartContainer, {
      layout: {
        backgroundColor: "#fff5",
        textColor: "#00000",
      },
      priceScale: {
        position: "left",
        autoscale: true,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });

    const candlestickSeries = firstChart.addCandlestickSeries({
      upColor: "#4bffb5",
      downColor: "#c72867",
      borderDownColor: "#c72867",
      borderUpColor: "#4bffb5",
      wickDownColor: "#c72867",
      wickUpColor: "#f2e9e9",
    });
    const volumeSeries = firstChart.addHistogramSeries(
      {
        color: "#182233",
        lineWidth: 2,
        priceFormat: {
          type: "volume",
        },

        overlay: true,
      },
      []
    );

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
        console.log("ws.onmessage ", response);
        if (response.type === "data") {
          const newTrade = response.payload.data.EVM.DEXTradeByTokens[0];
          console.log("OUT HERE ", newTrade);

          setData([...data, newTrade]);
          setTimestamp(Date.now());

          const date = new Date(newTrade["Block"]["Time"]);

          // Get the timestamp of the Date object in milliseconds.
          const timestampInMilliseconds = getTimestampInMilliseconds(date);
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
          let dexvol = newTrade["volume"];
          const dexvolAsFloat = parseFloat(dexvol);
          volumeSeries.update({
            time: timestampInMilliseconds,
            value: dexvolAsFloat,
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
      <div id="firstContainer" style={{ height: 800, width: 80 }}></div>
    </div>
  );
}

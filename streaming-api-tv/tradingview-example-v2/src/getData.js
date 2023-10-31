import React, { useState, useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";
import axios from "axios";
import { getTimestampInMilliseconds } from "./utils";

export default function TradingViewChart() {
  const [resdata, setData] = useState([]);

  console.log("I AM HERE I AM");
  useEffect(() => {
    console.log("I AM HERE");
    let chartContainer = document.getElementById("tradingview-chart");
    const firstChart = createChart(chartContainer, {
      layout: {
        backgroundColor: "#fff5",
        textColor: "#00000",
      },
      priceScale: {
        position: "left",
        // autoscale: true,
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

    const fetchData = async () => {
      const response = await fetch("https://streaming.bitquery.io/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
          {
            EVM(network: eth, dataset: combined) {
              DEXTradeByTokens(
                orderBy: {ascending: Block_Date}
                where: {Trade: {Currency: {SmartContract: {is: "0xdac17f958d2ee523a2206206994597c13d831ec7"}}, Side: {Currency: {SmartContract: {is: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"}}}}}
                limit: {count: 100}
              ) {
                Block {
                  Date(interval: {in: days})
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
          variables: "{}",
        }),
      });

      if (response.status === 200) {
        const recddata = await response.json();

        const responseData = recddata.data.EVM.DEXTradeByTokens;
        setData(responseData);
      
        const extractedData = [];
        // Iterate through each object in the responseData array
        responseData.forEach((record) => {
          const open = record.Trade.open;
          const high = record.Trade.high;
          const low = record.Trade.low;
          const close = record.Trade.close;
          console.log("record.Block.Date ",record.Block.Date)
          const resdate =  new Date(record.Block.Date);
          console.log("resdate ",resdate)
          console.log("resdate date ",resdate.toISOString().split('T')[0])
          // Create an object to store the extracted values
          const extractedItem = {
            open: open,
            high: high,
            low: low,
            close: close,
            time: resdate.toISOString().split('T')[0],
          };
          // Push the extracted object to the extractedData array
          extractedData.push(extractedItem);
        });
        console.log("extractedData",extractedData);
        candlestickSeries.setData(extractedData);
      } else {
        console.log("error");
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Trade Data</h1>
      <div id="tradingview-chart" style={{ height: 800, width: 80 }}></div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import axios from "axios";

import { createChart } from "lightweight-charts";
export function StreamingData() {
  const [streamingData, setStreamingData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
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
                ) {
                  Block {
                    Time(interval: {in: minutes, count: 10})
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
        setStreamingData(response.data);
        console.log(response);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {streamingData ? (
        <div>
          {/* Render your data here */}
          <pre>{JSON.stringify(streamingData, null, 2)}</pre>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

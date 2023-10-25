import React, { useEffect, useState } from "react";

export default function MyComponent() {
  console.log("STARTED");
  const [data, setData] = useState([]);
  const [lastAddedTime, setLastAddedTime] = useState(null);

  useEffect(() => {
    const url = "wss://streaming.bitquery.io/graphql";
    const message = JSON.stringify({
      type: "start",
      id: "1",
      payload: {
        query: `
          subscription {
            EVM {
              DEXTradeByTokens(
                orderBy: { ascendingByField: "Block_Time" }
                where: { Trade: { Currency: { SmartContract: { is: "0xdac17f958d2ee523a2206206994597c13d831ec7" } } } }
                limit: { count: 10 }
              ) {
                Block {
                  Time(interval: { in: seconds, count: 10 })
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

        if (response.type === "data") {
          const newTrade = response.payload.data.EVM.DEXTradeByTokens[0];
         
          // Check the time of the new trade against the last added time state variable
          if (newTrade.Block.Time !== lastAddedTime) {
            setData([...data, newTrade]);
            
          }
          setLastAddedTime(newTrade.Block.Time);
        }
        console.log("DATA ",data)
      };

      ws.onclose = () => {
        // console.log("WebSocket disconnected. Retrying in 10 seconds...");
        setTimeout(connect, 10000);
      };
    };

    connect();
  }, []);

  return (
    <div>
      <h1>Trade Data:</h1>
      {data.map((trade) => (
        <div key={trade.Block.Time}>
          <p>Block Time: {trade.Block.Time}</p>
          <p>Volume: {trade.volume}</p>
          <p>Trade High: {trade.Trade.high}</p>
          <p>Trade Low: {trade.Trade.low}</p>
          <p>Trade Open: {trade.Trade.open}</p>
          <p>Trade Close: {trade.Trade.close}</p>
          <p>Count: {trade.count}</p>
        </div>
      ))}
    </div>
  );
}

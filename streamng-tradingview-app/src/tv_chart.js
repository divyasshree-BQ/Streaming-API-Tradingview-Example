import React, { useEffect, useState } from "react";

export function MyComponent() {
  const [data, setData] = useState([]);
  useEffect(() => {
    const url = "wss://streaming.bitquery.io/graphql";
    const message = JSON.stringify({
      type: "start",
      id: "1",
      payload: {
        "query": "subscription {\n  EVM {\n    DEXTradeByTokens(\n      orderBy: {ascendingByField: \"Block_Time\"}\n      where: {Trade: {Currency: {SmartContract: {is: \"0xdac17f958d2ee523a2206206994597c13d831ec7\"}}}}\n      limit: {count: 10}\n    ) {\n      Block {\n        Time(interval: {in: minutes, count: 10})\n      }\n      volume: sum(of: Trade_Amount)\n      Trade {\n        high: Price(maximum: Trade_Price)\n        low: Price(minimum: Trade_Price)\n        open: Price(minimum: Block_Number)\n        close: Price(maximum: Block_Number)\n      }\n      count\n    }\n  }\n}",
        "variables": {},
      },
      headers: {
        "X-API-KEY": "your key here",
      },
    });
    let ws = new WebSocket(url, "graphql-ws");

    const connect = () => {
      ws = new WebSocket(url, "graphql-ws");

      ws.onopen = () => {
        ws.send(message);
      };

      ws.onmessage = (event) => {
        const response = JSON.parse(event.data);

        if (response.type === "data") {
          console.log("line 31")
          
          setData(response.payload.data.EVM.DEXTradeByTokens);
          console.log("data",data)
        }
      };
      ws.onclose = () => {
      //  console.log("WebSocket disconnected. Retrying in 10 seconds...");
        setTimeout(connect, 10000);
      };
    };

    connect();
  });
  return (
    <div>
      <h1>Transfer Data:</h1>
      
    </div>
  );
}

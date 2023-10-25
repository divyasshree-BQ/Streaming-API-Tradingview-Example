import axios from "axios";
import React, { useState, useEffect } from "react";

const fetchTradeData = async () => {
  console.log("we came to historical");
  const now = new Date();
  const tenSecondsAgo = new Date(now.getTime() - 10000);

  const query = `
{
  EVM {
    DEXTradeByTokens(
      orderBy: { ascendingByField: "Block_Time" }
      where: {
        Trade: { Currency: { SmartContract: { is: "0xdac17f958d2ee523a2206206994597c13d831ec7" } } },
        Block: { Time: { after: "${tenSecondsAgo.toISOString()}" } }
      }
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
`;

  const config = {
    method: "post",
    url: "https://streaming.bitquery.io/graphql",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": "keyy",
    },
    data: JSON.stringify({
      query,
      variables: "{}",
    }),
  };

  const response = await axios(config);

  if (response.data) {
    console.log("and we got it", response.data.data.EVM);
    const newTrade = response.data.data.EVM.DEXTradeByTokens[0];

    // Convert the string to a Date object.
    const date = new Date(newTrade["Block"]["Time"]);

    // Get the timestamp of the Date object in milliseconds.
    const timestampInMilliseconds = date.getTime();

    // Create a new object to store the key-value pairs.
    const tradeData = {};

    // Add the timestamp to the tradeData object.
    tradeData["dextime"] = timestampInMilliseconds;

    // Add the open, high, low, and close prices to the tradeData object.
    tradeData["dexopen"] = newTrade["Trade"]["open"];
    tradeData["dexhigh"] = newTrade["Trade"]["high"];
    tradeData["dexlow"] = newTrade["Trade"]["low"];
    tradeData["dexclose"] = newTrade["Trade"]["close"];

    // Return the tradeData object.
    return tradeData;
  }
  console.log("we got kicked out")
  return response;
};

export default fetchTradeData;

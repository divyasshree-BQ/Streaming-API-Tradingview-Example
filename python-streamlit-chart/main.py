import asyncio
from python_graphql_client import GraphqlClient
from requests.auth import HTTPBasicAuth
import pandas as pd
import streamlit as st
import datetime
import numpy as np

auth = HTTPBasicAuth('', 'YOUR API KEY')
ws = GraphqlClient(endpoint="wss://streaming.bitquery.io/graphql", auth=auth)

# Initialize an empty DataFrame
ohlc_data = pd.DataFrame(columns=["datetime", "high", "low", "open", "close"])



def callback(response):
  global ohlc_data

  # Get the new OHLC data from the response
  new_ohlc_data = response["data"]["EVM"]["DEXTradeByTokens"][0]["Trade"]
  block_time = response["data"]["EVM"]["DEXTradeByTokens"][0]["Block"]["Time"]
  
  # Append the "block_time" column to the new OHLC data
  new_ohlc_data["datetime"] = block_time

  # Append the new OHLC data to the DataFrame
  ohlc_data = pd.concat([ohlc_data, pd.DataFrame([new_ohlc_data])],
                        ignore_index=True)
  # Convert "datetime" column to DatetimeIndex
  ohlc_data["datetime"] = pd.to_datetime(ohlc_data["datetime"])
  ohlc_data.index = pd.DatetimeIndex(ohlc_data["datetime"])
 
  print("Updated DataFrame:")
  print(ohlc_data)
  st.subheader('Daily Metrics')
  st.bar_chart(ohlc_data,x="datetime", y="high")

 


async def subscribe_to_transfers():
  query = """
    subscription {
        EVM {
            DEXTradeByTokens(
                orderBy: {ascendingByField: "Block_Time"}
                where: {Trade: {Currency: {SmartContract: {is: "0xdac17f958d2ee523a2206206994597c13d831ec7"}}}}
                limit: {count: 10}
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
    """
  await ws.subscribe(query=query, handle=callback)


asyncio.run(subscribe_to_transfers())

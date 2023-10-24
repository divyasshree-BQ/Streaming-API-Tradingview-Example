import asyncio
import json
import websockets
from streamlit_lightweight_charts import renderLightweightCharts


# WebSocket code
async def my_component():
  print("line 9")
  url = 'wss://streaming.bitquery.io/graphql'
  message = json.dumps({
      "type": "start",
      "id": "1",
      "payload": {
          "query":
          "subscription {\n  EVM {\n    DEXTradeByTokens(\n      orderBy: {ascendingByField: \"Block_Time\"}\n      where: {Trade: {Currency: {SmartContract: {is: \"0x\"}}}}\n      limit: {count: 10}\n    ) {\n      Block {\n        Time(interval: {in: days, count: 10})\n      }\n      volume: sum(of: Trade_Amount)\n      Trade {\n        high: Price(maximum: Trade_Price)\n        low: Price(minimum: Trade_Price)\n        open: Price(minimum: Block_Number)\n        close: Price(maximum: Block_Number)\n      }\n      count\n    }\n  }\n}\n",
          "variables": {}
      },
      "headers": {
          "X-API-KEY": "keyy"
      }
  })

  async def connect():
    async with websockets.connect(url, subprotocols=['graphql-ws']) as ws:
      await ws.send(message)

      while True:
        response = await ws.recv()
        response = json.loads(response)

        if response.get('type') == 'data':
          print("line 30")
          print(type(response["payload"]["data"]["EVM"]["DEXTradeByTokens"]))

          # Prepare data for the chart
          chart_data = []
          data = response["payload"]["data"]["EVM"]["DEXTradeByTokens"]
          for row in data:
            data_point = {
                "time": row["Block"]["Time"][0],
                "open": row["Trade"]["open"],
                "high": row["Trade"]["high"],
                "low": row["Trade"]["low"],
                "close": row["Trade"]["close"],
            }
            chart_data.append(data_point)

          # Plot the data on a chart
          chart = {
              "series": [{
                  "type": "Candlestick",
                  "data": chart_data,
                  "options": {
                      "height": 400,
                      "width": 600,
                      "crosshair": True,
                      "candlestick": {
                          "upColor": "green",
                          "downColor": "red"
                      }
                  }
              }]
          }

          # Render the chart
          renderLightweightCharts(charts=[chart])

  await connect()


# Function to start the WebSocket connection
async def start_websocket():
  print("line 38")
  try:
    await my_component()
  except Exception as e:
    print(str(e))


# Main function
if __name__ == "__main__":
  asyncio.run(start_websocket())

const { ApolloServer } = require("apollo-server");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const moment = require("moment");

const resolvers = {
  Query: {
    getTimeSeries: async (parent, { asset }) => {
      const today = moment().format("YYYY-MM-DD");
      const monthPrior = moment().subtract(30, "days").format("YYYY-MM-DD");
      const response = await fetch(
        `https://data.messari.io/api/v1/assets/${asset}/metrics/price/time-series?start=${monthPrior}&end=${today}&interval=1d`
      );

      if (response.status !== 200) {
        throw new Error(response.error_message);
      }

      return await response.json();
    },
    getMetrics: async (parent, { asset }) => {
      const response = await fetch(
        `https://data.messari.io/api/v1/assets/${asset}/metrics`
      );

      if (response.status !== 200) {
        throw new Error(response.error_message);
      }

      return await response.json();
    },
    getAssets: async () => {
      const response = await fetch(
        `https://data.messari.io/api/v2/assets?fields=id,slug,symbol,name`
      );

      if (response.status !== 200) {
        throw new Error(response.error_message);
      }

      const json = await response.json();
      return json.data;
    },
  },
  Metrics: {
    currentUSDPrice: (parent) => parent?.data?.market_data?.price_usd,
    ath: (parent) => parent?.data?.all_time_high?.price,
    athDate: (parent) => parent?.data?.all_time_high?.at,
    marketCapRank: (parent) => parent?.data?.marketcap?.rank,
    marketCapUSD: (parent) => parent?.data?.marketcap?.current_marketcap_usd,
  },
  TimeSeries: {
    values: (parent) => parent?.data?.values,
  },
  Axis: {
    time: (parent) => parent[0].toString(),
    open: (parent) => parent[1],
    high: (parent) => parent[2],
    low: (parent) => parent[3],
    close: (parent) => parent[4],
    volume: (parent) => parent[5],
  },
};

const server = new ApolloServer({
  typeDefs: fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8"),
  resolvers,
});

server.listen().then(({ url }) => console.log(`Server running at ${url}`));

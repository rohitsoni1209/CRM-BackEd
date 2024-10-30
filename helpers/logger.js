const { createLogger, format, transports } = require("winston");
const { MONGO_URI } = process.env;
console.log("MONGO_URI", MONGO_URI);
const logger = createLogger({
  transports: [
    new transports.MongoDB({
      db: `${MONGO_URI}`,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, //new added
      },
      collection: "api-log",
      level: "info",
      storeHost: true,
      decolorize: false,
      metaKey: "meta",
    }),
  ],
  format: format.combine(format.timestamp(), format.json()),
});

module.exports = logger;

const rateLimit = require('express-rate-limit');
const express = require('express')
const app = express()
const bodyParser = require('body-parser');
require('dotenv').config();
const { PORT, DATABASE_URL } = process.env;
const routes = require('./routes/index');
const AutoResponderCron = require('./utility/Cron/autoResponder');
const caseEscalationCron = require('./utility/Cron/caseEscalationCron');
const cors = require('cors');
const { swaggerServe, swaggerSetup } = require('./config')
const expressWinston = require('express-winston')
require('winston-mongodb')
const Mongodb = require("./library/mongodb");
const logger = require('./helpers/logger')



app.use(expressWinston.logger({
  winstonInstance: logger,
  statusLevels: true
}))

// Swagger API Docs
app.use("/api-docs", swaggerServe, swaggerSetup);
// Body-parser
app.use(cors({ origin: 'https://inventory.cloudnexus.site' }));
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true, parameterLimit: 50000 }))
app.use('/v1', routes);
app.get('/', (req, res) => {
  res.send('CRM - V1.0.1')
})
const limiter = rateLimit({
  windowMs: 1000,
  max: 10,
});
// Rate Limiter
app.use(limiter);

Mongodb().then((db) => {

  AutoResponderCron(app.locals.logger);
  caseEscalationCron(app.locals.logger);

  app.listen(PORT, () => {
    console.info("You App is listening", `http://localhost:${PORT}`)
  })
}).catch((error) => { console.error('Error Connecting Mongodb', error) })

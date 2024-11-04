const rateLimit = require('express-rate-limit');
const express = require('express');
const app = express();
require('dotenv').config();
const { PORT, DATABASE_URL } = process.env;
const routes = require('./routes/index');
const AutoResponderCron = require('./utility/Cron/autoResponder');
const caseEscalationCron = require('./utility/Cron/caseEscalationCron');
const cors = require('cors');
const { swaggerServe, swaggerSetup } = require('./config');
const expressWinston = require('express-winston');
require('winston-mongodb');
const Mongodb = require("./library/mongodb");
const logger = require('./helpers/logger');

// Define allowed origins for CORS
const allowedOrigins = [
  'https://crm.test.cloudnexus.site',
  'https://crm.inv.cloudnexus.site'
];

// CORS setup to allow requests only from specified origins
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps or curl)
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// Logging setup with expressWinston
app.use(expressWinston.logger({
  winstonInstance: logger,
  statusLevels: true
}));

// Swagger API Docs
app.use("/api-docs", swaggerServe, swaggerSetup);

// Body parsers with express (no need for body-parser package)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true, parameterLimit: 50000 }));

// Routes
app.use('/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.send('CRM - V1.0.1');
});

// Rate limiter to limit requests per second
const limiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again after a short while.'
});
app.use(limiter);

// MongoDB connection and cron jobs
Mongodb().then((db) => {
  AutoResponderCron(app.locals.logger);
  caseEscalationCron(app.locals.logger);

  // Start the server
  app.listen(PORT, () => {
    console.info("Your App is listening on", `http://localhost:${PORT}`);
  });
}).catch((error) => { 
  console.error('Error Connecting to MongoDB', error); 
});

// Global error handler to catch uncaught errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

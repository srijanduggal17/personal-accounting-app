const express = require('express');
const { createRouter } = require('./routes');

function createApp(db) {
  const app = express();
  app.use(express.json());
  app.use(createRouter(db));

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = {
  createApp,
};

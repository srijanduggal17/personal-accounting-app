const express = require('express');
const { createInsertAccountHandler } = require('./handlers/accountsHandlers');

function createRouter(db) {
  const router = express.Router();
  router.post('/accounts', createInsertAccountHandler(db));
  return router;
}

module.exports = {
  createRouter,
};

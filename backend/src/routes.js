const express = require('express');
const {
  createInsertAccountHandler,
  createListAccountsHandler,
  createDeleteAccountHandler,
  createUpdateAccountHandler,
} = require('./handlers/accountsHandlers');

function createRouter(db) {
  const router = express.Router();
  router.get('/accounts', createListAccountsHandler(db));
  router.post('/accounts', createInsertAccountHandler(db));
  router.delete('/accounts/:id', createDeleteAccountHandler(db));
  router.patch('/accounts/:id', createUpdateAccountHandler(db));
  return router;
}

module.exports = {
  createRouter,
};

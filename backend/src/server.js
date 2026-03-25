const path = require('path');
const express = require('express');
const Database = require('better-sqlite3');
const { createRouter } = require('./routes');

const PORT = Number(process.env.PORT) || 3000;
const databasePath =
  process.env.DATABASE_PATH ||
  path.join(__dirname, '..', '..', 'database', 'mydb_v1.db');

const db = new Database(databasePath);
db.pragma('foreign_keys = ON');

const app = express();
app.use(express.json());
app.use(createRouter(db));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (database: ${databasePath})`);
});

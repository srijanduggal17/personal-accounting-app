const path = require('path');
const Database = require('better-sqlite3');
const { loadOpenApiSpec } = require('./openapi/openapiLoader');

const PORT = Number(process.env.PORT) || 3000;
const databasePath =
  process.env.DATABASE_PATH ||
  path.join(__dirname, '..', '..', 'database', 'mydb_v2.db');

async function start() {
  await loadOpenApiSpec();
  const { createApp } = require('./app');

  const db = new Database(databasePath);
  db.pragma('foreign_keys = ON');

  const app = createApp(db);

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (database: ${databasePath})`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

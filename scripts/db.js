import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(process.cwd(), '.pg_data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export async function getEmbeddedPostgres(port = 5432) {
  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    port: port,
    user: 'postgres',
    password: 'postgres',
    database: 'eve_healthcare',
    persistent: true,
  });

  return pg;
}

// If executed directly from CLI: node scripts/db.js
if (process.argv[1] && process.argv[1].endsWith('db.js')) {
  console.log('🚀 Initializing Embedded PostgreSQL Server...');
  const pg = await getEmbeddedPostgres(5432);
  await pg.initialise();
  await pg.start();
  console.log('✅ PostgreSQL Server is running at postgresql://postgres:postgres@localhost:5432/eve_healthcare');

  const shutdown = async () => {
    console.log('\n🛑 Stopping PostgreSQL Server...');
    await pg.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

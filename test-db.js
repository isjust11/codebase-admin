const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'hungvv',
    password: 'Hg!@1997',
    database: 'readbox'
  });

  const [rows] = await connection.execute(`
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'readbox' 
      AND TABLE_NAME = 'user_interaction' 
      AND REFERENCED_TABLE_NAME IS NOT NULL;
  `);
  
  console.log('Foreign keys:', rows);
  
  for (const row of rows) {
    console.log('Dropping FK:', row.CONSTRAINT_NAME);
    await connection.execute(`ALTER TABLE user_interaction DROP FOREIGN KEY ${row.CONSTRAINT_NAME}`);
  }
  
  console.log('Done!');
  await connection.end();
}

main().catch(console.error);

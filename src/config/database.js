const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bancocarlocal",
  max: 10,
});

async function testConnection() {
  const client = await pool.connect();
  await client.query("SELECT 1");
  client.release();
  return true;
}

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS carros (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      categoria VARCHAR(50) NOT NULL,
      preco DECIMAL(10,2) NOT NULL,
      imagem TEXT NOT NULL,
      caracteristicas JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservas (
      id SERIAL PRIMARY KEY,
      carro_id INTEGER NOT NULL REFERENCES carros(id),
      nome_cliente VARCHAR(100) NOT NULL,
      email_cliente VARCHAR(100) NOT NULL,
      telefone_cliente VARCHAR(20) NOT NULL,
      data_retirada DATE NOT NULL,
      data_devolucao DATE NOT NULL,
      local_retirada VARCHAR(100) NOT NULL,
      status VARCHAR(20) DEFAULT 'pendente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contatos (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      telefone VARCHAR(20) NOT NULL,
      mensagem TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'não lido',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  for (const table of ["carros", "reservas", "contatos"]) {
    await pool.query(`
      DROP TRIGGER IF EXISTS update_${table}_timestamp ON ${table};
      CREATE TRIGGER update_${table}_timestamp
      BEFORE UPDATE ON ${table}
      FOR EACH ROW EXECUTE FUNCTION update_timestamp()
    `);
  }
}

function getPool() {
  return pool;
}

module.exports = { getPool, testConnection, createTables };

const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bancocarLocal",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

async function testConnection() {
  const connection = await getPool().getConnection();
  await connection.ping();
  connection.release();
  return true;
}

async function createTables() {
  const conn = await getPool().getConnection();

  await conn.query(`
    CREATE TABLE IF NOT EXISTS carros (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      categoria VARCHAR(50) NOT NULL,
      preco DECIMAL(10,2) NOT NULL,
      imagem TEXT NOT NULL,
      caracteristicas JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      carro_id INT NOT NULL,
      nome_cliente VARCHAR(100) NOT NULL,
      email_cliente VARCHAR(100) NOT NULL,
      telefone_cliente VARCHAR(20) NOT NULL,
      data_retirada DATE NOT NULL,
      data_devolucao DATE NOT NULL,
      local_retirada VARCHAR(100) NOT NULL,
      status VARCHAR(20) DEFAULT 'pendente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (carro_id) REFERENCES carros(id)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS contatos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      telefone VARCHAR(20) NOT NULL,
      mensagem TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'não lido',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  conn.release();
}

module.exports = { getPool, testConnection, createTables };

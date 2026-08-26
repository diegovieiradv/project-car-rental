require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// Configuração do banco de dados via variáveis de ambiente
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

let pool;

// Função para criar tabelas
async function createTables(connection) {
  await connection.query(`
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

  await connection.query(`
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

  await connection.query(`
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
}

// Função para conectar ao banco de dados
async function connectWithRetry(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Tentativa ${i + 1}/${retries} - Conectando ao banco de dados...`);
      pool = mysql.createPool(dbConfig);
      const connection = await pool.getConnection();
      console.log("Conectado ao banco de dados MySQL");

      await createTables(connection);
      connection.release();

      console.log("Tabelas criadas/verificadas com sucesso");
      return true;
    } catch (error) {
      console.error(`Erro na tentativa ${i + 1}:`, error.message);
      if (i < retries - 1) {
        console.log(`Tentando reconectar em ${delay / 1000} segundos...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error("Não foi possível conectar ao banco de dados após múltiplas tentativas");
}

// Função de validação de email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Função de sanitização básica (escaping de HTML)
function sanitize(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Configuração das rotas da API
function setupRoutes() {
  // Listar todos os carros
  app.get("/api/carros", async (req, res, next) => {
    try {
      const [rows] = await pool.query("SELECT * FROM carros");
      const carrosProcessados = rows.map((carro) => ({
        ...carro,
        preco: Number(carro.preco),
        caracteristicas:
          typeof carro.caracteristicas === "string"
            ? JSON.parse(carro.caracteristicas)
            : Array.isArray(carro.caracteristicas)
            ? carro.caracteristicas
            : [],
      }));
      res.json(carrosProcessados);
    } catch (error) {
      next(error);
    }
  });

  // Buscar carro por ID
  app.get("/api/carros/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const [rows] = await pool.query("SELECT * FROM carros WHERE id = ?", [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Carro não encontrado" });
      }

      const carro = rows[0];
      res.json({
        ...carro,
        preco: Number(carro.preco),
        caracteristicas:
          typeof carro.caracteristicas === "string"
            ? JSON.parse(carro.caracteristicas)
            : Array.isArray(carro.caracteristicas)
            ? carro.caracteristicas
            : [],
      });
    } catch (error) {
      next(error);
    }
  });

  // Criar nova reserva
  app.post("/api/reservas", async (req, res, next) => {
    try {
      const { carro_id, nome_cliente, email_cliente, telefone_cliente, data_retirada, data_devolucao, local_retirada } = req.body;

      // Validações
      const errors = [];
      if (!carro_id || isNaN(parseInt(carro_id))) errors.push("carro_id é obrigatório e deve ser um número");
      if (!nome_cliente || nome_cliente.trim().length < 2) errors.push("nome_cliente é obrigatório (mín. 2 caracteres)");
      if (!email_cliente || !isValidEmail(email_cliente)) errors.push("email_cliente válido é obrigatório");
      if (!telefone_cliente || telefone_cliente.trim().length < 8) errors.push("telefone_cliente é obrigatório (mín. 8 caracteres)");
      if (!data_retirada) errors.push("data_retirada é obrigatória");
      if (!data_devolucao) errors.push("data_devolucao é obrigatória");
      if (!local_retirada || local_retirada.trim().length < 2) errors.push("local_retirada é obrigatório");

      if (data_retirada && data_devolucao && new Date(data_devolucao) <= new Date(data_retirada)) {
        errors.push("data_devolucao deve ser posterior a data_retirada");
      }

      if (errors.length > 0) {
        return res.status(400).json({ error: "Dados inválidos", details: errors });
      }

      const [result] = await pool.query(
        `INSERT INTO reservas (carro_id, nome_cliente, email_cliente, telefone_cliente, data_retirada, data_devolucao, local_retirada)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [parseInt(carro_id), sanitize(nome_cliente.trim()), sanitize(email_cliente.trim()), sanitize(telefone_cliente.trim()), data_retirada, data_devolucao, sanitize(local_retirada.trim())]
      );

      res.status(201).json({
        message: "Reserva criada com sucesso",
        id: result.insertId,
      });
    } catch (error) {
      next(error);
    }
  });

  // Enviar mensagem de contato
  app.post("/api/contatos", async (req, res, next) => {
    try {
      const { nome, email, telefone, mensagem } = req.body;

      const errors = [];
      if (!nome || nome.trim().length < 2) errors.push("nome é obrigatório (mín. 2 caracteres)");
      if (!email || !isValidEmail(email)) errors.push("email válido é obrigatório");
      if (!telefone || telefone.trim().length < 8) errors.push("telefone é obrigatório (mín. 8 caracteres)");
      if (!mensagem || mensagem.trim().length < 10) errors.push("mensagem é obrigatória (mín. 10 caracteres)");

      if (errors.length > 0) {
        return res.status(400).json({ error: "Dados inválidos", details: errors });
      }

      const [result] = await pool.query(
        "INSERT INTO contatos (nome, email, telefone, mensagem) VALUES (?, ?, ?, ?)",
        [sanitize(nome.trim()), sanitize(email.trim()), sanitize(telefone.trim()), sanitize(mensagem.trim())]
      );

      res.status(201).json({
        message: "Mensagem enviada com sucesso",
        id: result.insertId,
      });
    } catch (error) {
      next(error);
    }
  });

  // Verificar disponibilidade do carro
  app.get("/api/carros/:id/disponibilidade", async (req, res, next) => {
    try {
      const { data_retirada, data_devolucao } = req.query;
      const carroId = parseInt(req.params.id);

      if (isNaN(carroId) || !data_retirada || !data_devolucao) {
        return res.status(400).json({ error: "Parâmetros obrigatórios: id, data_retirada, data_devolucao" });
      }

      const [rows] = await pool.query(
        `SELECT COUNT(*) as reservas
         FROM reservas
         WHERE carro_id = ?
         AND status = 'confirmada'
         AND (
           (data_retirada BETWEEN ? AND ?)
           OR (data_devolucao BETWEEN ? AND ?)
           OR (data_retirada <= ? AND data_devolucao >= ?)
         )`,
        [carroId, data_retirada, data_devolucao, data_retirada, data_devolucao, data_retirada, data_devolucao]
      );

      res.json({ disponivel: rows[0].reservas === 0 });
    } catch (error) {
      next(error);
    }
  });

  // Listar reservas
  app.get("/api/reservas", async (req, res, next) => {
    try {
      const [rows] = await pool.query(`
        SELECT r.*, c.nome as nome_carro, c.categoria, c.preco
        FROM reservas r
        JOIN carros c ON r.carro_id = c.id
        ORDER BY r.created_at DESC
      `);
      res.json(rows);
    } catch (error) {
      next(error);
    }
  });
}

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({
    error: "Erro interno do servidor",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Iniciar o servidor
async function start() {
  try {
    await connectWithRetry();
    setupRoutes();
    app.listen(PORT, () => {
      console.log(`Servidor web rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Falha ao iniciar servidor:", error.message);
    process.exit(1);
  }
}

start();

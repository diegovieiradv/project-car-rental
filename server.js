require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000; // Porta fixa para o servidor web

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(".")); // Serve arquivos estáticos do diretório atual

// Configuração do banco de dados
const dbConfig = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "SumemoGold#87",
  database: "bancocarLocal",
};

let db; // Variável global para a conexão do banco de dados

// Função para criar tabelas
async function createTables(connection) {
  try {
    // Criar tabela carros
    await connection.promise().query(`
      CREATE TABLE IF NOT EXISTS carros (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        preco DECIMAL(10,2) NOT NULL,
        imagem TEXT NOT NULL,
        caracteristicas JSON NOT NULL
      )
    `);
    console.log("Tabela carros criada/verificada com sucesso");

    // Criar tabela reservas
    await connection.promise().query(`
      CREATE TABLE IF NOT EXISTS reservas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        carro_id INT,
        nome_cliente VARCHAR(100) NOT NULL,
        email_cliente VARCHAR(100) NOT NULL,
        telefone_cliente VARCHAR(20) NOT NULL,
        data_retirada DATE NOT NULL,
        data_devolucao DATE NOT NULL,
        local_retirada VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (carro_id) REFERENCES carros(id)
      )
    `);
    console.log("Tabela reservas criada/verificada com sucesso");

    // Criar tabela contatos
    await connection.promise().query(`
      CREATE TABLE IF NOT EXISTS contatos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        telefone VARCHAR(20) NOT NULL,
        mensagem TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Tabela contatos criada/verificada com sucesso");
  } catch (error) {
    console.error("Erro ao criar tabelas:", error);
    throw error;
  }
}

// Função para conectar ao banco de dados
async function connectWithRetry() {
  try {
    console.log("Tentando conectar ao banco de dados...");
    db = mysql.createConnection(dbConfig);

    // Converter para promises para usar async/await
    await db.promise().connect();
    console.log("Conectado ao banco de dados MySQL");

    // Criar tabelas
    await createTables(db);

    // Configurar rotas da API após conexão bem-sucedida
    setupRoutes();

    // Iniciar o servidor web
    app.listen(PORT, () => {
      console.log(`Servidor web rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro na conexão:", error);
    console.log("Tentando reconectar em 5 segundos...");
    setTimeout(connectWithRetry, 5000);
  }
}

// Configuração das rotas da API
function setupRoutes() {
  // Listar todos os carros
  app.get("/api/carros", async (req, res) => {
    try {
      console.log("Buscando carros...");
      const [rows] = await db.promise().query("SELECT * FROM carros");
      console.log(`Encontrados ${rows.length} carros`);

      // Processar os dados antes de enviar
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
      console.error("Erro ao buscar carros:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Buscar carro por ID
  app.get("/api/carros/:id", async (req, res) => {
    try {
      const [rows] = await db
        .promise()
        .query("SELECT * FROM carros WHERE id = ?", [req.params.id]);
      if (rows.length === 0) {
        res.status(404).json({ message: "Carro não encontrado" });
        return;
      }
      res.json(rows[0]);
    } catch (error) {
      console.error("Erro ao buscar carro:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Criar nova reserva
  app.post("/api/reservas", async (req, res) => {
    try {
      const {
        carro_id,
        nome_cliente,
        email_cliente,
        telefone_cliente,
        data_retirada,
        data_devolucao,
        local_retirada,
      } = req.body;

      const [result] = await db.promise().query(
        `INSERT INTO reservas 
        (carro_id, nome_cliente, email_cliente, telefone_cliente, data_retirada, data_devolucao, local_retirada)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          carro_id,
          nome_cliente,
          email_cliente,
          telefone_cliente,
          data_retirada,
          data_devolucao,
          local_retirada,
        ]
      );

      res.status(201).json({
        message: "Reserva criada com sucesso",
        id: result.insertId,
      });
    } catch (error) {
      console.error("Erro ao criar reserva:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Enviar mensagem de contato
  app.post("/api/contatos", async (req, res) => {
    try {
      const { nome, email, telefone, mensagem } = req.body;
      const [result] = await db
        .promise()
        .query(
          "INSERT INTO contatos (nome, email, telefone, mensagem) VALUES (?, ?, ?, ?)",
          [nome, email, telefone, mensagem]
        );

      res.status(201).json({
        message: "Mensagem enviada com sucesso",
        id: result.insertId,
      });
    } catch (error) {
      console.error("Erro ao salvar contato:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Verificar disponibilidade do carro
  app.get("/api/carros/:id/disponibilidade", async (req, res) => {
    try {
      const { data_retirada, data_devolucao } = req.query;
      const carroId = req.params.id;

      const [rows] = await db.promise().query(
        `SELECT COUNT(*) as reservas
        FROM reservas
        WHERE carro_id = ?
        AND status = 'confirmada'
        AND (
          (data_retirada BETWEEN ? AND ?)
          OR (data_devolucao BETWEEN ? AND ?)
          OR (data_retirada <= ? AND data_devolucao >= ?)
        )`,
        [
          carroId,
          data_retirada,
          data_devolucao,
          data_retirada,
          data_devolucao,
          data_retirada,
          data_devolucao,
        ]
      );

      res.json({ disponivel: rows[0].reservas === 0 });
    } catch (error) {
      console.error("Erro ao verificar disponibilidade:", error);
      res.status(500).json({ error: error.message });
    }
  });
}

// Iniciar o servidor
connectWithRetry();

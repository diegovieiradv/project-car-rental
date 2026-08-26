require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { testConnection, createTables } = require("./src/config/database");
const carrosRoutes = require("./src/routes/carrosRoutes");
const reservasRoutes = require("./src/routes/reservasRoutes");
const contatosRoutes = require("./src/routes/contatosRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// Rotas da API
app.use("/api/carros", carrosRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/contatos", contatosRoutes);

// Rota de health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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
  let retries = 5;
  while (retries > 0) {
    try {
      console.log("Conectando ao banco de dados PostgreSQL...");
      await testConnection();
      console.log("Conectado ao banco de dados PostgreSQL");

      await createTables();
      console.log("Tabelas criadas/verificadas com sucesso");

      app.listen(PORT, () => {
        console.log(`Servidor web rodando na porta ${PORT}`);
      });
      return;
    } catch (error) {
      retries--;
      console.error(`Erro na conexão: ${error.message}`);
      if (retries > 0) {
        console.log(`Tentando reconectar em 5 segundos... (${retries} tentativas restantes)`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  console.error("Falha ao conectar ao banco de dados após múltiplas tentativas");
  process.exit(1);
}

start();

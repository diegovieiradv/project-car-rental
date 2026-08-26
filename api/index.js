require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { getPool, createTables } = require("../src/config/database");
const carrosRoutes = require("../src/routes/carrosRoutes");
const reservasRoutes = require("../src/routes/reservasRoutes");
const contatosRoutes = require("../src/routes/contatosRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to ensure tables exist (for Vercel cold start)
app.use(async (req, res, next) => {
  try {
    await createTables();
    next();
  } catch (error) {
    console.error("Erro ao criar tabelas:", error);
    next(error);
  }
});

app.use("/api/carros", carrosRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/contatos", contatosRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

module.exports = app;

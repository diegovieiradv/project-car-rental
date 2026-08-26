const { getPool } = require("../config/database");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

exports.criar = async (req, res, next) => {
  try {
    const { carro_id, nome_cliente, email_cliente, telefone_cliente, data_retirada, data_devolucao, local_retirada } = req.body;

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

    const [result] = await getPool().query(
      `INSERT INTO reservas (carro_id, nome_cliente, email_cliente, telefone_cliente, data_retirada, data_devolucao, local_retirada)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [parseInt(carro_id), sanitize(nome_cliente.trim()), sanitize(email_cliente.trim()), sanitize(telefone_cliente.trim()), data_retirada, data_devolucao, sanitize(local_retirada.trim())]
    );

    res.status(201).json({ message: "Reserva criada com sucesso", id: result.insertId });
  } catch (error) {
    next(error);
  }
};

exports.listar = async (req, res, next) => {
  try {
    const [rows] = await getPool().query(`
      SELECT r.*, c.nome as nome_carro, c.categoria, c.preco
      FROM reservas r
      JOIN carros c ON r.carro_id = c.id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

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
    const { nome, email, telefone, mensagem } = req.body;

    const errors = [];
    if (!nome || nome.trim().length < 2) errors.push("nome é obrigatório (mín. 2 caracteres)");
    if (!email || !isValidEmail(email)) errors.push("email válido é obrigatório");
    if (!telefone || telefone.trim().length < 8) errors.push("telefone é obrigatório (mín. 8 caracteres)");
    if (!mensagem || mensagem.trim().length < 10) errors.push("mensagem é obrigatória (mín. 10 caracteres)");

    if (errors.length > 0) {
      return res.status(400).json({ error: "Dados inválidos", details: errors });
    }

    const [result] = await getPool().query(
      "INSERT INTO contatos (nome, email, telefone, mensagem) VALUES (?, ?, ?, ?)",
      [sanitize(nome.trim()), sanitize(email.trim()), sanitize(telefone.trim()), sanitize(mensagem.trim())]
    );

    res.status(201).json({ message: "Mensagem enviada com sucesso", id: result.insertId });
  } catch (error) {
    next(error);
  }
};

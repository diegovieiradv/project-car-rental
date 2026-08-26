const { getPool } = require("../config/database");

exports.listarTodos = async (req, res, next) => {
  try {
    const [rows] = await getPool().query("SELECT * FROM carros");
    const carros = rows.map((carro) => ({
      ...carro,
      preco: Number(carro.preco),
      caracteristicas: parseCaracteristicas(carro.caracteristicas),
    }));
    res.json(carros);
  } catch (error) {
    next(error);
  }
};

exports.buscarPorId = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const [rows] = await getPool().query("SELECT * FROM carros WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Carro não encontrado" });
    }

    const carro = rows[0];
    res.json({
      ...carro,
      preco: Number(carro.preco),
      caracteristicas: parseCaracteristicas(carro.caracteristicas),
    });
  } catch (error) {
    next(error);
  }
};

exports.verificarDisponibilidade = async (req, res, next) => {
  try {
    const { data_retirada, data_devolucao } = req.query;
    const carroId = parseInt(req.params.id);

    if (isNaN(carroId) || !data_retirada || !data_devolucao) {
      return res.status(400).json({ error: "Parâmetros obrigatórios: id, data_retirada, data_devolucao" });
    }

    const [rows] = await getPool().query(
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
};

function parseCaracteristicas(carac) {
  if (Array.isArray(carac)) return carac;
  if (typeof carac === "string") {
    try {
      return JSON.parse(carac);
    } catch {
      return [];
    }
  }
  return [];
}

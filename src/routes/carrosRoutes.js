const express = require("express");
const router = express.Router();
const carrosController = require("../controllers/carrosController");

router.get("/", carrosController.listarTodos);
router.get("/:id", carrosController.buscarPorId);
router.get("/:id/disponibilidade", carrosController.verificarDisponibilidade);

module.exports = router;

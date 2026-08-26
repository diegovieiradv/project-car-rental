const express = require("express");
const router = express.Router();
const reservasController = require("../controllers/reservasController");

router.get("/", reservasController.listar);
router.post("/", reservasController.criar);

module.exports = router;

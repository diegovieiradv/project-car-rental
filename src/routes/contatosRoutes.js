const express = require("express");
const router = express.Router();
const contatosController = require("../controllers/contatosController");

router.post("/", contatosController.criar);

module.exports = router;

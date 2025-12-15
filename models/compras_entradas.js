const mongoose = require("mongoose");

const CompraEntradaSchema = new mongoose.Schema({
    evento_id: mongoose.Types.ObjectId,
    tipo: String,
    cantidad: Number,
    usuario_id: mongoose.Types.ObjectId,
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CompraEntrada", CompraEntradaSchema, "compras_entradas");

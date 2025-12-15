const mongoose = require("mongoose");

const EventoEntradaSchema = new mongoose.Schema({
    evento_id: { type: mongoose.Types.ObjectId, ref: "Evento" },
    tipo: String,
    cantidad_disponible: Number,
    precio: Number
});

module.exports = mongoose.model("EventoEntrada", EventoEntradaSchema, "eventos_entradas");

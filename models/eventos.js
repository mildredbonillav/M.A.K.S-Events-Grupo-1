const mongoose = require("mongoose");

const EventoSchema = new mongoose.Schema({
  categoria_id: { type: mongoose.Types.ObjectId, ref: "CategoriaEvento" },
  nombre: String,
  descripcion: String,
  lugar: String,
  fecha: Date,
  organizador_id: { type: mongoose.Types.ObjectId, ref: "Organizador" }
});

module.exports = mongoose.model("Evento", EventoSchema, "eventos");

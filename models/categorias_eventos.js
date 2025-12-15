const mongoose = require("mongoose");

const CategoriaEventoSchema = new mongoose.Schema({
    nombre: String,
    descripcion: String
});

module.exports = mongoose.model("CategoriaEvento", CategoriaEventoSchema, "categorias_eventos");

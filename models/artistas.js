const mongoose = require("mongoose");

const ArtistaSchema = new mongoose.Schema({
    nombres: String,
    apellidos: String
});

module.exports = mongoose.model("Artista", ArtistaSchema, "artistas");

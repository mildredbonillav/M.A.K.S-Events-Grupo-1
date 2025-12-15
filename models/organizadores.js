const mongoose = require("mongoose");

const OrganizadorSchema = new mongoose.Schema({
    nombre: String,
    apellidos: String,
    correo: String,
    telefono: String
});

module.exports = mongoose.model("Organizador", OrganizadorSchema, "organizadores");

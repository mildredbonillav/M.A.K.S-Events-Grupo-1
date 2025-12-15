const mongoose = require("mongoose");

const EventoArtistaSchema = new mongoose.Schema({
    evento_id: { type: mongoose.Types.ObjectId, ref: "Evento" },
    artista_id: { type: mongoose.Types.ObjectId, ref: "Artista" }
});

module.exports = mongoose.model("EventoArtista", EventoArtistaSchema, "eventos_artistas");

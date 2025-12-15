const mongoose = require("mongoose");

const AsistenciaEventoSchema = new mongoose.Schema({
    evento_id: { type: mongoose.Types.ObjectId, ref: "Evento", required: true },
    usuario_id: { type: mongoose.Types.ObjectId, ref: "Usuario", required: true },
    asistio: { type: Boolean, default: false },
    fecha_registro: { type: Date, default: Date.now }
});

// Índice único para evitar duplicados (un usuario solo puede tener un registro de asistencia por evento)
AsistenciaEventoSchema.index({ evento_id: 1, usuario_id: 1 }, { unique: true });

module.exports = mongoose.model("AsistenciaEvento", AsistenciaEventoSchema, "asistencia_eventos");


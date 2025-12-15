const mongoose = require('mongoose');

const NotificacionSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  tipo: {
    type: String,
    enum: ['evento', 'recordatorio', 'mensaje'],
    required: true
  },
  mensaje: { type: String, required: true },
  evento_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evento'
  },
  leida: { type: Boolean, default: false },
  fecha_creacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notificacion', NotificacionSchema);

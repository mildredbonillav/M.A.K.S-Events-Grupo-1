const express = require('express');
const router = express.Router();
const Notificacion = require('../models/Notificacion');

// Crear notificación
router.post('/', async (req, res) => {
  try {
    const nueva = new Notificacion(req.body);
    const saved = await nueva.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Listar notificaciones de un usuario
router.get('/usuario/:id', async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({ usuario_id: req.params.id }).sort({ fecha_creacion: -1 });
    res.json(notificaciones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Marcar como leída
router.patch('/leer/:id', async (req, res) => {
  try {
    const noti = await Notificacion.findByIdAndUpdate(req.params.id, { leida: true }, { new: true });
    res.json(noti);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Eliminar notificación
router.delete('/:id', async (req, res) => {
  try {
    await Notificacion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notificación eliminada' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Autor = require('../models/Autor');

// CREATE
router.post('/', async (req, res) => {
  try {
    const nuevoAutor = new Autor(req.body);
    const autorGuardado = await nuevoAutor.save();
    res.status(201).json(autorGuardado);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// READ ALL
router.get('/', async (req, res) => {
  try {
    const autores = await Autor.find();
    res.json(autores);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// READ ONE
router.get('/:id', async (req, res) => {
  try {
    const autor = await Autor.findById(parseInt(req.params.id));
    if (!autor) return res.status(404).json({ mensaje: 'Autor no encontrado' });
    res.json(autor);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const autorActualizado = await Autor.findByIdAndUpdate(
      parseInt(req.params.id),
      req.body,
      { new: true, runValidators: true }
    );
    if (!autorActualizado) return res.status(404).json({ mensaje: 'Autor no encontrado' });
    res.json(autorActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const autorEliminado = await Autor.findByIdAndDelete(parseInt(req.params.id));
    if (!autorEliminado) return res.status(404).json({ mensaje: 'Autor no encontrado' });
    res.json({ mensaje: 'Autor eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

module.exports = router;

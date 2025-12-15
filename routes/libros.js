const express = require('express');
const router = express.Router();
const Libro = require('../models/Libro');
const Autor = require('../models/Autor');
const Categoria = require('../models/Categoria');

// Función helper para poblar manualmente
async function populateLibro(libro) {
  // Convertir a objeto plano para poder agregar propiedades
  const libroObj = libro.toObject ? libro.toObject() : JSON.parse(JSON.stringify(libro));
  
  if (libroObj.autor_id !== undefined && libroObj.autor_id !== null) {
    try {
      const autorId = parseInt(libroObj.autor_id);
      const autor = await Autor.findOne({ _id: autorId });
      if (autor) {
        libroObj.autor = autor.toObject ? autor.toObject() : JSON.parse(JSON.stringify(autor));
      } else {
        console.log(`Autor con ID ${autorId} no encontrado`);
        libroObj.autor = null;
      }
    } catch (error) {
      console.error('Error al poblar autor:', error);
      libroObj.autor = null;
    }
  }
  if (libroObj.categoria_id !== undefined && libroObj.categoria_id !== null) {
    try {
      const categoriaId = parseInt(libroObj.categoria_id);
      const categoria = await Categoria.findOne({ _id: categoriaId });
      if (categoria) {
        libroObj.categoria = categoria.toObject ? categoria.toObject() : JSON.parse(JSON.stringify(categoria));
      } else {
        console.log(`Categoría con ID ${categoriaId} no encontrada`);
        libroObj.categoria = null;
      }
    } catch (error) {
      console.error('Error al poblar categoría:', error);
      libroObj.categoria = null;
    }
  }
  return libroObj;
}

// CREATE
router.post('/', async (req, res) => {
  try {
    const nuevoLibro = new Libro(req.body);
    const libroGuardado = await nuevoLibro.save();
    await populateLibro(libroGuardado);
    res.status(201).json(libroGuardado);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// READ ALL
router.get('/', async (req, res) => {
  try {
    const libros = await Libro.find();
    // Poblar manualmente cada libro
    const librosPoblados = await Promise.all(
      libros.map(libro => populateLibro(libro))
    );
    res.json(librosPoblados);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// READ ONE
router.get('/:id', async (req, res) => {
  try {
    const libro = await Libro.findById(parseInt(req.params.id));
    if (!libro) return res.status(404).json({ mensaje: 'Libro no encontrado' });
    await populateLibro(libro);
    res.json(libro);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const libroActualizado = await Libro.findByIdAndUpdate(
      parseInt(req.params.id),
      req.body,
      { new: true, runValidators: true }
    );
    if (!libroActualizado) return res.status(404).json({ mensaje: 'Libro no encontrado' });
    await populateLibro(libroActualizado);
    res.json(libroActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const libroEliminado = await Libro.findByIdAndDelete(parseInt(req.params.id));
    if (!libroEliminado) return res.status(404).json({ mensaje: 'Libro no encontrado' });
    res.json({ mensaje: 'Libro eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

module.exports = router;

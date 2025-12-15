const express = require('express');
const router = express.Router();
const Prestamo = require('../models/Prestamo');
const Libro = require('../models/Libro');
const Usuario = require('../models/Usuario');

// Función helper para poblar manualmente
async function populatePrestamo(prestamo) {
  // Convertir a objeto plano
  const prestamoObj = prestamo.toObject ? prestamo.toObject() : JSON.parse(JSON.stringify(prestamo));
  
  if (prestamoObj.usuario_id !== undefined && prestamoObj.usuario_id !== null) {
    try {
      const usuarioId = parseInt(prestamoObj.usuario_id);
      const usuario = await Usuario.findOne({ _id: usuarioId });
      if (usuario) {
        prestamoObj.usuario = usuario.toObject ? usuario.toObject() : JSON.parse(JSON.stringify(usuario));
      } else {
        console.log(`Usuario con ID ${usuarioId} no encontrado`);
        prestamoObj.usuario = null;
      }
    } catch (error) {
      console.error('Error al poblar usuario:', error);
      prestamoObj.usuario = null;
    }
  }
  if (prestamoObj.libro_id !== undefined && prestamoObj.libro_id !== null) {
    try {
      const libroId = parseInt(prestamoObj.libro_id);
      const libro = await Libro.findOne({ _id: libroId });
      // Poblar también autor y categoría del libro
      if (libro) {
        const libroObj = libro.toObject ? libro.toObject() : JSON.parse(JSON.stringify(libro));
        const Autor = require('../models/Autor');
        const Categoria = require('../models/Categoria');
        if (libroObj.autor_id !== undefined && libroObj.autor_id !== null) {
          const autorId = parseInt(libroObj.autor_id);
          const autor = await Autor.findOne({ _id: autorId });
          if (autor) {
            libroObj.autor = autor.toObject ? autor.toObject() : JSON.parse(JSON.stringify(autor));
          }
        }
        if (libroObj.categoria_id !== undefined && libroObj.categoria_id !== null) {
          const categoriaId = parseInt(libroObj.categoria_id);
          const categoria = await Categoria.findOne({ _id: categoriaId });
          if (categoria) {
            libroObj.categoria = categoria.toObject ? categoria.toObject() : JSON.parse(JSON.stringify(categoria));
          }
        }
        prestamoObj.libro = libroObj;
      } else {
        console.log(`Libro con ID ${libroId} no encontrado`);
        prestamoObj.libro = null;
      }
    } catch (error) {
      console.error('Error al poblar libro:', error);
      prestamoObj.libro = null;
    }
  }
  return prestamoObj;
}

// CREATE
router.post('/', async (req, res) => {
  try {
    // Validar que se reciban los campos requeridos
    if (!req.body._id) {
      return res.status(400).json({ mensaje: 'El ID del préstamo es requerido' });
    }
    if (!req.body.usuario_id && !req.body.usuario) {
      return res.status(400).json({ mensaje: 'El usuario es requerido' });
    }
    if (!req.body.libro_id && !req.body.libro) {
      return res.status(400).json({ mensaje: 'El libro es requerido' });
    }

    // Convertir campos del body
    const prestamoData = {
      _id: parseInt(req.body._id),
      usuario_id: parseInt(req.body.usuario_id || req.body.usuario),
      libro_id: parseInt(req.body.libro_id || req.body.libro),
      fecha_prestamo: req.body.fecha_prestamo ? new Date(req.body.fecha_prestamo) : new Date(),
      fecha_devolucion: req.body.fecha_devolucion ? new Date(req.body.fecha_devolucion) : null,
      devuelto: req.body.devuelto || false
    };

    // Verificar que el usuario exista
    const usuario = await Usuario.findOne({ _id: prestamoData.usuario_id });
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Verificar que el libro exista y esté disponible
    const libro = await Libro.findOne({ _id: prestamoData.libro_id });
    if (!libro) {
      return res.status(404).json({ mensaje: 'Libro no encontrado' });
    }
    if (!libro.disponible) {
      return res.status(400).json({ mensaje: 'El libro no está disponible' });
    }

    // Verificar que el ID del préstamo no exista ya
    const prestamoExistente = await Prestamo.findOne({ _id: prestamoData._id });
    if (prestamoExistente) {
      return res.status(400).json({ mensaje: 'Ya existe un préstamo con ese ID' });
    }

    // Crear el préstamo
    const nuevoPrestamo = new Prestamo(prestamoData);
    const prestamoGuardado = await nuevoPrestamo.save();

    // Marcar el libro como no disponible
    libro.disponible = false;
    await libro.save();

    // Poblar relaciones
    const prestamoPoblado = await populatePrestamo(prestamoGuardado);
    res.status(201).json(prestamoPoblado);
  } catch (error) {
    console.error('Error al crear préstamo:', error);
    res.status(400).json({ mensaje: error.message || 'Error al crear el préstamo' });
  }
});

// READ ALL
router.get('/', async (req, res) => {
  try {
    const prestamos = await Prestamo.find();
    // Poblar manualmente cada préstamo
    const prestamosPoblados = await Promise.all(
      prestamos.map(prestamo => populatePrestamo(prestamo))
    );
    res.json(prestamosPoblados);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// READ ONE
router.get('/:id', async (req, res) => {
  try {
    const prestamo = await Prestamo.findOne({ _id: parseInt(req.params.id) });
    if (!prestamo) return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    const prestamoPoblado = await populatePrestamo(prestamo);
    res.json(prestamoPoblado);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

// UPDATE (para devolver libro)
router.put('/:id', async (req, res) => {
  try {
    const prestamoId = parseInt(req.params.id);
    const prestamo = await Prestamo.findOne({ _id: prestamoId });
    if (!prestamo) return res.status(404).json({ mensaje: 'Préstamo no encontrado' });

    // Si se está marcando como devuelto
    if (req.body.devuelto === true && !prestamo.devuelto) {
      const libro = await Libro.findOne({ _id: prestamo.libro_id });
      if (libro) {
        libro.disponible = true;
        await libro.save();
      }
      req.body.fecha_devolucion = new Date();
    }

    // Convertir campos numéricos si vienen en el body
    if (req.body.usuario_id) req.body.usuario_id = parseInt(req.body.usuario_id);
    if (req.body.libro_id) req.body.libro_id = parseInt(req.body.libro_id);

    const prestamoActualizado = await Prestamo.findOneAndUpdate(
      { _id: prestamoId },
      req.body,
      { new: true, runValidators: true }
    );
    
    const prestamoPoblado = await populatePrestamo(prestamoActualizado);
    res.json(prestamoPoblado);
  } catch (error) {
    console.error('Error al actualizar préstamo:', error);
    res.status(400).json({ mensaje: error.message || 'Error al actualizar el préstamo' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const prestamoId = parseInt(req.params.id);
    const prestamo = await Prestamo.findOne({ _id: prestamoId });
    if (!prestamo) return res.status(404).json({ mensaje: 'Préstamo no encontrado' });

    // Si el préstamo no estaba devuelto, marcar el libro como disponible
    if (!prestamo.devuelto) {
      const libro = await Libro.findOne({ _id: prestamo.libro_id });
      if (libro) {
        libro.disponible = true;
        await libro.save();
      }
    }

    await Prestamo.findOneAndDelete({ _id: prestamoId });
    res.json({ mensaje: 'Préstamo eliminado' });
  } catch (error) {
    console.error('Error al eliminar préstamo:', error);
    res.status(500).json({ mensaje: error.message || 'Error al eliminar el préstamo' });
  }
});

module.exports = router;

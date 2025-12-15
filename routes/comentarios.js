const express = require("express");
const router = express.Router();
const Comentario = require("../models/Comentario");

// CREATE (Agregar una nueva reseña)
router.post("/", async (req, res) => {
    try {
        const { usuario, evento, comentario, calificacion } = req.body;

        if (!usuario || !evento || !comentario || !calificacion) {
            return res.status(400).json({
                success: false,
                message: "Todos los campos son requeridos"
            });
        }

        const nuevaResena = new Comentario({
            usuario,
            evento,
            comentario,
            calificacion
        });

        const resenaGuardada = await nuevaResena.save();

        res.status(201).json({
            success: true,
            resena: resenaGuardada
        });
    } catch (error) {
        console.error("Error creando reseña:", error);
        res.status(500).json({
            success: false,
            message: "Error al crear reseña",
            error: error.message
        });
    }
});

// READ ALL (Obtener todas las reseñas)
router.get("/", async (req, res) => {
  try {
    const comentarios = await Comentario.find()
      .populate("usuario", "nombre apellidos")
      .sort({ createdAt: -1 });

    res.json({ success: true, comentarios });
  } catch (error) {
    console.error("Error obteniendo comentarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener comentarios"
    });
  }
});


// READ ONE (Obtener una reseña específica)
router.get("/:id", async (req, res) => {
    try {
        const resena = await Comentario.findById(req.params.id)
            .populate("usuario", "nombre apellidos")
            .populate("evento_id", "nombre");

        if (!resena) {
            return res.status(404).json({
                success: false,
                message: "Reseña no encontrada"
            });
        }

        res.json({
            success: true,
            resena
        });
    } catch (error) {
        console.error("Error obteniendo reseña:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener reseña",
            error: error.message
        });
    }
});

// UPDATE (Editar reseña)
router.put("/:id", async (req, res) => {
    try {
        const { comentario, calificacion } = req.body;

        const resenaActualizada = await Comentario.findByIdAndUpdate(
            req.params.id,
            { comentario, calificacion },
            { new: true, runValidators: true }
        );

        if (!resenaActualizada) {
            return res.status(404).json({
                success: false,
                message: "Reseña no encontrada"
            });
        }

        res.json({
            success: true,
            resena: resenaActualizada
        });
    } catch (error) {
        console.error("Error actualizando reseña:", error);
        res.status(500).json({
            success: false,
            message: "Error al actualizar reseña",
            error: error.message
        });
    }
});

// DELETE (Eliminar reseña)
router.delete("/:id", async (req, res) => {
    try {
        const resenaEliminada = await Comentario.findByIdAndDelete(req.params.id);

        if (!resenaEliminada) {
            return res.status(404).json({
                success: false,
                message: "Reseña no encontrada"
            });
        }

        res.json({
            success: true,
            message: "Reseña eliminada exitosamente"
        });
    } catch (error) {
        console.error("Error eliminando reseña:", error);
        res.status(500).json({
            success: false,
            message: "Error al eliminar reseña",
            error: error.message
        });
    }
});

module.exports = router;

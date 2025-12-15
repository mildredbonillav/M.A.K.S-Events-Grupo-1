const express = require("express");
const router = express.Router();
const Artista = require("../models/artistas");

// CREATE
router.post("/", async (req, res) => {
    try {
        const { nombres, apellidos } = req.body;
        
        if (!nombres || !apellidos) {
            return res.status(400).json({ 
                success: false, 
                message: "Nombres y apellidos son requeridos" 
            });
        }

        const nuevoArtista = new Artista({ nombres, apellidos });
        const artistaGuardado = await nuevoArtista.save();
        
        res.status(201).json({ 
            success: true, 
            artista: artistaGuardado 
        });
    } catch (error) {
        console.error("Error creando artista:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al crear artista",
            error: error.message 
        });
    }
});

// READ ALL
router.get("/", async (req, res) => {
    try {
        const artistas = await Artista.find();
        res.json({ success: true, artistas });
    } catch (error) {
        console.error("Error obteniendo artistas:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener artistas",
            error: error.message 
        });
    }
});

// READ ONE
router.get("/:id", async (req, res) => {
    try {
        const artista = await Artista.findById(req.params.id);
        
        if (!artista) {
            return res.status(404).json({ 
                success: false, 
                message: "Artista no encontrado" 
            });
        }
        
        res.json({ success: true, artista });
    } catch (error) {
        console.error("Error obteniendo artista:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener artista",
            error: error.message 
        });
    }
});

// UPDATE
router.put("/:id", async (req, res) => {
    try {
        const artistaActualizado = await Artista.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!artistaActualizado) {
            return res.status(404).json({ 
                success: false, 
                message: "Artista no encontrado" 
            });
        }
        
        res.json({ 
            success: true, 
            artista: artistaActualizado 
        });
    } catch (error) {
        console.error("Error actualizando artista:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al actualizar artista",
            error: error.message 
        });
    }
});

// DELETE
router.delete("/:id", async (req, res) => {
    try {
        const artistaEliminado = await Artista.findByIdAndDelete(req.params.id);
        
        if (!artistaEliminado) {
            return res.status(404).json({ 
                success: false, 
                message: "Artista no encontrado" 
            });
        }
        
        res.json({ 
            success: true, 
            message: "Artista eliminado exitosamente" 
        });
    } catch (error) {
        console.error("Error eliminando artista:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al eliminar artista",
            error: error.message 
        });
    }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const Organizador = require("../models/organizadores");

// CREATE
router.post("/", async (req, res) => {
    try {
        const { nombre, apellidos, correo, telefono } = req.body;
        
        if (!nombre || !correo) {
            return res.status(400).json({ 
                success: false, 
                message: "Nombre y correo son requeridos" 
            });
        }

        const nuevoOrganizador = new Organizador({ 
            nombre, 
            apellidos, 
            correo, 
            telefono 
        });
        
        const organizadorGuardado = await nuevoOrganizador.save();
        
        res.status(201).json({ 
            success: true, 
            organizador: organizadorGuardado 
        });
    } catch (error) {
        console.error("Error creando organizador:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al crear organizador",
            error: error.message 
        });
    }
});

// READ ALL
router.get("/", async (req, res) => {
    try {
        const organizadores = await Organizador.find();
        res.json({ success: true, organizadores });
    } catch (error) {
        console.error("Error obteniendo organizadores:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener organizadores",
            error: error.message 
        });
    }
});

// READ ONE
router.get("/:id", async (req, res) => {
    try {
        const organizador = await Organizador.findById(req.params.id);
        
        if (!organizador) {
            return res.status(404).json({ 
                success: false, 
                message: "Organizador no encontrado" 
            });
        }
        
        res.json({ success: true, organizador });
    } catch (error) {
        console.error("Error obteniendo organizador:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener organizador",
            error: error.message 
        });
    }
});

// UPDATE
router.put("/:id", async (req, res) => {
    try {
        const organizadorActualizado = await Organizador.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!organizadorActualizado) {
            return res.status(404).json({ 
                success: false, 
                message: "Organizador no encontrado" 
            });
        }
        
        res.json({ 
            success: true, 
            organizador: organizadorActualizado 
        });
    } catch (error) {
        console.error("Error actualizando organizador:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al actualizar organizador",
            error: error.message 
        });
    }
});

// DELETE
router.delete("/:id", async (req, res) => {
    try {
        const organizadorEliminado = await Organizador.findByIdAndDelete(req.params.id);
        
        if (!organizadorEliminado) {
            return res.status(404).json({ 
                success: false, 
                message: "Organizador no encontrado" 
            });
        }
        
        res.json({ 
            success: true, 
            message: "Organizador eliminado exitosamente" 
        });
    } catch (error) {
        console.error("Error eliminando organizador:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al eliminar organizador",
            error: error.message 
        });
    }
});

module.exports = router;
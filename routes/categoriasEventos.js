const express = require("express");
const router = express.Router();
const CategoriaEvento = require("../models/categorias_eventos");

// CREATE
router.post("/", async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        
        if (!nombre) {
            return res.status(400).json({ 
                success: false, 
                message: "El nombre es requerido" 
            });
        }

        const nuevaCategoria = new CategoriaEvento({ 
            nombre, 
            descripcion 
        });
        
        const categoriaGuardada = await nuevaCategoria.save();
        
        res.status(201).json({ 
            success: true, 
            categoria: categoriaGuardada 
        });
    } catch (error) {
        console.error("Error creando categoría:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al crear categoría",
            error: error.message 
        });
    }
});

// READ ALL
router.get("/", async (req, res) => {
    try {
        const categorias = await CategoriaEvento.find();
        res.json({ success: true, categorias });
    } catch (error) {
        console.error("Error obteniendo categorías:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener categorías",
            error: error.message 
        });
    }
});

// READ ONE
router.get("/:id", async (req, res) => {
    try {
        const categoria = await CategoriaEvento.findById(req.params.id);
        
        if (!categoria) {
            return res.status(404).json({ 
                success: false, 
                message: "Categoría no encontrada" 
            });
        }
        
        res.json({ success: true, categoria });
    } catch (error) {
        console.error("Error obteniendo categoría:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener categoría",
            error: error.message 
        });
    }
});

// UPDATE
router.put("/:id", async (req, res) => {
    try {
        const categoriaActualizada = await CategoriaEvento.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!categoriaActualizada) {
            return res.status(404).json({ 
                success: false, 
                message: "Categoría no encontrada" 
            });
        }
        
        res.json({ 
            success: true, 
            categoria: categoriaActualizada 
        });
    } catch (error) {
        console.error("Error actualizando categoría:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al actualizar categoría",
            error: error.message 
        });
    }
});

// DELETE
router.delete("/:id", async (req, res) => {
    try {
        const categoriaEliminada = await CategoriaEvento.findByIdAndDelete(req.params.id);
        
        if (!categoriaEliminada) {
            return res.status(404).json({ 
                success: false, 
                message: "Categoría no encontrada" 
            });
        }
        
        res.json({ 
            success: true, 
            message: "Categoría eliminada exitosamente" 
        });
    } catch (error) {
        console.error("Error eliminando categoría:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al eliminar categoría",
            error: error.message 
        });
    }
});

module.exports = router;
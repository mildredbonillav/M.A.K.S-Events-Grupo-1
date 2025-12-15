const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuario");

// CREATE
router.post("/", async (req, res) => {
    try {
        const { nombre, apellidos, correo, password, rol } = req.body;

        if (!nombre || !apellidos || !correo || !password) {
            return res.status(400).json({
                success: false,
                message: "Nombre, apellidos, correo y contraseña son requeridos"
            });
        }

        // Verificar correo duplicado
        const usuarioExistente = await Usuario.findOne({ correo });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: "El correo electrónico ya está registrado"
            });
        }

        const nuevoUsuario = new Usuario({
            nombre,
            apellidos,
            correo,
            password,
            rol
        });

        const usuarioGuardado = await nuevoUsuario.save();

        res.status(201).json({
            success: true,
            usuario: usuarioGuardado
        });

    } catch (error) {
        console.error("Error creando usuario:", error);
        res.status(500).json({
            success: false,
            message: "Error al crear usuario",
            error: error.message
        });
    }
});

// READ ALL
router.get("/", async (req, res) => {
    try {
        const usuarios = await Usuario.find().select("-password");
        res.json({ success: true, usuarios });
    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener usuarios",
            error: error.message
        });
    }
});

// READ ONE
router.get("/:id", async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select("-password");

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        res.json({ success: true, usuario });

    } catch (error) {
        console.error("Error obteniendo usuario:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener usuario",
            error: error.message
        });
    }
});

// UPDATE
router.put("/:id", async (req, res) => {
    try {
        // Evitar sobrescribir contraseña si no viene
        if (!req.body.password) {
            delete req.body.password;
        }

        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select("-password");

        if (!usuarioActualizado) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        res.json({
            success: true,
            usuario: usuarioActualizado
        });

    } catch (error) {
        console.error("Error actualizando usuario:", error);
        res.status(500).json({
            success: false,
            message: "Error al actualizar usuario",
            error: error.message
        });
    }
});

// DELETE
router.delete("/:id", async (req, res) => {
    try {
        const usuarioEliminado = await Usuario.findByIdAndDelete(req.params.id);

        if (!usuarioEliminado) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        res.json({
            success: true,
            message: "Usuario eliminado exitosamente"
        });

    } catch (error) {
        console.error("Error eliminando usuario:", error);
        res.status(500).json({
            success: false,
            message: "Error al eliminar usuario",
            error: error.message
        });
    }
});

module.exports = router;

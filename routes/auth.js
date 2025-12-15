const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuario"); // tu modelo de usuarios

// GET /api/auth/test - Ruta de prueba
router.get("/test", (req, res) => {
    res.json({ success: true, message: "Ruta de auth funcionando correctamente" });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ success: false, message: "Datos incompletos" });
    }

    try {
        const usuario = await Usuario.findOne({ correo });

        if (!usuario || usuario.password !== password) {
            return res.status(401).json({ success: false, message: "Correo o contraseña incorrectos" });
        }

        // Retornamos el usuario (puedes omitir la contraseña)
        const { _id, nombre, apellidos, rol } = usuario;
        res.json({ success: true, usuario: { _id, nombre, apellidos, rol, correo } });

    } catch (err) {
        console.error("Error en login:", err);
        console.error("Stack trace:", err.stack);
        
        // Verificar si hay error de conexión a MongoDB
        if (err.name === 'MongoServerError' || err.name === 'MongoNetworkError') {
            return res.status(503).json({ 
                success: false, 
                message: "Error de conexión con la base de datos. Por favor, verifica que MongoDB esté corriendo."
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: "Error interno del servidor",
            error: err.message 
        });
    }
});

// POST /api/auth/registro
router.post("/registro", async (req, res) => {
    const { nombre, apellidos, correo, password } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellidos || !correo || !password) {
        return res.status(400).json({ 
            success: false, 
            message: "Todos los campos son requeridos" 
        });
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        return res.status(400).json({ 
            success: false, 
            message: "El formato del correo electrónico no es válido" 
        });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: "La contraseña debe tener al menos 6 caracteres" 
        });
    }

    try {
        // Verificar si el correo ya existe
        const usuarioExistente = await Usuario.findOne({ correo });
        
        if (usuarioExistente) {
            return res.status(400).json({ 
                success: false, 
                message: "Este correo electrónico ya está registrado" 
            });
        }

        // Crear nuevo usuario
        const nuevoUsuario = new Usuario({
            nombre,
            apellidos,
            correo,
            password // En producción, deberías hashear la contraseña con bcrypt
        });

        const usuarioGuardado = await nuevoUsuario.save();

        // Retornar usuario sin la contraseña
        const { _id } = usuarioGuardado;
        res.status(201).json({ 
            success: true, 
            message: "Usuario registrado exitosamente",
            usuario: { _id, nombre, apellidos, correo } 
        });

    } catch (err) {
        console.error("Error en registro:", err);
        console.error("Stack trace:", err.stack);
        
        // Verificar si hay error de conexión a MongoDB
        if (err.name === 'MongoServerError' || err.name === 'MongoNetworkError') {
            return res.status(503).json({ 
                success: false, 
                message: "Error de conexión con la base de datos. Por favor, verifica que MongoDB esté corriendo."
            });
        }
        
        // Manejar error de duplicado de MongoDB
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: "Este correo electrónico ya está registrado" 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: "Error al registrar usuario",
            error: err.message 
        });
    }
});

module.exports = router;

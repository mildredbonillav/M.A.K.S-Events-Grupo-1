const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const AsistenciaEvento = require("../models/asistencia_eventos");
const CompraEntrada = require("../models/compras_entradas");
const Evento = require("../models/eventos");
const Usuario = require("../models/Usuario");

// GET /api/asistencia/eventos - Obtener todos los eventos disponibles
router.get("/eventos", async (req, res) => {
    try {
        const eventos = await Evento.find({})
            .select("nombre fecha lugar")
            .sort({ fecha: -1 });

        res.json({ success: true, eventos });
    } catch (error) {
        console.error("Error obteniendo eventos:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener eventos",
            error: error.message 
        });
    }
});

// GET /api/asistencia/participantes/:evento_id - Obtener participantes de un evento
router.get("/participantes/:evento_id", async (req, res) => {
    try {
        const { evento_id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(evento_id)) {
            return res.status(400).json({ 
                success: false, 
                message: "ID de evento inválido" 
            });
        }

        // Obtener todas las compras de entradas para este evento
        const compras = await CompraEntrada.find({
            evento_id: new mongoose.Types.ObjectId(evento_id)
        }).distinct("usuario_id");

        if (compras.length === 0) {
            return res.json({ 
                success: true, 
                participantes: [],
                message: "No hay participantes registrados para este evento" 
            });
        }

        // Obtener información de los usuarios que compraron entradas
        const participantes = await Usuario.find({
            _id: { $in: compras }
        }).select("nombre apellidos correo");

        // Obtener el estado de asistencia de cada participante
        const asistencias = await AsistenciaEvento.find({
            evento_id: new mongoose.Types.ObjectId(evento_id),
            usuario_id: { $in: compras }
        });

        // Crear un mapa de asistencia para acceso rápido
        const asistenciaMap = {};
        asistencias.forEach(a => {
            asistenciaMap[a.usuario_id.toString()] = a.asistio;
        });

        // Combinar información de usuario con estado de asistencia
        const participantesConAsistencia = participantes.map(participante => ({
            _id: participante._id,
            nombre: participante.nombre,
            apellidos: participante.apellidos,
            correo: participante.correo,
            asistio: asistenciaMap[participante._id.toString()] || false
        }));

        res.json({ 
            success: true, 
            participantes: participantesConAsistencia 
        });

    } catch (error) {
        console.error("Error obteniendo participantes:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener participantes",
            error: error.message 
        });
    }
});

// POST /api/asistencia/registrar - Registrar o actualizar asistencia
router.post("/registrar", async (req, res) => {
    try {
        const { evento_id, usuario_id, asistio } = req.body;

        if (!evento_id || !usuario_id || typeof asistio !== 'boolean') {
            return res.status(400).json({ 
                success: false, 
                message: "Datos incompletos. Se requiere evento_id, usuario_id y asistio (boolean)" 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(evento_id) || !mongoose.Types.ObjectId.isValid(usuario_id)) {
            return res.status(400).json({ 
                success: false, 
                message: "IDs inválidos" 
            });
        }

        // Verificar que el usuario haya comprado entradas para este evento
        const compra = await CompraEntrada.findOne({
            evento_id: new mongoose.Types.ObjectId(evento_id),
            usuario_id: new mongoose.Types.ObjectId(usuario_id)
        });

        if (!compra) {
            return res.status(400).json({ 
                success: false, 
                message: "El usuario no tiene entradas compradas para este evento" 
            });
        }

        // Buscar o crear registro de asistencia
        const asistencia = await AsistenciaEvento.findOneAndUpdate(
            {
                evento_id: new mongoose.Types.ObjectId(evento_id),
                usuario_id: new mongoose.Types.ObjectId(usuario_id)
            },
            {
                asistio: asistio,
                fecha_registro: new Date()
            },
            {
                new: true,
                upsert: true // Crear si no existe
            }
        );

        res.json({ 
            success: true, 
            message: asistio ? "Asistencia registrada" : "Ausencia registrada",
            asistencia 
        });

    } catch (error) {
        console.error("Error registrando asistencia:", error);
        
        // Manejar error de duplicado (aunque no debería pasar con upsert)
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: "Ya existe un registro de asistencia para este usuario y evento" 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: "Error al registrar asistencia",
            error: error.message 
        });
    }
});

// POST /api/asistencia/registrar-multiple - Registrar asistencia de múltiples usuarios
router.post("/registrar-multiple", async (req, res) => {
    try {
        const { evento_id, asistencias } = req.body; // asistencias es un array de {usuario_id, asistio}

        if (!evento_id || !Array.isArray(asistencias) || asistencias.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Datos incompletos. Se requiere evento_id y array de asistencias" 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(evento_id)) {
            return res.status(400).json({ 
                success: false, 
                message: "ID de evento inválido" 
            });
        }

        const resultados = [];
        const errores = [];

        for (const item of asistencias) {
            try {
                const { usuario_id, asistio } = item;

                if (!usuario_id || typeof asistio !== 'boolean') {
                    errores.push({ usuario_id, error: "Datos incompletos" });
                    continue;
                }

                if (!mongoose.Types.ObjectId.isValid(usuario_id)) {
                    errores.push({ usuario_id, error: "ID de usuario inválido" });
                    continue;
                }

                // Verificar que el usuario haya comprado entradas
                const compra = await CompraEntrada.findOne({
                    evento_id: new mongoose.Types.ObjectId(evento_id),
                    usuario_id: new mongoose.Types.ObjectId(usuario_id)
                });

                if (!compra) {
                    errores.push({ usuario_id, error: "Usuario no tiene entradas para este evento" });
                    continue;
                }

                // Registrar asistencia
                const asistencia = await AsistenciaEvento.findOneAndUpdate(
                    {
                        evento_id: new mongoose.Types.ObjectId(evento_id),
                        usuario_id: new mongoose.Types.ObjectId(usuario_id)
                    },
                    {
                        asistio: asistio,
                        fecha_registro: new Date()
                    },
                    {
                        new: true,
                        upsert: true
                    }
                );

                resultados.push({ usuario_id, success: true, asistencia });

            } catch (error) {
                errores.push({ usuario_id: item.usuario_id, error: error.message });
            }
        }

        res.json({ 
            success: true, 
            message: `Procesadas ${resultados.length} asistencias${errores.length > 0 ? `, ${errores.length} errores` : ''}`,
            resultados,
            errores: errores.length > 0 ? errores : undefined
        });

    } catch (error) {
        console.error("Error registrando asistencias múltiples:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al registrar asistencias",
            error: error.message 
        });
    }
});

module.exports = router;


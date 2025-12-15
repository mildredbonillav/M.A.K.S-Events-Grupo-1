const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const CompraEntrada = require("../models/compras_entradas");
const EventoEntrada = require("../models/eventos_entradas"); // para actualizar stock
const Evento = require("../models/eventos");

router.post("/comprar", async (req, res) => {
    try {
        const { evento_id, tipo, cantidad, usuario_id } = req.body;

        if(!evento_id || !tipo || !cantidad || !usuario_id) {
            return res.status(400).json({ success: false, message: "Datos incompletos" });
        }

        const entrada = await EventoEntrada.findOne({
            evento_id: new mongoose.Types.ObjectId(evento_id),
            tipo
        });

        if(!entrada) return res.status(404).json({ success: false, message: "Entrada no encontrada" });

        if(entrada.cantidad_disponible < cantidad)
            return res.status(400).json({ success: false, message: "No hay suficientes entradas disponibles" });

        // Registrar la compra
        const compra = new CompraEntrada({
            evento_id: new mongoose.Types.ObjectId(evento_id),
            tipo,
            cantidad,
            usuario_id: new mongoose.Types.ObjectId(usuario_id),
            fecha: new Date()
        });

        await compra.save(); //sin save no se inserta

        // Actualizar stock
        entrada.cantidad_disponible -= cantidad;
        await entrada.save();

        res.json({ success: true, message: "Compra registrada", compra });
    } catch (error) {
        console.error("Error registrando compra:", error);
        res.status(500).json({ success: false, message: "Error interno" });
    }
});

// Ruta para obtener los eventos del usuario con sus compras
router.get("/mis-eventos/:usuario_id", async (req, res) => {
    try {
        const { usuario_id } = req.params;
        
        console.log("🔍 Obteniendo eventos para usuario_id:", usuario_id);

        if (!usuario_id) {
            return res.status(400).json({ 
                success: false, 
                message: "ID de usuario no proporcionado" 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(usuario_id)) {
            console.error("❌ ID de usuario inválido:", usuario_id);
            return res.status(400).json({ 
                success: false, 
                message: `ID de usuario inválido: ${usuario_id}` 
            });
        }

        // Obtener todas las compras del usuario agrupadas por evento
        const eventosConCompras = await CompraEntrada.aggregate([
            // Filtrar compras del usuario
            {
                $match: {
                    usuario_id: new mongoose.Types.ObjectId(usuario_id)
                }
            },
            // Agrupar por evento_id y tipo, sumando cantidades
            {
                $group: {
                    _id: {
                        evento_id: "$evento_id",
                        tipo: "$tipo"
                    },
                    cantidad: { $sum: "$cantidad" },
                    fecha_compra: { $min: "$fecha" }
                }
            },
            // Agrupar por evento_id para tener todos los tipos juntos
            {
                $group: {
                    _id: "$_id.evento_id",
                    compras: {
                        $push: {
                            tipo: "$_id.tipo",
                            cantidad: "$cantidad",
                            fecha_compra: "$fecha_compra"
                        }
                    }
                }
            },
            // Hacer lookup del evento completo
            {
                $lookup: {
                    from: "eventos",
                    localField: "_id",
                    foreignField: "_id",
                    as: "evento"
                }
            },
            // Desenrollar el array de evento (debería ser solo uno)
            {
                $unwind: {
                    path: "$evento",
                    preserveNullAndEmptyArrays: true
                }
            },
            // Traer categoría
            {
                $lookup: {
                    from: "categorias_eventos",
                    localField: "evento.categoria_id",
                    foreignField: "_id",
                    as: "categoria"
                }
            },
            // Traer organizador
            {
                $lookup: {
                    from: "organizadores",
                    localField: "evento.organizador_id",
                    foreignField: "_id",
                    as: "organizador"
                }
            },
            // Traer precios de las entradas para calcular totales
            {
                $lookup: {
                    from: "eventos_entradas",
                    localField: "_id",
                    foreignField: "evento_id",
                    as: "entradas_info"
                }
            },
            // Agregar precio a cada compra
            {
                $addFields: {
                    compras: {
                        $map: {
                            input: "$compras",
                            as: "compra",
                            in: {
                                $mergeObjects: [
                                    "$$compra",
                                    {
                                        precio: {
                                            $let: {
                                                vars: {
                                                    entradaEncontrada: {
                                                        $arrayElemAt: [
                                                            {
                                                                $filter: {
                                                                    input: "$entradas_info",
                                                                    cond: {
                                                                        $and: [
                                                                            { $eq: ["$$this.tipo", "$$compra.tipo"] }
                                                                        ]
                                                                    }
                                                                }
                                                            },
                                                            0
                                                        ]
                                                    }
                                                },
                                                in: "$$entradaEncontrada.precio"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    categoria: { $arrayElemAt: ["$categoria", 0] },
                    organizador: { $arrayElemAt: ["$organizador", 0] }
                }
            },
            // Calcular total por compra y total general del evento
            {
                $addFields: {
                    compras: {
                        $map: {
                            input: "$compras",
                            as: "compra",
                            in: {
                                $mergeObjects: [
                                    "$$compra",
                                    {
                                        total: {
                                            $multiply: [
                                                { $ifNull: ["$$compra.precio", 0] },
                                                "$$compra.cantidad"
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    total_evento: {
                        $reduce: {
                            input: "$compras",
                            initialValue: 0,
                            in: {
                                $add: [
                                    "$$value",
                                    {
                                        $multiply: [
                                            { $ifNull: ["$$this.precio", 0] },
                                            "$$this.cantidad"
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            // Ordenar por fecha del evento (más recientes primero)
            {
                $sort: { "evento.fecha": -1 }
            }
        ]);

        console.log(`✅ Encontrados ${eventosConCompras.length} eventos para el usuario ${usuario_id}`);

        res.json({ 
            success: true, 
            eventos: eventosConCompras 
        });

    } catch (error) {
        console.error("❌ Error obteniendo eventos del usuario:", error);
        console.error("Stack trace:", error.stack);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener eventos del usuario",
            error: error.message 
        });
    }
});

module.exports = router;

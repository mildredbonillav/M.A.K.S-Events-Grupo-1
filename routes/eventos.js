const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Modelos
const Evento = require("../models/eventos");
const EventoEntrada = require("../models/eventos_entradas");
const EventoArtista = require("../models/eventos_artistas");
const Artista = require("../models/artistas");
const CategoriaEvento = require("../models/categorias_eventos");
const Organizador = require("../models/organizadores");



// Ruta para obtener eventos disponibles
router.get("/disponibles", async (req, res) => {
    try {
        // Aggregate para traer todo
        const eventos = await Evento.aggregate([
            // Traer entradas
            {
                $lookup: {
                    from: "eventos_entradas",
                    localField: "_id",
                    foreignField: "evento_id",
                    as: "entradas"
                }
            },
            // Traer categoría
            {
                $lookup: {
                    from: "categorias_eventos",
                    localField: "categoria_id",
                    foreignField: "_id",
                    as: "categoria"
                }
            },
            // Traer organizador
            {
                $lookup: {
                    from: "organizadores",
                    localField: "organizador_id",
                    foreignField: "_id",
                    as: "organizador"
                }
            },
            // Traer relación evento-artistas
            {
                $lookup: {
                    from: "eventos_artistas",
                    localField: "_id",
                    foreignField: "evento_id",
                    as: "eventos_artistas"
                }
            },
            // Traer artistas finales
            {
                $lookup: {
                    from: "artistas",
                    localField: "eventos_artistas.artista_id",
                    foreignField: "_id",
                    as: "artistas"
                }
            },
            // Tomar primer elemento de arrays de categoría y organizador
            {
                $addFields: {
                    categoria: { $arrayElemAt: ["$categoria", 0] },
                    organizador: { $arrayElemAt: ["$organizador", 0] }
                }
            }
        ]);

        res.json(eventos);
    } catch (error) {
        console.error("Error cargando eventos:", error);
        res.status(500).json({ error: "Error cargando eventos" });
    }
});



router.post("/", async (req, res) => {
    try {
        const { categoria_id, nombre, descripcion, lugar, fecha, organizador_id, artistas, entradas } = req.body;

        // Validar campos requeridos
        if (!nombre || !fecha || !organizador_id) {
            return res.status(400).json({ 
                success: false, 
                message: "Nombre, fecha y organizador son requeridos" 
            });
        }

        // Crear el evento principal
        const nuevoEvento = new Evento({
            categoria_id: categoria_id ? new mongoose.Types.ObjectId(categoria_id) : null,
            nombre,
            descripcion: descripcion || "",
            lugar: lugar || "",
            fecha: new Date(fecha),
            organizador_id: new mongoose.Types.ObjectId(organizador_id)
        });

        const eventoGuardado = await nuevoEvento.save();

        // Guardar artistas si existen
        if (artistas && Array.isArray(artistas) && artistas.length > 0) {
            const artistasPromises = artistas.map(artista_id => {
                const eventoArtista = new EventoArtista({
                    evento_id: eventoGuardado._id,
                    artista_id: new mongoose.Types.ObjectId(artista_id)
                });
                return eventoArtista.save();
            });
            await Promise.all(artistasPromises);
        }

        // Guardar entradas si existen
        if (entradas && Array.isArray(entradas) && entradas.length > 0) {
            const entradasPromises = entradas.map(entrada => {
                const eventoEntrada = new EventoEntrada({
                    evento_id: eventoGuardado._id,
                    tipo: entrada.tipo,
                    cantidad_disponible: entrada.cantidad_disponible,
                    precio: entrada.precio
                });
                return eventoEntrada.save();
            });
            await Promise.all(entradasPromises);
        }

        res.status(201).json({ 
            success: true, 
            message: "Evento creado exitosamente",
            evento: eventoGuardado 
        });

    } catch (error) {
        console.error("Error creando evento:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al crear el evento",
            error: error.message 
        });
    }
});

router.get("/", async (req, res) => {
    try {
        const eventos = await Evento.aggregate([
            // Traer entradas
            {
                $lookup: {
                    from: "eventos_entradas",
                    localField: "_id",
                    foreignField: "evento_id",
                    as: "entradas"
                }
            },
            // Traer categoría
            {
                $lookup: {
                    from: "categorias_eventos",
                    localField: "categoria_id",
                    foreignField: "_id",
                    as: "categoria"
                }
            },
            // Traer organizador
            {
                $lookup: {
                    from: "organizadores",
                    localField: "organizador_id",
                    foreignField: "_id",
                    as: "organizador"
                }
            },
            // Traer relación evento-artistas
            {
                $lookup: {
                    from: "eventos_artistas",
                    localField: "_id",
                    foreignField: "evento_id",
                    as: "eventos_artistas"
                }
            },
            // Traer artistas finales
            {
                $lookup: {
                    from: "artistas",
                    localField: "eventos_artistas.artista_id",
                    foreignField: "_id",
                    as: "artistas"
                }
            },
            // Convertir arrays de un elemento a objetos
            {
                $addFields: {
                    categoria: { $arrayElemAt: ["$categoria", 0] },
                    organizador: { $arrayElemAt: ["$organizador", 0] }
                }
            }
        ]);

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

router.get("/:id", async (req, res) => {
    try {
        const eventoId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(eventoId)) {
            return res.status(400).json({ 
                success: false, 
                message: "ID de evento inválido" 
            });
        }

        const evento = await Evento.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(eventoId) } },
            {
                $lookup: {
                    from: "eventos_entradas",
                    localField: "_id",
                    foreignField: "evento_id",
                    as: "entradas"
                }
            },
            {
                $lookup: {
                    from: "categorias_eventos",
                    localField: "categoria_id",
                    foreignField: "_id",
                    as: "categoria"
                }
            },
            {
                $lookup: {
                    from: "organizadores",
                    localField: "organizador_id",
                    foreignField: "_id",
                    as: "organizador"
                }
            },
            {
                $lookup: {
                    from: "eventos_artistas",
                    localField: "_id",
                    foreignField: "evento_id",
                    as: "eventos_artistas"
                }
            },
            {
                $lookup: {
                    from: "artistas",
                    localField: "eventos_artistas.artista_id",
                    foreignField: "_id",
                    as: "artistas"
                }
            },
            {
                $addFields: {
                    categoria: { $arrayElemAt: ["$categoria", 0] },
                    organizador: { $arrayElemAt: ["$organizador", 0] }
                }
            }
        ]);

        if (!evento || evento.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Evento no encontrado" 
            });
        }

        res.json({ success: true, evento: evento[0] });
    } catch (error) {
        console.error("Error obteniendo evento:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener el evento",
            error: error.message 
        });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const eventoId = req.params.id;
        const { categoria_id, nombre, descripcion, lugar, fecha, organizador_id, artistas, entradas } = req.body;

        if (!mongoose.Types.ObjectId.isValid(eventoId)) {
            return res.status(400).json({ 
                success: false, 
                message: "ID de evento inválido" 
            });
        }

        // Actualizar datos básicos del evento
        const datosActualizados = {
            nombre,
            descripcion,
            lugar,
            fecha: new Date(fecha)
        };

        if (categoria_id) {
            datosActualizados.categoria_id = new mongoose.Types.ObjectId(categoria_id);
        }

        if (organizador_id) {
            datosActualizados.organizador_id = new mongoose.Types.ObjectId(organizador_id);
        }

        const eventoActualizado = await Evento.findByIdAndUpdate(
            eventoId,
            datosActualizados,
            { new: true, runValidators: true }
        );

        if (!eventoActualizado) {
            return res.status(404).json({ 
                success: false, 
                message: "Evento no encontrado" 
            });
        }

        // Actualizar artistas si se enviaron
        if (artistas && Array.isArray(artistas)) {
            // Eliminar artistas actuales
            await EventoArtista.deleteMany({ evento_id: eventoId });
            
            // Agregar nuevos artistas
            if (artistas.length > 0) {
                const artistasPromises = artistas.map(artista_id => {
                    const eventoArtista = new EventoArtista({
                        evento_id: eventoId,
                        artista_id: new mongoose.Types.ObjectId(artista_id)
                    });
                    return eventoArtista.save();
                });
                await Promise.all(artistasPromises);
            }
        }

        // Actualizar entradas si se enviaron
        if (entradas && Array.isArray(entradas)) {
            // Eliminar entradas actuales
            await EventoEntrada.deleteMany({ evento_id: eventoId });
            
            // Agregar nuevas entradas
            if (entradas.length > 0) {
                const entradasPromises = entradas.map(entrada => {
                    const eventoEntrada = new EventoEntrada({
                        evento_id: eventoId,
                        tipo: entrada.tipo,
                        cantidad_disponible: entrada.cantidad_disponible,
                        precio: entrada.precio
                    });
                    return eventoEntrada.save();
                });
                await Promise.all(entradasPromises);
            }
        }

        res.json({ 
            success: true, 
            message: "Evento actualizado exitosamente",
            evento: eventoActualizado 
        });

    } catch (error) {
        console.error("Error actualizando evento:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al actualizar el evento",
            error: error.message 
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const eventoId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(eventoId)) {
            return res.status(400).json({ 
                success: false, 
                message: "ID de evento inválido" 
            });
        }

        // Eliminar relaciones
        await EventoArtista.deleteMany({ evento_id: eventoId });
        await EventoEntrada.deleteMany({ evento_id: eventoId });

        // Eliminar el evento
        const eventoEliminado = await Evento.findByIdAndDelete(eventoId);

        if (!eventoEliminado) {
            return res.status(404).json({ 
                success: false, 
                message: "Evento no encontrado" 
            });
        }

        res.json({ 
            success: true, 
            message: "Evento eliminado exitosamente" 
        });

    } catch (error) {
        console.error("Error eliminando evento:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al eliminar el evento",
            error: error.message 
        });
    }
});
module.exports = router;
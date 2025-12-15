const mongoose = require("mongoose");
const Evento = require("./models/eventos");
const EventoEntrada = require("./models/eventos_entradas");

const MONGODB_URI = process.env.MONGODB_URI || 
"mongodb+srv://tatibonillav:mq6crdkdmD2UsoDh@maks-events.inoydea.mongodb.net/MAKS_Events?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✔ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error de conexión:", err));

async function testEventos() {
    try {
        // Traer todos los eventos
        const eventos = await Evento.find({});
        console.log("Eventos encontrados:", eventos);

        if (eventos.length > 0) {
            // Traer entradas del primer evento
            const entradas = await EventoEntrada.find({ evento_id: eventos[0]._id });
            console.log("Entradas del primer evento:", entradas);
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        mongoose.connection.close();
    }
}

testEventos();

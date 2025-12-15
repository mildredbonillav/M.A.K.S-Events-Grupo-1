require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Rutas
const usuariosRoutes = require('./routes/usuarios');
const eventosRoutes = require('./routes/eventos');
const comprasRoutes = require('./routes/compras');
const authRouter = require("./routes/auth");
const artistasRoutes = require('./routes/artistas');
const organizadoresRoutes = require('./routes/organizadores');
const categoriasEventosRoutes = require('./routes/categoriasEventos');
const asistenciaRoutes = require('./routes/asistencia');
const comentariosRoutes = require('./routes/comentarios');
const notificacionesRoutes = require('./routes/notificaciones');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI no está definida en .env');
  console.warn('   Usando localhost como fallback (solo para desarrollo local)');
}

const connectionString = MONGODB_URI || 'mongodb://localhost:27017/maks_events';

mongoose.connect(connectionString)
  .then(() => {
    if (MONGODB_URI) {
      console.log('✔ Conectado a MongoDB Atlas');
    } else {
      console.log('✔ Conectado a MongoDB local');
    }
  })
  .catch(err => {
    console.error('❌ Error de conexión:', err.message);
    console.error('   Verifica tu cadena de conexión en el archivo .env');
  });

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static('public'));

// Rutas de la API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/compras', comprasRoutes);
app.use("/api/auth", authRouter);
app.use('/api/artistas', artistasRoutes);
app.use('/api/organizadores', organizadoresRoutes);
app.use('/api/categorias-eventos', categoriasEventosRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/comentarios', comentariosRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
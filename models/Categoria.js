const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: true
  },
  nombre: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Categoria', categoriaSchema, 'categorias');

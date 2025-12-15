const mongoose = require("mongoose");

const ComentarioSchema = new mongoose.Schema(
  {
    usuario: {
  type: mongoose.Types.ObjectId,
  ref: "Usuario",
  required: true
},


    evento: { type: String, required: true, trim: true },

    evento_id: { type: mongoose.Types.ObjectId, ref: "Evento", required: false },

    comentario: { type: String, required: true, trim: true },
    calificacion: { type: Number, required: true, min: 1, max: 5 }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Comentario ||
  mongoose.model("Comentario", ComentarioSchema, "comentarios");

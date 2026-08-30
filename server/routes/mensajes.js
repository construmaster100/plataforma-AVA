const express = require("express");
const router = express.Router();
const Mensaje = require("../models/Mensaje");
const { enviarCorreo } = require("../services/mailer");

// Envía un mensaje entre roles y, si se indica correoDestino, notifica
// también por correo electrónico real. El correo es best-effort: si
// falla o no hay SMTP configurado, el mensaje igual queda guardado.
router.post("/", async (req, res) => {
  try {
    const { de, deRol, para, paraRol, asunto, cuerpo, correoDestino } = req.body;
    if (!de || !deRol || !para || !paraRol || !cuerpo) {
      return res.status(400).json({ error: "de, deRol, para, paraRol y cuerpo son obligatorios" });
    }

    const mensaje = await Mensaje.create({ de, deRol, para, paraRol, asunto, cuerpo });

    if (correoDestino) {
      const resultado = await enviarCorreo({
        to: correoDestino,
        subject: asunto || `Nuevo mensaje de ${de} — SGMA-ADSO`,
        html:
          `<p><strong>${de}</strong> (${deRol}) te escribió en SGMA-ADSO:</p>` +
          `<p>${cuerpo}</p>`,
      });
      mensaje.correoEnviado = resultado.ok;
      await mensaje.save();
    }

    res.status(201).json(mensaje);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bandeja de un rol: lo que le llega o lo que envió, más reciente primero.
router.get("/", async (req, res) => {
  try {
    const { rol } = req.query;
    if (!rol) return res.status(400).json({ error: "rol es obligatorio" });

    const mensajes = await Mensaje.find({ $or: [{ paraRol: rol }, { deRol: rol }] })
      .sort({ createdAt: -1 });
    res.json(mensajes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/leido", async (req, res) => {
  try {
    const mensaje = await Mensaje.findByIdAndUpdate(req.params.id, { leido: true }, { new: true });
    if (!mensaje) return res.status(404).json({ error: "Mensaje no encontrado" });
    res.json(mensaje);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

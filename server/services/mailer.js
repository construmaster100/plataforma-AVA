const nodemailer = require("nodemailer");

/* Envío de correo real (SMTP), configurado por variables de entorno:
   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (opcional).
   Si no están configuradas, no falla: registra un aviso y devuelve
   { ok:false } — mismo criterio best-effort que el resto del sistema
   (ver tablero.js en el frontend, que reporta a la API envuelto en
   try/catch y sigue funcionando si el servidor no responde). */

let transportador = null;
let avisado = false;

function obtenerTransportador() {
  if (transportador) return transportador;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  transportador = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transportador;
}

async function enviarCorreo({ to, subject, html, text }) {
  if (!to) return { ok: false, error: "Sin destinatario" };

  const transporte = obtenerTransportador();
  if (!transporte) {
    if (!avisado) {
      console.warn(
        "[mailer] SMTP no configurado (faltan SMTP_HOST/SMTP_USER/SMTP_PASS en .env) — " +
        "los correos no se envían, pero el resto del sistema sigue funcionando."
      );
      avisado = true;
    }
    return { ok: false, error: "SMTP no configurado" };
  }

  try {
    const info = await transporte.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || String(html || "").replace(/<[^>]+>/g, " "),
    });
    return { ok: true, id: info.messageId };
  } catch (err) {
    console.error("[mailer] Error enviando correo:", err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { enviarCorreo };

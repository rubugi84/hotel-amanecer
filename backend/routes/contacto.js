const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const {pool} = require("../config/database");

// Configurar transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Obtener datos del hotel desde la BD
const obtenerDatosHotel = async () => {
  try {
    const claves = [
      "footer_nombre",
      "footer_direccion",
      "footer_telefono",
      "footer_email_normal",
      "footer_slogan",
    ];

    const result = await pool.query(
      `SELECT clave, valor FROM contenido_web WHERE clave = ANY($1)`,
      [claves],
    );

    const datos = {};
    result.rows.forEach((row) => {
      datos[row.clave] = row.valor;
    });

    return {
      nombre: datos.footer_nombre || "Hotel Amanecer en Campos",
      direccion: datos.footer_direccion || "Camino del Molino, 1",
      telefono: datos.footer_telefono || "+34 123456789",
      email: datos.footer_email_normal || "info@hotelamanecer.es",
      slogan:
        datos.footer_slogan ||
        "Un lugar donde la naturaleza y el confort se encuentran",
    };
  } catch (error) {
    console.error("❌ Error al obtener datos del hotel:", error);
    return {
      nombre: "Hotel Amanecer en Campos",
      direccion: "Camino del Molino, 1",
      telefono: "+34 123456789",
      email: "info@hotelamanecer.es",
      slogan: "Un lugar donde la naturaleza y el confort se encuentran",
    };
  }
};

// Función para formatear horario
const formatearHorario = (horario) => {
  const map = {
    manana: "mañana (9:00 - 14:00)",
    tarde: "tarde (14:00 - 18:00)",
    noche: "noche (18:00 - 21:00)",
    indistinto: "indistinto",
  };
  return map[horario] || horario;
};

const formatearFormaContacto = (forma) => {
  const map = {
    telefono: "teléfono",
    email: "email",
    indistinto: "indistinto",
  };
  return map[forma] || forma;
};

// Ruta para enviar mensaje de contacto
router.post("/enviar", async (req, res) => {
  try {
    const {nombre, email, telefono, mensaje, formaContacto, horarioContacto} =
      req.body;

    // Validar datos
    if (!nombre || !email || !telefono || !mensaje) {
      return res
        .status(400)
        .json({mensaje: "Todos los campos son obligatorios"});
    }

    // Validar email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({mensaje: "Email no válido"});
    }

    if (mensaje.length < 10) {
      return res
        .status(400)
        .json({mensaje: "El mensaje debe tener al menos 10 caracteres"});
    }

    // Obtener datos del hotel
    const hotel = await obtenerDatosHotel();

    // 1. ENVIAR EMAIL AL HOTEL (avisando de nuevo mensaje)
    const htmlHotel = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f6f2; padding: 20px; border-radius: 10px;">
        <h2 style="color: #8B7355;">📩 Nuevo mensaje de contacto</h2>
        <p><strong>Hotel:</strong> ${hotel.nombre}</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #8B7355;">Datos del contacto</h3>
          <p><strong>Nombre:</strong> ${nombre}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Teléfono:</strong> ${telefono}</p>
          <p><strong>Forma de contacto preferida:</strong> ${formatearFormaContacto(formaContacto)}</p>
          <p><strong>Horario preferido:</strong> ${formatearHorario(horarioContacto)}</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #8B7355;">📝 Mensaje</h3>
          <p style="white-space: pre-wrap;">${mensaje}</p>
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
          <p><strong>${hotel.nombre}</strong></p>
          <p>📍 ${hotel.direccion}</p>
          <p>📞 ${hotel.telefono}</p>
        </div>
      </div>
    `;

    const mailHotel = {
      from: `"${hotel.nombre}" <${process.env.EMAIL_USER}>`,
      to: hotel.email,
      subject: `📩 Nuevo mensaje de contacto - ${nombre}`,
      html: htmlHotel,
    };

    await transporter.sendMail(mailHotel);

    // 2. ENVIAR EMAIL AL CLIENTE (confirmación de recepción)
    const htmlCliente = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f0eb; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #8B7355; padding-bottom: 20px; }
          .header h1 { color: #8B7355; margin: 0; }
          .header .hotel-name { color: #8B7355; font-size: 20px; font-weight: bold; margin: 5px 0; }
          .header .slogan { color: #999; font-style: italic; font-size: 14px; }
          .success-banner { background: #d4edda; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #28a745; }
          .success-banner .icon { font-size: 48px; display: block; margin-bottom: 10px; }
          .success-banner h2 { color: #155724; margin: 0; }
          .success-banner p { color: #155724; margin: 5px 0; }
          .detail-block { background: #f9f6f2; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-block h3 { color: #8B7355; margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #8B7355; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
          .btn:hover { background: #6d5a42; }
          .certificaciones { display: flex; justify-content: center; gap: 15px; margin-top: 10px; flex-wrap: wrap; }
          .certificacion { background: #e8d5c4; padding: 3px 12px; border-radius: 12px; font-size: 11px; color: #6d5a42; }
          .mensaje-resumen { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #8B7355; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- HEADER -->
          <div class="header">
            <h1>📩 ¡Mensaje recibido!</h1>
            <p class="hotel-name">${hotel.nombre}</p>
            <p class="slogan">"${hotel.slogan}"</p>
            <div class="certificaciones">
              <span class="certificacion">⭐ Calidad Turística</span>
              <span class="certificacion">⭐ Recomendado 2025</span>
            </div>
          </div>

          <!-- BANNER DE ÉXITO -->
          <div class="success-banner">
            <span class="icon">✅</span>
            <h2>¡Hemos recibido tu mensaje!</h2>
            <p>Gracias por contactar con nosotros, ${nombre}.</p>
            <p style="font-size: 14px;">Te responderemos a la mayor brevedad posible.</p>
          </div>

          <!-- RESUMEN DEL MENSAJE -->
          <div class="detail-block">
            <h3>📋 Resumen de tu mensaje</h3>
            <div class="detail-row">
              <span>👤 Nombre</span>
              <span><strong>${nombre}</strong></span>
            </div>
            <div class="detail-row">
              <span>📧 Email</span>
              <span><strong>${email}</strong></span>
            </div>
            <div class="detail-row">
              <span>📞 Teléfono</span>
              <span><strong>${telefono}</strong></span>
            </div>
            <div class="detail-row">
              <span>📞 Forma de contacto</span>
              <span><strong>${formatearFormaContacto(formaContacto)}</strong></span>
            </div>
            <div class="detail-row">
              <span>🕐 Horario preferido</span>
              <span><strong>${formatearHorario(horarioContacto)}</strong></span>
            </div>
          </div>

          <!-- MENSAJE -->
          <div class="mensaje-resumen">
            <p style="margin: 0; font-weight: bold; color: #8B7355;">📝 Tu mensaje:</p>
            <p style="margin: 10px 0 0 0; white-space: pre-wrap; color: #555;">${mensaje}</p>
          </div>

          <!-- INFORMACIÓN DEL HOTEL -->
          <div class="detail-block">
            <h3>📍 Información del hotel</h3>
            <div class="detail-row">
              <span>📌 Dirección</span>
              <span><strong>${hotel.direccion}</strong></span>
            </div>
            <div class="detail-row">
              <span>📞 Teléfono</span>
              <span><strong>${hotel.telefono}</strong></span>
            </div>
            <div class="detail-row">
              <span>📧 Email</span>
              <span><strong>${hotel.email}</strong></span>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="footer">
            <p><strong>${hotel.nombre}</strong> © ${new Date().getFullYear()}</p>
            <p style="font-size: 11px; color: #999;">
              Este email es una confirmación de que hemos recibido tu mensaje.<br>
              Nuestro equipo se pondrá en contacto contigo lo antes posible.
            </p>
            <p style="font-size: 11px; color: #999;">
              Si no has sido tú quien ha enviado este mensaje, por favor ignora este email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailCliente = {
      from: `"${hotel.nombre}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Hemos recibido tu mensaje - ${hotel.nombre}`,
      html: htmlCliente,
    };

    await transporter.sendMail(mailCliente);

    // Guardar en base de datos (opcional)
    try {
      await pool.query(
        `INSERT INTO mensajes_contacto (nombre, email, telefono, mensaje, forma_contacto, horario_contacto, fecha) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [nombre, email, telefono, mensaje, formaContacto, horarioContacto],
      );
    } catch (dbError) {
      console.error("❌ Error al guardar mensaje en BD:", dbError);
      // No fallamos la respuesta si no se guarda en BD
    }

    res.json({
      mensaje: "¡Mensaje enviado con éxito! Te contactaremos pronto.",
      exito: true,
    });
  } catch (error) {
    console.error("❌ Error al enviar mensaje de contacto:", error);
    res.status(500).json({
      mensaje:
        "Error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde.",
      exito: false,
    });
  }
});

module.exports = router;

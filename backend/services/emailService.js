const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
dotenv.config();

// ✅ Importar pool para consultar la BD
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

// ✅ Función para obtener datos del hotel desde contenido_web
const obtenerDatosHotel = async () => {
  try {
    const claves = [
      "footer_nombre",
      "footer_direccion",
      "footer_telefono",
      "footer_email_normal",
      "footer_check_in",
      "footer_check_out",
      "footer_slogan",
      "footer_certificacion_1",
      "footer_certificacion_2",
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
      checkIn: datos.footer_check_in || "15:00 – 22:00",
      checkOut: datos.footer_check_out || "12:00",
      slogan:
        datos.footer_slogan ||
        "Un lugar donde la naturaleza y el confort se encuentran",
      certificacion1: datos.footer_certificacion_1 || "",
      certificacion2: datos.footer_certificacion_2 || "",
    };
  } catch (error) {
    console.error("❌ Error al obtener datos del hotel:", error);
    return {
      nombre: "Hotel Amanecer en Campos",
      direccion: "Camino del Molino, 1",
      telefono: "+34 123456789",
      email: "info@hotelamanecer.es",
      checkIn: "15:00 – 22:00",
      checkOut: "12:00",
      slogan: "Un lugar donde la naturaleza y el confort se encuentran",
      certificacion1: "",
      certificacion2: "",
    };
  }
};

const generarQRUrlPublica = (hashSeguro) => {
  const url = `${process.env.FRONTEND_URL || "http://localhost:4200"}/reservas/ver/${hashSeguro}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}&color=8B7355&bgcolor=FFFFFF&margin=10`;
};

// ✅ GENERAR QR COMO BUFFER (También con el hash)
const generarQRBuffer = async (hashSeguro) => {
  try {
    const url = `${process.env.FRONTEND_URL || "http://localhost:4200"}/reservas/ver/${hashSeguro}`;
    const qrBuffer = await QRCode.toBuffer(url, {
      type: "png",
      width: 300,
      margin: 2,
      color: {
        dark: "#8B7355",
        light: "#FFFFFF",
      },
    });
    return qrBuffer;
  } catch (error) {
    console.error("Error al generar QR buffer:", error);
    return null;
  }
};

// ✅ FUNCIÓN AUXILIAR PARA FORMATEAR FECHAS EN ESPAÑOL
const formatearFechaEspañol = (fechaString) => {
  if (!fechaString) return "";
  const fecha = new Date(fechaString);
  if (isNaN(fecha.getTime())) return fechaString;
  const opciones = {year: "numeric", month: "long", day: "numeric"};
  return fecha.toLocaleDateString("es-ES", opciones);
};

// Función para obtener imagen como buffer
const obtenerImagenBuffer = async (imagenPath) => {
  try {
    if (imagenPath.startsWith("http://") || imagenPath.startsWith("https://")) {
      const response = await axios.get(imagenPath, {
        responseType: "arraybuffer",
        timeout: 5000,
      });
      return Buffer.from(response.data);
    }

    let rutaLocal = imagenPath;

    if (imagenPath.startsWith("/uploads")) {
      rutaLocal = path.join(__dirname, "..", imagenPath);
    }

    if (fs.existsSync(rutaLocal)) {
      return fs.readFileSync(rutaLocal);
    }

    const nombreArchivo = path.basename(imagenPath);
    rutaLocal = path.join(
      __dirname,
      "..",
      "uploads",
      "habitaciones",
      nombreArchivo,
    );

    if (fs.existsSync(rutaLocal)) {
      return fs.readFileSync(rutaLocal);
    }

    console.warn(`⚠️ Imagen no encontrada: ${imagenPath}`);
    return null;
  } catch (error) {
    console.error(`❌ Error al obtener imagen ${imagenPath}:`, error.message);
    return null;
  }
};

// Función para enviar email al cliente
const enviarEmailCliente = async (datosReserva, emailHotel) => {
  const {
    habitacion,
    fechas,
    huespedes,
    desayuno,
    cliente,
    importe,
    solicitudEspecial,
    horaEstimadaLlegada,
    codigoReserva, // Código amigable (AMS-...)
    hashSeguro, // ✅ Hash largo (A4F8D9...)
    tokenPrechecking,
  } = datosReserva;

  const hotel = await obtenerDatosHotel();

  // ✅ GENERAMOS EL QR Y EL ENLACE USANDO EL HASH
  const qrUrlPublica = generarQRUrlPublica(hashSeguro);
  const urlPublicaReserva = `${process.env.FRONTEND_URL || "http://localhost:4200"}/reservas/ver/${hashSeguro}`;

  const qrBuffer = await generarQRBuffer(hashSeguro);

  const urlPrechecking = `${process.env.FRONTEND_URL || "http://localhost:4200"}/prechecking/${tokenPrechecking}`;

  const fechaEntradaTexto = formatearFechaEspañol(fechas.entrada);
  const fechaSalidaTexto = formatearFechaEspañol(fechas.salida);

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
            .certificaciones { display: flex; justify-content: center; gap: 15px; margin-top: 10px; flex-wrap: wrap; }
            .certificacion { background: #e8d5c4; padding: 3px 12px; border-radius: 12px; font-size: 11px; color: #6d5a42; }
            .qr-section { text-align: center; padding: 20px; background: #f9f6f2; border-radius: 8px; margin: 20px 0; }
            .qr-section img { max-width: 200px; display: block; margin: 0 auto; }
            .qr-section .codigo { font-size: 18px; font-weight: bold; color: #8B7355; margin-top: 10px; }
            .qr-section .subtitle { font-size: 12px; color: #666; }
            .room-section { display: flex; gap: 20px; background: #f9f6f2; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .room-section img { width: 150px; height: 100px; object-fit: cover; border-radius: 5px; }
            .room-section .room-info { flex: 1; }
            .room-section .room-info h3 { margin: 0 0 10px 0; color: #8B7355; }
            .detail-block { background: #f9f6f2; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-block h3 { color: #8B7355; margin-top: 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .price-block { background: #f9f6f2; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .price-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .price-row.total { font-size: 1.2rem; font-weight: bold; border-top: 2px solid #8B7355; padding-top: 15px; margin-top: 10px; }
            .map-section { background: #f9f6f2; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .map-section iframe { width: 100%; height: 200px; border: 0; border-radius: 5px; }
            .map-section .horario-info { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; background: white; padding: 10px; border-radius: 5px; margin: 10px 0; }
            .prechecking-section { background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .prechecking-section .btn { display: inline-block; background: #8B7355; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .btn:hover { background: #6d5a42; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            @media (max-width: 480px) {
                .room-section { flex-direction: column; align-items: center; }
                .room-section img { width: 100%; height: auto; max-height: 200px; }
                .horario-info { flex-direction: column; gap: 5px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- HEADER -->
            <div class="header">
                <h1>🏨 ¡Reserva Confirmada!</h1>
                <p class="hotel-name">${hotel.nombre}</p>
                <p class="slogan">"${hotel.slogan}"</p>
                <div class="certificaciones">
                    ${hotel.certificacion1 ? `<span class="certificacion">⭐ ${hotel.certificacion1}</span>` : ""}
                    ${hotel.certificacion2 ? `<span class="certificacion">⭐ ${hotel.certificacion2}</span>` : ""}
                </div>
            </div>

            <!-- QR CODE -->
            <div class="qr-section">
                <h3>📱 Tu reserva</h3>
                <img src="${qrUrlPublica}" alt="QR de la reserva" />
                <!-- ✅ MOSTRAMOS EL CÓDIGO AMIGABLE -->
                <p class="codigo">Código: ${codigoReserva}</p>
                <p class="subtitle">
                    Escanea el QR para ver los detalles de tu reserva o 
                    <a href="${urlPublicaReserva}" style="color: #8B7355; font-weight: bold; text-decoration: underline;">pincha aquí</a>
                </p>
            </div>

            <!-- HABITACIÓN -->
            <div class="room-section">
                <img src="cid:habitacion_imagen" alt="${habitacion.nombre}" style="padding-bottom: 15px;" />
                <div class="room-info">
                    <h3>${habitacion.nombre}</h3>
                    <p style="margin: 5px 0;">${habitacion.descripcion || ""}</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
                        ${habitacion.caracteristicas && Array.isArray(habitacion.caracteristicas) ? habitacion.caracteristicas.map((carac) => `<span style="background: #e8d5c4; padding: 2px 10px; border-radius: 12px; font-size: 12px;">${carac}</span>`).join("") : ""}
                    </div>
                </div>
            </div>

            <!-- DETALLES DE LA RESERVA -->
            <div class="detail-block">
                <h3>📋 Detalles de la reserva</h3>
                <div class="detail-row">
                    <span>📅 Entrada</span>
                    <span><strong> ${fechaEntradaTexto}</strong></span>
                </div>
                <div class="detail-row">
                    <span>📅 Salida</span>
                    <span><strong> ${fechaSalidaTexto}</strong></span>
                </div>
                <div class="detail-row">
                    <span>🌙 Noches</span>
                    <span><strong>${fechas.noches || 0}</strong></span>
                </div>
                <div class="detail-row">
                    <span>👤 Adultos</span>
                    <span><strong>${huespedes.adultos || 0}</strong></span>
                </div>
                <div class="detail-row">
                    <span>👶 Niños</span>
                    <span><strong>${huespedes.ninos || 0}</strong></span>
                </div>
                <div class="detail-row">
                    <span>🍳 Desayuno</span>
                    <span><strong>${desayuno ? "Sí (+10€/persona/noche)" : "No"}</strong></span>
                </div>
                ${horaEstimadaLlegada ? `<div class="detail-row"><span>⏰ Hora llegada</span><span><strong>${horaEstimadaLlegada}</strong></span></div>` : ""}
            </div>

            <!-- DATOS DEL HUÉSPED -->
            <div class="detail-block">
                <h3>👤 Datos del huésped</h3>
                <div class="detail-row">
                    <span>Nombre</span>
                    <span><strong>${cliente.nombre || ""} ${cliente.apellidos || ""}</strong></span>
                </div>
                <div class="detail-row">
                    <span>Email</span>
                    <span><strong>${cliente.email || ""}</strong></span>
                </div>
                <div class="detail-row">
                    <span>Teléfono</span>
                    <span><strong>${cliente.telefono || ""}</strong></span>
                </div>
                <div class="detail-row">
                    <span>DNI</span>
                    <span><strong>${cliente.dni || ""}</strong></span>
                </div>
                ${cliente.direccion ? `<div class="detail-row"><span>Dirección</span><span><strong>${cliente.direccion}</strong></span></div>` : ""}
            </div>

            <!-- DESGLOSE DE PRECIOS -->
            <div class="price-block">
                <h3>💰 Desglose de precios</h3>
                <div class="price-row">
                    <span>${habitacion.precio || 0}€ x ${fechas.noches || 0} noche${fechas.noches > 1 ? "s" : ""}</span>
                    <span>${((habitacion.precio || 0) * (fechas.noches || 0)).toFixed(2)}€</span>
                </div>
                ${desayuno ? `<div class="price-row"><span>Desayuno (${(huespedes.adultos || 0) + (huespedes.ninos || 0)} personas x ${fechas.noches || 0} noche${fechas.noches > 1 ? "s" : ""})</span><span>${(((huespedes.adultos || 0) + (huespedes.ninos || 0)) * 10 * (fechas.noches || 0)).toFixed(2)}€</span></div>` : ""}
                <div class="price-row total">
                    <span>Total</span>
                    <span>${(importe || 0).toFixed(2)}€</span>
                </div>
            </div>

            ${solicitudEspecial ? `<div class="detail-block"><h3>📝 Solicitudes especiales</h3><p>${solicitudEspecial}</p></div>` : ""}

            <!-- MAPA Y UBICACIÓN -->
            <div class="map-section">
                <h3>📍 Ubicación</h3>
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.8354345094197!2d144.9537353153167!3d-37.81627997975159!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad65d5df1f5a3e7%3A0x5045675218ce6e0!2sMelbourne%20VIC%2C%20Australia!5e0!3m2!1ses!2ses!4v1644262070686!5m2!1ses!2ses" allowfullscreen loading="lazy"></iframe>
                <p><strong>${hotel.nombre}</strong></p>
                <p>📍 ${hotel.direccion}</p>
                <p>📞 ${hotel.telefono}</p>
                <p>📧 ${hotel.email}</p>
                <div class="horario-info">
                    <span>🕐 Check-in: ${hotel.checkIn}</span>
                    <span>🕐 Check-out: ${hotel.checkOut}</span>
                </div>
                <p><a href="https://www.google.com/maps/dir//${encodeURIComponent(hotel.nombre + " " + hotel.direccion)}" target="_blank" style="color: #8B7355; font-weight: bold;">🗺️ Cómo llegar en Google Maps</a></p>
            </div>

            <!-- PRECHECKING -->
            <div class="prechecking-section">
                <h3>🚀 Pre-checking online</h3>
                <p style="font-size: 14px; color: #555;">Recuerda que puedes realizar el <strong>pre-checking</strong> hasta 24h antes de tu llegada para agilizar tu entrada al hotel.</p>
                <a href="${urlPrechecking}" class="btn">✅ Realizar Pre-checking</a>
                <p style="font-size: 12px; color: #888; margin-top: 10px;">Este enlace es personal e intransferible</p>
            </div>

            <!-- FOOTER -->
            <div class="footer">
                <p>${hotel.nombre} © ${new Date().getFullYear()}</p>
                <p>Este email es una confirmación automática de tu reserva.</p>
                <p>Si tienes alguna duda, contacta con nosotros.</p>
            </div>
        </div>
    </body>
    </html>
    `;

  const attachments = [];

  if (qrBuffer) {
    attachments.push({
      filename: `QR_${codigoReserva}.png`,
      content: qrBuffer,
    });
  }

  if (habitacion.imagen) {
    try {
      const imagenBuffer = await obtenerImagenBuffer(habitacion.imagen);
      if (imagenBuffer) {
        attachments.push({
          filename: `habitacion_${habitacion.id}.jpg`,
          content: imagenBuffer,
          cid: "habitacion_imagen",
        });
      } else {
        console.warn("⚠️ No se pudo cargar la imagen de la habitación");
      }
    } catch (error) {
      console.error("❌ Error al adjuntar imagen:", error.message);
    }
  }

  const mailOptions = {
    from: `"${hotel.nombre}" <${process.env.EMAIL_USER}>`,
    to: cliente.email,
    subject: `✅ Reserva confirmada - ${codigoReserva}`,
    html: htmlCliente,
    attachments: attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("❌ Error al enviar email:", error);
    throw error;
  }
};

// Función para enviar email al hotel (Sin cambios, solo recibe el código amigable)
const enviarEmailHotel = async (datosReserva, emailHotel) => {
  const {
    habitacion,
    fechas,
    huespedes,
    desayuno,
    cliente,
    importe,
    solicitudEspecial,
    horaEstimadaLlegada,
    codigoReserva,
  } = datosReserva;

  const hotel = await obtenerDatosHotel();

  const htmlHotel = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f6f2; padding: 20px; border-radius: 10px;">
        <h2 style="color: #8B7355;">📩 Nueva reserva recibida</h2>
        <p><strong>Hotel:</strong> ${hotel.nombre}</p>
        <p><strong>Código:</strong> ${codigoReserva || "N/A"}</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #8B7355;">Detalles de la reserva</h3>
            <p><strong>Habitación:</strong> ${habitacion.nombre || ""}</p>
            <p><strong>Entrada:</strong> ${fechas.entrada || ""}</p>
            <p><strong>Salida:</strong> ${fechas.salida || ""}</p>
            <p><strong>Noches:</strong> ${fechas.noches || 0}</p>
            <p><strong>Adultos:</strong> ${huespedes.adultos || 0}</p>
            <p><strong>Niños:</strong> ${huespedes.ninos || 0}</p>
            <p><strong>Desayuno:</strong> ${desayuno ? "Sí" : "No"}</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #8B7355;">Datos del huésped</h3>
            <p><strong>Nombre:</strong> ${cliente.nombre || ""} ${cliente.apellidos || ""}</p>
            <p><strong>Email:</strong> ${cliente.email || ""}</p>
            <p><strong>Teléfono:</strong> ${cliente.telefono || ""}</p>
            <p><strong>DNI:</strong> ${cliente.dni || ""}</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #8B7355;">Importe</h3>
            <p style="font-size: 1.2rem; font-weight: bold; color: #8B7355;">Total: ${(importe || 0).toFixed(2)}€</p>
        </div>
        ${solicitudEspecial ? `<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3 style="color: #8B7355;">Solicitudes especiales</h3><p>${solicitudEspecial}</p></div>` : ""}
        ${horaEstimadaLlegada ? `<p><strong>Hora estimada de llegada:</strong> ${horaEstimadaLlegada}</p>` : ""}
        <p style="margin-top: 20px; color: #666; font-size: 12px;">📱 QR generado para el cliente: ${codigoReserva ? "Sí" : "No"}</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
            <p><strong>${hotel.nombre}</strong></p>
            <p>📍 ${hotel.direccion}</p>
            <p>📞 ${hotel.telefono}</p>
        </div>
    </div>
    `;

  const mailOptions = {
    from: `"${hotel.nombre}" <${process.env.EMAIL_USER}>`,
    to: emailHotel,
    subject: `📩 Nueva reserva recibida - ${codigoReserva || "N/A"}`,
    html: htmlHotel,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("❌ Error al enviar email al hotel:", error);
    throw error;
  }
};

const enviarEmailPrecheckingConfirmacion = async (
  reserva,
  datosPrechecking,
  hotel,
) => {
  try {
    // Generar URLs
    const urlReserva = `${process.env.FRONTEND_URL}/reservas/ver/${reserva.hash_seguro}`;
    const urlPrechecking = `${process.env.FRONTEND_URL}/prechecking/${reserva.token_prechecking}`;

    // Formatear fechas
    const fechaEntrada = new Date(reserva.fecha_entrada).toLocaleDateString(
      "es-ES",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );
    const fechaSalida = new Date(reserva.fecha_salida).toLocaleDateString(
      "es-ES",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    // Contar noches
    const noches = Math.ceil(
      (new Date(reserva.fecha_salida) - new Date(reserva.fecha_entrada)) /
        (1000 * 60 * 60 * 24),
    );

    // Construir HTML del email
    const htmlPrechecking = `
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
            .badge { display: inline-block; background: #8B7355; color: white; padding: 2px 12px; border-radius: 12px; font-size: 12px; }
            .room-section { display: flex; gap: 20px; background: #f9f6f2; padding: 15px; border-radius: 8px; margin: 20px 0; align-items: center; }
            .room-section .room-info { flex: 1; }
            .room-section .room-info h3 { margin: 0 0 10px 0; color: #8B7355; }
            .prechecking-data { background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B7355; }
            .certificaciones { display: flex; justify-content: center; gap: 15px; margin-top: 10px; flex-wrap: wrap; }
            .certificacion { background: #e8d5c4; padding: 3px 12px; border-radius: 12px; font-size: 11px; color: #6d5a42; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            @media (max-width: 480px) {
                .room-section { flex-direction: column; align-items: center; }
                .detail-row { flex-direction: column; align-items: flex-start; gap: 3px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- HEADER -->
            <div class="header">
                <h1>🏨 ¡Pre-checking Realizado!</h1>
                <p class="hotel-name">${hotel.nombre}</p>
                <p class="slogan">"${hotel.slogan || "Un lugar donde la naturaleza y el confort se encuentran"}"</p>
                <div class="certificaciones">
                    ${hotel.certificacion1 ? `<span class="certificacion">⭐ ${hotel.certificacion1}</span>` : ""}
                    ${hotel.certificacion2 ? `<span class="certificacion">⭐ ${hotel.certificacion2}</span>` : ""}
                </div>
            </div>

            <!-- BANNER DE ÉXITO -->
            <div class="success-banner">
                <span class="icon">✅</span>
                <h2>¡Pre-checking completado con éxito!</h2>
                <p>Tu llegada al hotel será más rápida y cómoda.</p>
                <p style="font-size: 14px; margin-top: 10px;">
                    <span class="badge">Código: ${reserva.codigo_reserva}</span>
                </p>
            </div>

            <!-- INFORMACIÓN DE LA RESERVA -->
            <div class="detail-block">
                <h3>📋 Información de la reserva</h3>
                <div class="detail-row">
                    <span>🏠 Habitación</span>
                    <span><strong>${reserva.habitacion_nombre || "No especificada"}</strong></span>
                </div>
                <div class="detail-row">
                    <span>📅 Entrada</span>
                    <span><strong>${fechaEntrada}</strong></span>
                </div>
                <div class="detail-row">
                    <span>📅 Salida</span>
                    <span><strong>${fechaSalida}</strong></span>
                </div>
                <div class="detail-row">
                    <span>🌙 Noches</span>
                    <span><strong>${noches}</strong></span>
                </div>
                <div class="detail-row">
                    <span>👤 Adultos</span>
                    <span><strong>${reserva.adultos || 0}</strong></span>
                </div>
                <div class="detail-row">
                    <span>👶 Niños</span>
                    <span><strong>${reserva.ninos || 0}</strong></span>
                </div>
                <div class="detail-row">
                    <span>🍳 Desayuno</span>
                    <span><strong>${reserva.desayuno ? "✅ Sí" : "❌ No"}</strong></span>
                </div>
            </div>

            <!-- DATOS DEL PRECHECKING -->
            <div class="prechecking-data">
                <h3 style="margin-top: 0; color: #8B7355;">📝 Datos del viajero</h3>
                
                <div class="detail-row">
                    <span>👤 Nombre completo</span>
                    <span><strong>${datosPrechecking.nombre || ""} ${datosPrechecking.apellidos || ""}</strong></span>
                </div>
                <div class="detail-row">
                    <span>🪪 Tipo de documento</span>
                    <span><strong>${datosPrechecking.tipoDocumento || "DNI"}</strong></span>
                </div>
                <div class="detail-row">
                    <span>📋 Número de documento</span>
                    <span><strong>${datosPrechecking.numeroDocumento || ""}</strong></span>
                </div>
                <div class="detail-row">
                    <span>📅 Fecha de expedición</span>
                    <span><strong>${datosPrechecking.fechaExpedicion || ""}</strong></span>
                </div>
                <div class="detail-row">
                    <span>🌍 Nacionalidad</span>
                    <span><strong>${datosPrechecking.nacionalidad || ""}</strong></span>
                </div>
                <div class="detail-row">
                    <span>🎂 Fecha de nacimiento</span>
                    <span><strong>${datosPrechecking.fechaNacimiento || ""}</strong></span>
                </div>
                <div class="detail-row">
                    <span>🏠 Residencia habitual</span>
                    <span><strong>${datosPrechecking.residenciaHabitual || ""}</strong></span>
                </div>
                <div class="detail-row">
                    <span>📞 Teléfono</span>
                    <span><strong>${datosPrechecking.telefono || ""}</strong></span>
                </div>
                <div class="detail-row">
                    <span>📧 Email</span>
                    <span><strong>${datosPrechecking.email || ""}</strong></span>
                </div>
                ${
                  datosPrechecking.vehiculoMatricula
                    ? `
                <div class="detail-row">
                    <span>🚗 Matrícula del vehículo</span>
                    <span><strong>${datosPrechecking.vehiculoMatricula}</strong></span>
                </div>`
                    : ""
                }
                ${
                  datosPrechecking.observaciones
                    ? `
                <div class="detail-row">
                    <span>📝 Observaciones</span>
                    <span><strong>${datosPrechecking.observaciones}</strong></span>
                </div>`
                    : ""
                }
            </div>

            <!-- MENORES (si existen) -->
            ${
              datosPrechecking.menores && datosPrechecking.menores.length > 0
                ? `
            <div class="detail-block">
                <h3>👶 Menores de edad</h3>
                ${datosPrechecking.menores
                  .map(
                    (menor, index) => `
                <div style="background: white; padding: 10px; border-radius: 5px; margin-bottom: 10px; border: 1px solid #eee;">
                    <p style="margin: 0; font-weight: bold;">Menor ${index + 1}: ${menor.nombre || ""} ${menor.apellidos || ""}</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
                        📅 ${menor.fechaNacimiento || ""} | 👨‍👦 Parentesco: ${menor.parentesco || ""}
                    </p>
                </div>
                `,
                  )
                  .join("")}
            </div>`
                : ""
            }

            <!-- INFORMACIÓN DEL HOTEL -->
            <div class="detail-block">
                <h3>📍 Información del hotel</h3>
                <div class="detail-row">
                    <span>📌 Dirección</span>
                    <span><strong>${hotel.direccion || ""}</strong></span>
                </div>
                <div class="detail-row">
                    <span>📞 Teléfono</span>
                    <span><strong>${hotel.telefono || ""}</strong></span>
                </div>
                <div class="detail-row">
                    <span>📧 Email</span>
                    <span><strong>${hotel.email || ""}</strong></span>
                </div>
                <div class="detail-row">
                    <span>🕐 Check-in</span>
                    <span><strong>${hotel.checkIn || "15:00 – 22:00"}</strong></span>
                </div>
                <div class="detail-row">
                    <span>🕐 Check-out</span>
                    <span><strong>${hotel.checkOut || "12:00"}</strong></span>
                </div>
            </div>

            <!-- MAPA Y UBICACIÓN -->
            <div style="background: #f9f6f2; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h3 style="color: #8B7355; margin-top: 0;">🗺️ Cómo llegar</h3>
                <p>
                    <a href="https://www.google.com/maps/dir//${encodeURIComponent((hotel.nombre || "") + " " + (hotel.direccion || ""))}" 
                       target="_blank" style="color: #8B7355; font-weight: bold; text-decoration: underline;">
                        📍 Abrir en Google Maps
                    </a>
                </p>
                <p style="font-size: 13px; color: #666;">
                    ${hotel.direccion || ""}
                </p>
            </div>

            <!-- FOOTER -->
            <div class="footer">
                <p><strong>${hotel.nombre || "Hotel"}</strong> © ${new Date().getFullYear()}</p>
                <p style="font-size: 11px; color: #999;">
                    Este email es una confirmación de que tu pre-checking se ha realizado correctamente.<br>
                    Los datos han sido registrados según la normativa SES.HOSPEDAJES.
                </p>
                <p style="font-size: 11px; color: #999;">
                    Si tienes alguna duda, contacta con nosotros en <a href="mailto:${hotel.email || "info@hotel.com"}" style="color: #8B7355;">${hotel.email || "info@hotel.com"}</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Configurar el email
    const mailOptions = {
      from: `"${hotel.nombre || "Hotel"}" <${process.env.EMAIL_USER}>`,
      to: datosPrechecking.email || reserva.email_cliente,
      subject: `✅ Pre-checking confirmado - ${hotel.nombre || "Hotel"}`,
      html: htmlPrechecking,
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);

    return info;
  } catch (error) {
    console.error(
      "❌ Error al enviar email de confirmación de pre-checking:",
      error,
    );
    throw error;
  }
};

const enviarEmailContactoCliente = async (datosContacto, hotel) => {
  const {nombre, email, telefono, mensaje, formaContacto, horarioContacto} =
    datosContacto;

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
        .mensaje-resumen { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #8B7355; }
        .certificaciones { display: flex; justify-content: center; gap: 15px; margin-top: 10px; flex-wrap: wrap; }
        .certificacion { background: #e8d5c4; padding: 3px 12px; border-radius: 12px; font-size: 11px; color: #6d5a42; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📩 ¡Mensaje recibido!</h1>
          <p class="hotel-name">${hotel.nombre || "Hotel"}</p>
          <p class="slogan">"${hotel.slogan || "Un lugar donde la naturaleza y el confort se encuentran"}"</p>
          <div class="certificaciones">
            ${hotel.certificacion1 ? `<span class="certificacion">⭐ ${hotel.certificacion1}</span>` : ""}
            ${hotel.certificacion2 ? `<span class="certificacion">⭐ ${hotel.certificacion2}</span>` : ""}
          </div>
        </div>

        <div class="success-banner">
          <span class="icon">✅</span>
          <h2>¡Hemos recibido tu mensaje!</h2>
          <p>Gracias por contactar con nosotros, ${nombre}.</p>
          <p style="font-size: 14px;">Te responderemos a la mayor brevedad posible.</p>
        </div>

        <div class="detail-block">
          <h3>📋 Resumen de tu mensaje</h3>
          <div class="detail-row"><span>👤 Nombre</span><span><strong>${nombre}</strong></span></div>
          <div class="detail-row"><span>📧 Email</span><span><strong>${email}</strong></span></div>
          <div class="detail-row"><span>📞 Teléfono</span><span><strong>${telefono}</strong></span></div>
        </div>

        <div class="mensaje-resumen">
          <p style="margin: 0; font-weight: bold; color: #8B7355;">📝 Tu mensaje:</p>
          <p style="margin: 10px 0 0 0; white-space: pre-wrap; color: #555;">${mensaje}</p>
        </div>

        <div class="footer">
          <p><strong>${hotel.nombre || "Hotel"}</strong> © ${new Date().getFullYear()}</p>
          <p style="font-size: 11px; color: #999;">Este email es una confirmación de que hemos recibido tu mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return htmlCliente;
};

module.exports = {
  enviarEmailCliente,
  enviarEmailHotel,
  enviarEmailPrecheckingConfirmacion,
  enviarEmailContactoCliente,
};

// backend/routes/prechecking.routes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {pool} = require("../config/database");
const Tesseract = require("tesseract.js");
const {
  enviarEmailPrecheckingConfirmacion,
} = require("../services/emailService");

// ============================================
// CONFIGURACIÓN 1: Para SUBIR DNI (guarda en disco)
// ============================================
const diskStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const {token} = req.body;

      if (!token) {
        return cb(new Error("Token es requerido"));
      }

      const result = await pool.query(
        "SELECT id, dni_cliente FROM reservas WHERE token_prechecking = $1",
        [token],
      );

      if (!result.rows || result.rows.length === 0) {
        return cb(new Error("Token inválido"));
      }

      const reserva = result.rows[0];
      const dni = reserva.dni_cliente || "desconocido";
      const year = new Date().getFullYear();
      const uploadPath = path.join(
        __dirname,
        "../uploads/viajeros",
        String(year),
        dni,
      );

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, {recursive: true});
      }

      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const tipo = req.body.tipo || "frontal";
    const ext = path.extname(file.originalname);
    cb(null, `dni${tipo.charAt(0).toUpperCase() + tipo.slice(1)}${ext}`);
  },
});

const diskUpload = multer({
  storage: diskStorage,
  limits: {fileSize: 5 * 1024 * 1024},
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Solo se permiten imágenes (JPEG, PNG) y PDF"));
  },
});

// ============================================
// CONFIGURACIÓN 2: Para LEER DNI (solo memoria, no guarda)
// ============================================
const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({
  storage: memoryStorage,
  limits: {fileSize: 5 * 1024 * 1024},
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Solo se permiten imágenes (JPEG, PNG)"));
  },
});

// ============================================
// RUTAS
// ============================================

// 1. VERIFICAR TOKEN
router.get("/verificar/:token", async (req, res) => {
  try {
    const {token} = req.params;

    const query = `
      SELECT 
        codigo_reserva,
        habitacion_id,
        fecha_entrada,
        fecha_salida,
        adultos,
        ninos,
        nombre_cliente,
        apellidos_cliente,
        email_cliente,
        telefono_cliente,
        dni_cliente,
        estado
      FROM reservas 
      WHERE token_prechecking = $1 
        AND estado != 'cancelada'
        AND prechecking_realizado = FALSE
        AND fecha_entrada >= CURRENT_DATE
    `;

    const result = await pool.query(query, [token]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Token inválido, expirado o ya utilizado",
      });
    }

    const reserva = result.rows[0];

    res.json({
      success: true,
      reserva: {
        codigoReserva: reserva.codigo_reserva,
        habitacion_id: reserva.habitacion_id,
        fecha_entrada: reserva.fecha_entrada,
        fecha_salida: reserva.fecha_salida,
        adultos: reserva.adultos,
        ninos: reserva.ninos,
        nombre_cliente: reserva.nombre_cliente,
        apellidos_cliente: reserva.apellidos_cliente || "",
        email_cliente: reserva.email_cliente,
        telefono_cliente: reserva.telefono_cliente,
        dni_cliente: reserva.dni_cliente || "",
        estado: reserva.estado,
      },
    });
  } catch (error) {
    console.error("❌ Error al verificar token:", error);
    res.status(500).json({
      success: false,
      message: "Error al verificar el token",
    });
  }
});

// 2. SUBIR DNI (usa diskUpload - guarda en disco)
router.post("/subir-dni", diskUpload.single("dni"), async (req, res) => {
  try {
    const {token, tipo} = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se recibió ningún archivo",
      });
    }

    const result = await pool.query(
      "SELECT id FROM reservas WHERE token_prechecking = $1 AND prechecking_realizado = FALSE",
      [token],
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Token inválido",
      });
    }

    const filePath = req.file.path.replace(/\\/g, "/");
    const relativePath = filePath.replace(/^.*\/uploads\//, "uploads/");

    const field = tipo === "frontal" ? "dni_frontal_url" : "dni_trasero_url";
    await pool.query(
      `UPDATE reservas SET ${field} = $1 WHERE token_prechecking = $2`,
      [relativePath, token],
    );

    res.json({
      success: true,
      message: "Archivo subido correctamente",
      archivo: {
        [tipo]: relativePath,
      },
    });
  } catch (error) {
    console.error("❌ Error al subir DNI:", error);
    res.status(500).json({
      success: false,
      message: "Error al subir el archivo",
    });
  }
});

// 3. LEER DNI CON OCR (usa memoryUpload - NO guarda en disco)
router.post("/leer-dni", memoryUpload.single("dni"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se recibió ningún archivo",
      });
    }

    const {tipo} = req.body; // 'frontal' o 'trasero'

    const imageBuffer = req.file.buffer;

    const {
      data: {text},
    } = await Tesseract.recognize(imageBuffer, "spa", {
      logger: (m) => {
        if (m.status === "recognizing text") {
        }
      },
    });

    let data = {};

    if (tipo === "frontal") {
      // Extraer datos del anverso (nombre, apellidos, DNI, fechas, nacionalidad)
      data = extraerDatosDNIMejorado(text);
    } else if (tipo === "trasero") {
      // Extraer residencia del reverso
      const residencia = extraerResidencia(text);
      data = {residencia};
    }

    res.json({
      success: true,
      message: "Datos extraídos correctamente",
      data,
      tipo,
    });
  } catch (error) {
    console.error("❌ Error al leer DNI:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar el DNI",
    });
  }
});

function extraerDatosDNIMejorado(texto) {
  const datos = {
    nombre: "",
    apellidos: "",
    tipoDocumento: "DNI",
    numeroDocumento: "",
    fechaExpedicion: "",
    nacionalidad: "",
    fechaNacimiento: "",
    residencia: "",
  };

  // Limpiar texto
  const lines = texto
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const textFull = lines.join(" ");
  const textUpper = textFull.toUpperCase();

  // ============================================
  // 1. BUSCAR NÚMERO DE DOCUMENTO
  // ============================================
  const dniRegex = /\b(\d{8}[A-Z])\b/;
  const dniMatch = textFull.match(dniRegex);
  if (dniMatch) {
    datos.numeroDocumento = dniMatch[1];
    datos.tipoDocumento = "DNI";
  }

  if (!datos.numeroDocumento) {
    const nieRegex = /\b([XYZ]\d{7}[A-Z])\b/;
    const nieMatch = textFull.match(nieRegex);
    if (nieMatch) {
      datos.numeroDocumento = nieMatch[1];
      datos.tipoDocumento = "NIE";
    }
  }

  // ============================================
  // 2. BUSCAR NOMBRE Y APELLIDOS (CORREGIDO)
  // ============================================
  let nombreEncontrado = "";
  let apellidosEncontrados = "";
  let lineaNombre = -1;
  let lineaApellidos = -1;

  // Primero, buscar las etiquetas NOMBRE y APELLIDOS
  for (let i = 0; i < lines.length; i++) {
    const upperLine = lines[i].toUpperCase();
    if (upperLine.includes("NOMBRE") || upperLine === "NOMBRE") {
      lineaNombre = i;
    }
    if (upperLine.includes("APELLIDOS") || upperLine === "APELLIDOS") {
      lineaApellidos = i;
    }
  }

  // Extraer nombre (buscando después de la etiqueta NOMBRE)
  if (lineaNombre !== -1) {
    // Buscar en las siguientes líneas
    for (
      let i = lineaNombre + 1;
      i < Math.min(lineaNombre + 5, lines.length);
      i++
    ) {
      const line = lines[i];
      // Si la línea no tiene números y no es una etiqueta
      if (
        !/\d/.test(line) &&
        !line.toUpperCase().includes("APELLIDOS") &&
        !line.toUpperCase().includes("NACIONALIDAD")
      ) {
        const cleanLine = line.replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ\s]/g, "").trim();
        if (cleanLine.length > 0 && cleanLine.length < 50) {
          nombreEncontrado = cleanLine;
          break;
        }
      }
    }
  }

  // Extraer apellidos (buscando después de la etiqueta APELLIDOS)
  if (lineaApellidos !== -1) {
    for (
      let i = lineaApellidos + 1;
      i < Math.min(lineaApellidos + 5, lines.length);
      i++
    ) {
      const line = lines[i];
      if (
        !/\d/.test(line) &&
        !line.toUpperCase().includes("NOMBRE") &&
        !line.toUpperCase().includes("NACIONALIDAD")
      ) {
        const cleanLine = line.replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ\s]/g, "").trim();
        if (cleanLine.length > 0 && cleanLine.length < 50) {
          apellidosEncontrados = cleanLine;
          break;
        }
      }
    }
  }

  // Si no se encontraron nombre o apellidos por etiquetas, buscar en el texto
  if (!nombreEncontrado || !apellidosEncontrados) {
    // Buscar líneas que parezcan nombres (sin números, con mayúsculas)
    const posiblesNombres = [];
    for (const line of lines) {
      const cleanLine = line.replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ\s]/g, "").trim();
      if (
        cleanLine.length > 2 &&
        cleanLine.length < 50 &&
        !/\d/.test(cleanLine)
      ) {
        const upperLine = cleanLine.toUpperCase();
        // Excluir palabras comunes
        if (
          !upperLine.includes("ESP") &&
          !upperLine.includes("DNI") &&
          !upperLine.includes("DOCUMENTO") &&
          !upperLine.includes("IDENTIDAD") &&
          !upperLine.includes("NACIONALIDAD") &&
          !upperLine.includes("APELLIDOS") &&
          !upperLine.includes("NOMBRE")
        ) {
          posiblesNombres.push(cleanLine);
        }
      }
    }

    // Si tenemos posibles nombres, asignarlos
    if (posiblesNombres.length >= 2) {
      // El primer nombre podría ser el nombre o los apellidos
      // Buscar el que tenga más palabras (probablemente nombre completo)
      let mejorCandidato = "";
      for (const candidato of posiblesNombres) {
        const partes = candidato.split(/\s+/);
        if (partes.length >= 2 && candidato.length > mejorCandidato.length) {
          mejorCandidato = candidato;
        }
      }

      if (mejorCandidato) {
        const partes = mejorCandidato.split(/\s+/);
        if (partes.length >= 2) {
          if (!nombreEncontrado) {
            nombreEncontrado = partes[0];
            // El resto podría ser apellidos o parte del nombre
            if (partes.length > 1) {
              if (!apellidosEncontrados) {
                apellidosEncontrados = partes.slice(1).join(" ");
              } else {
                // Si ya tenemos apellidos, añadir estos
                apellidosEncontrados =
                  apellidosEncontrados + " " + partes.slice(1).join(" ");
              }
            }
          }
        }
      }
    }

    // Si aún no tenemos nombre, intentar con el primer nombre encontrado
    if (!nombreEncontrado && posiblesNombres.length > 0) {
      const primerNombre = posiblesNombres[0];
      const partes = primerNombre.split(/\s+/);
      if (partes.length >= 1) {
        nombreEncontrado = partes[0];
        if (partes.length > 1 && !apellidosEncontrados) {
          apellidosEncontrados = partes.slice(1).join(" ");
        }
      }
    }
  }

  // Asignar nombre y apellidos
  if (nombreEncontrado) {
    datos.nombre = nombreEncontrado;
  }
  if (apellidosEncontrados) {
    datos.apellidos = apellidosEncontrados;
  }

  // Si el nombre tiene más de 2 palabras, separar correctamente
  if (datos.nombre && datos.nombre.split(/\s+/).length > 1) {
    const partes = datos.nombre.split(/\s+/);
    datos.nombre = partes[0];
    if (!datos.apellidos) {
      datos.apellidos = partes.slice(1).join(" ");
    } else {
      datos.apellidos = partes.slice(1).join(" ") + " " + datos.apellidos;
    }
  }

  // ============================================
  // 3. BUSCAR FECHA DE NACIMIENTO
  // ============================================
  const fechaRegex = /(\b\d{1,2})[\s,\.\/\-](\d{1,2})[\s,\.\/\-](\d{4})\b/g;
  let fechasEncontradas = [];
  let match;

  while ((match = fechaRegex.exec(textFull)) !== null) {
    let day = match[1].trim().padStart(2, "0");
    let month = match[2].trim().padStart(2, "0");
    let year = match[3].trim();
    const yearInt = parseInt(year);

    if (
      yearInt >= 1900 &&
      yearInt <= 2035 &&
      parseInt(day) <= 31 &&
      parseInt(month) <= 12
    ) {
      fechasEncontradas.push({
        fecha: `${year}-${month}-${day}`,
        year: yearInt,
        day: parseInt(day),
        month: parseInt(month),
        raw: match[0],
      });
    }
  }

  fechasEncontradas.sort((a, b) => a.year - b.year);

  const fechasNacimiento = fechasEncontradas.filter((f) => f.year < 2010);
  const fechasExpedicion = fechasEncontradas.filter((f) => f.year >= 2020);

  if (fechasNacimiento.length > 0) {
    datos.fechaNacimiento = fechasNacimiento[0].fecha;
  } else if (fechasEncontradas.length > 0) {
    datos.fechaNacimiento = fechasEncontradas[0].fecha;
  }

  if (fechasExpedicion.length > 0) {
    datos.fechaExpedicion = fechasExpedicion[0].fecha;
  } else if (fechasEncontradas.length > 1) {
    datos.fechaExpedicion = fechasEncontradas[1].fecha;
  }

  // ============================================
  // 4. BUSCAR NACIONALIDAD
  // ============================================
  if (
    textUpper.includes("ESP") ||
    textUpper.includes("ESPAÑOLA") ||
    textUpper.includes("ESPAÑOL")
  ) {
    datos.nacionalidad = "Española";
  } else if (textUpper.includes("NACIONALIDAD")) {
    for (const line of lines) {
      if (line.toUpperCase().includes("NACIONALIDAD")) {
        const partes = line.split(/[:;]/);
        if (partes.length > 1) {
          const valor = partes[1].trim();
          if (valor.length > 0 && valor.length < 30) {
            datos.nacionalidad = valor;
          }
        }
        break;
      }
    }
  }

  if (!datos.nacionalidad) {
    const paises = [
      "ESP",
      "ESPAÑOLA",
      "ESPAÑOL",
      "SPANISH",
      "ARGENTINA",
      "MEXICANA",
      "COLOMBIANA",
    ];
    for (const pais of paises) {
      if (textUpper.includes(pais)) {
        datos.nacionalidad = "Española";
        break;
      }
    }
  }

  // ============================================
  // 5. LIMPIEZA FINAL
  // ============================================
  if (datos.nombre) {
    datos.nombre = datos.nombre.replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ\s]/g, "").trim();
  }
  if (datos.apellidos) {
    datos.apellidos = datos.apellidos
      .replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ\s]/g, "")
      .trim();
  }

  return datos;
}
function extraerResidencia(texto) {
  const lines = texto
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Buscar palabras clave de dirección
  const keywords = [
    "CALLE",
    "AVENIDA",
    "PLAZA",
    "PASEO",
    "CARRER",
    "RESIDENCIA",
    "DOMICILIO",
  ];

  for (const line of lines) {
    const upperLine = line.toUpperCase();
    for (const keyword of keywords) {
      if (upperLine.includes(keyword)) {
        // Limpiar la línea
        let direccion = line;
        // Eliminar etiquetas
        for (const kw of keywords) {
          direccion = direccion.replace(new RegExp(kw, "gi"), "");
        }
        direccion = direccion.trim();
        if (direccion.length > 5) {
          return direccion;
        }
      }
    }
  }

  // Buscar líneas con códigos postales
  for (const line of lines) {
    if (/\b\d{5}\b/.test(line)) {
      return line.trim();
    }
  }

  return "";
}
function extraerResidencia(texto) {
  const lines = texto
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Palabras clave de dirección
  const keywords = [
    "CALLE",
    "AVENIDA",
    "PLAZA",
    "PASEO",
    "CARRER",
    "RESIDENCIA",
    "DOMICILIO",
    "DIRECCIÓN",
    "DIRECCION",
    "BARRIO",
    "URBANIZACIÓN",
    "URBANIZACION",
    "COLONIA",
    "C/",
    "AV.",
    "PL.",
    "PG.",
    "CL",
  ];

  let residencia = "";

  // Buscar línea que contenga palabras clave
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    for (const keyword of keywords) {
      if (upperLine.includes(keyword)) {
        // Limpiar la línea
        let direccion = line;
        // Eliminar etiquetas
        for (const kw of keywords) {
          direccion = direccion.replace(new RegExp(kw, "gi"), "");
        }
        direccion = direccion.replace(/[:;]/g, "").trim();
        if (direccion.length > 5) {
          residencia = direccion;
          break;
        }
      }
    }
    if (residencia) break;
  }

  // Si no se encontró con palabras clave, buscar líneas con código postal
  if (!residencia) {
    for (const line of lines) {
      // Buscar código postal (5 dígitos)
      if (/\b\d{5}\b/.test(line)) {
        const cleanLine = line.trim();
        if (cleanLine.length > 5) {
          residencia = cleanLine;
          break;
        }
      }
    }
  }

  // Si no se encontró, buscar líneas que tengan palabras y números (dirección)
  if (!residencia) {
    for (const line of lines) {
      // Buscar líneas que tengan números y letras (típico de direcciones)
      if (
        /\d/.test(line) &&
        /[a-zA-Z]/.test(line) &&
        line.length > 5 &&
        line.length < 100
      ) {
        const cleanLine = line.replace(/[:;]/g, "").trim();
        // Excluir líneas con fechas o números de documento
        if (
          !/^\d{8}[A-Z]/.test(cleanLine) &&
          !/\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{4}/.test(cleanLine)
        ) {
          residencia = cleanLine;
          break;
        }
      }
    }
  }

  // Limpiar residencia
  if (residencia) {
    // Eliminar caracteres especiales
    residencia = residencia
      .replace(/[^a-zA-Z0-9ÁÉÍÓÚÑáéíóúñ\s,\.\-/#]/g, "")
      .trim();
    // Capitalizar primera letra
    residencia = residencia.charAt(0).toUpperCase() + residencia.slice(1);
  }

  return residencia;
}
// 4. REALIZAR PRECHECKING
router.post("/realizar", async (req, res) => {
  try {
    const {token, datos} = req.body;

    if (!token || !datos) {
      return res.status(400).json({
        success: false,
        message: "Datos incompletos",
      });
    }

    // ✅ OBTENER TODOS LOS DATOS DE LA RESERVA (incluyendo habitación)
    const checkResult = await pool.query(
      `SELECT r.*, h.nombre as habitacion_nombre 
       FROM reservas r
       LEFT JOIN habitaciones h ON r.habitacion_id = h.id
       WHERE r.token_prechecking = $1 AND r.prechecking_realizado = FALSE`,
      [token],
    );

    if (!checkResult.rows || checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Token inválido o ya utilizado",
      });
    }

    const reserva = checkResult.rows[0];
    const reservaId = reserva.id;

    // Actualizar la reserva con los datos del prechecking
    const updateQuery = `
      UPDATE reservas 
      SET 
        prechecking_realizado = TRUE,
        fecha_prechecking = NOW(),
        dni_cliente = $1,
        telefono_cliente = $2,
        email_cliente = $3,
        nombre_cliente = $4,
        apellidos_cliente = $5
      WHERE id = $6
    `;

    await pool.query(updateQuery, [
      datos.numeroDocumento,
      datos.telefono,
      datos.email,
      datos.nombre,
      datos.apellidos,
      reservaId,
    ]);

    // Si hay menores, guardarlos
    if (datos.menores && datos.menores.length > 0) {
      for (const menor of datos.menores) {
        const menorQuery = `
          INSERT INTO menores (reserva_id, nombre, apellidos, fecha_nacimiento, parentesco)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await pool.query(menorQuery, [
          reservaId,
          menor.nombre,
          menor.apellidos,
          menor.fechaNacimiento,
          menor.parentesco,
        ]);
      }
    }

    // ✅ OBTENER DATOS DEL HOTEL PARA EL EMAIL
    const hotelResult = await pool.query(
      `SELECT clave, valor FROM contenido_web 
       WHERE clave IN ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        "footer_nombre",
        "footer_slogan",
        "footer_direccion",
        "footer_telefono",
        "footer_email",
        "footer_check_in",
        "footer_check_out",
        "footer_certificacion_1",
        "footer_certificacion_2",
      ],
    );

    const hotel = {
      nombre: "Hotel Amanecer en Campos",
      slogan: "Un lugar donde la naturaleza y el confort se encuentran",
      direccion: "",
      telefono: "",
      email: "",
      checkIn: "15:00 – 22:00",
      checkOut: "12:00",
      certificacion1: "",
      certificacion2: "",
    };

    hotelResult.rows.forEach((row) => {
      switch (row.clave) {
        case "footer_nombre":
          hotel.nombre = row.valor;
          break;
        case "footer_slogan":
          hotel.slogan = row.valor;
          break;
        case "footer_direccion":
          hotel.direccion = row.valor;
          break;
        case "footer_telefono":
          hotel.telefono = row.valor;
          break;
        case "footer_email":
          hotel.email = row.valor.replace(/&#64;/g, "@");
          break;
        case "footer_check_in":
          hotel.checkIn = row.valor;
          break;
        case "footer_check_out":
          hotel.checkOut = row.valor;
          break;
        case "footer_certificacion_1":
          hotel.certificacion1 = row.valor;
          break;
        case "footer_certificacion_2":
          hotel.certificacion2 = row.valor;
          break;
      }
    });

    // ✅ ENVIAR EMAIL DE CONFIRMACIÓN DE PRECHECKING
    try {
      // Enviamos el email con los datos de la reserva y los datos del prechecking
      await enviarEmailPrecheckingConfirmacion(reserva, datos, hotel);
    } catch (emailError) {
      console.error("❌ Error al enviar email de pre-checking:", emailError);
      // No bloqueamos la respuesta si falla el email
    }

    res.json({
      success: true,
      message: "Pre-checking realizado correctamente",
      data: {
        reservaId: reservaId,
      },
    });
  } catch (error) {
    console.error("❌ Error al realizar prechecking:", error);
    res.status(500).json({
      success: false,
      message: "Error al guardar los datos",
    });
  }
});

module.exports = router;

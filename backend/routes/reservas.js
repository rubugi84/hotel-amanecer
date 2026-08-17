// backend/routes/reservas.js

const express = require("express");
const router = express.Router();
const {
  buscarHabitacionesDisponibles,
  crearReserva,
  obtenerReservaPorCodigo,
  obtenerReservaPorHash,
  verificarTokenPrechecking,
  realizarPrechecking,
  getReservas,
  actualizarReserva,
  eliminarReserva,
  reenviarEmailConfirmacion,
  pool,
} = require("../models/Reservas");
const {
  enviarEmailCliente,
  enviarEmailHotel,
} = require("../services/emailService");

// ============================================
// RUTAS PÚBLICAS
// ============================================

router.post("/buscar", async (req, res) => {
  try {
    const {adultos, ninos, fecha_entrada, fecha_salida} = req.body;
    const habitaciones = await buscarHabitacionesDisponibles(
      adultos,
      ninos,
      fecha_entrada,
      fecha_salida,
    );
    res.json(habitaciones);
  } catch (error) {
    console.error("Error al buscar habitaciones:", error);
    res.status(500).json({error: "Error al buscar habitaciones disponibles"});
  }
});

// POST: Crear una nueva reserva
router.post("/", async (req, res) => {
  try {
    const reserva = await crearReserva(req.body);

    const habitacionResult = await pool.query(
      "SELECT * FROM habitaciones WHERE id = $1",
      [req.body.habitacion_id],
    );
    const habitacion = habitacionResult.rows[0];

    if (!habitacion) {
      throw new Error("Habitación no encontrada");
    }

    const datosCompletos = {
      habitacion: habitacion,
      fechas: {
        entrada: req.body.fecha_entrada,
        salida: req.body.fecha_salida,
        noches: Math.ceil(
          (new Date(req.body.fecha_salida) - new Date(req.body.fecha_entrada)) /
            (1000 * 60 * 60 * 24),
        ),
      },
      huespedes: {
        adultos: req.body.adultos,
        ninos: req.body.ninos || 0,
      },
      desayuno: req.body.desayuno || false,
      cliente: {
        nombre: req.body.nombre_cliente,
        apellidos: req.body.apellidos_cliente || "",
        email: req.body.email_cliente,
        telefono: req.body.telefono_cliente,
        dni: req.body.dni_cliente || "",
        direccion: req.body.direccion_cliente || "",
      },
      importe: parseFloat(req.body.importe_total),
      solicitudEspecial: req.body.solicitud_especial || "",
      horaEstimadaLlegada: req.body.hora_llegada || "",
      codigoReserva: reserva.codigo_reserva,
      hashSeguro: reserva.hash_seguro,
      tokenPrechecking: reserva.token_prechecking,
    };

    const emailHotelResult = await pool.query(
      "SELECT valor FROM contenido_web WHERE clave = $1",
      ["footer_email"],
    );
    let emailHotel =
      emailHotelResult.rows[0]?.valor || "info@hotelamanecer.com";
    emailHotel = emailHotel.replace(/&#64;/g, "@");

    await enviarEmailCliente(datosCompletos, emailHotel);
    await enviarEmailHotel(datosCompletos, emailHotel);

    res.status(201).json({
      message: "Reserva creada y emails enviados correctamente",
      reserva: reserva,
      codigoReserva: reserva.codigo_reserva,
      hashSeguro: reserva.hash_seguro,
      tokenPrechecking: reserva.token_prechecking,
    });
  } catch (error) {
    console.error("❌ Error al crear reserva:", error);
    res.status(500).json({
      error: "Error al crear la reserva",
      details: error.message,
    });
  }
});

// GET: Obtener reserva por HASH (público)
router.get("/ver/:hash", async (req, res) => {
  try {
    const {hash} = req.params;
    const reserva = await obtenerReservaPorHash(hash);
    if (!reserva) {
      return res.status(404).json({error: "Reserva no encontrada"});
    }
    res.json(reserva);
  } catch (error) {
    console.error("❌ Error al obtener reserva por hash:", error);
    res.status(500).json({error: "Error al obtener la reserva"});
  }
});

// GET: Obtener reserva por código (legacy)
router.get("/codigo/:codigo", async (req, res) => {
  try {
    const {codigo} = req.params;
    const reserva = await obtenerReservaPorCodigo(codigo);
    if (!reserva) {
      return res.status(404).json({error: "Reserva no encontrada"});
    }
    res.json(reserva);
  } catch (error) {
    console.error("Error al obtener reserva:", error);
    res.status(500).json({error: "Error al obtener la reserva"});
  }
});

// ============================================
// RUTAS PARA ADMIN
// ============================================

// GET: Obtener todas las reservas (ADMIN)
router.get("/", async (req, res) => {
  try {
    const {fecha_entrada, fecha_salida} = req.query;
    const filtros = {fecha_entrada, fecha_salida};
    const reservas = await getReservas(filtros);

    // Log para verificar tokens

    const conToken = reservas.filter((r) => r.token_prechecking).length;

    res.json(reservas);
  } catch (error) {
    console.error("❌ Error al obtener reservas:", error);
    res.status(500).json({error: "Error al obtener las reservas"});
  }
});

// GET: Obtener reserva por ID (ADMIN)
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, h.nombre as habitacion_nombre 
       FROM reservas r
       LEFT JOIN habitaciones h ON r.habitacion_id = h.id
       WHERE r.id = $1`,
      [req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({error: "Reserva no encontrada"});
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al obtener reserva:", error);
    res.status(500).json({error: "Error al obtener la reserva"});
  }
});

// PUT: Actualizar reserva (ADMIN)
router.put("/:id", async (req, res) => {
  try {
    const reserva = await actualizarReserva(req.params.id, req.body);
    if (!reserva) {
      return res.status(404).json({error: "Reserva no encontrada"});
    }
    res.json(reserva);
  } catch (error) {
    console.error("❌ Error al actualizar reserva:", error);
    res.status(500).json({error: "Error al actualizar la reserva"});
  }
});

// DELETE: Eliminar reserva (ADMIN)
router.delete("/:id", async (req, res) => {
  try {
    const reserva = await eliminarReserva(req.params.id);
    if (!reserva) {
      return res.status(404).json({error: "Reserva no encontrada"});
    }
    res.json({
      message: "Reserva eliminada correctamente",
      reserva: reserva,
    });
  } catch (error) {
    console.error("❌ Error al eliminar reserva:", error);
    res.status(500).json({error: "Error al eliminar la reserva"});
  }
});

// POST: Reenviar email de confirmación (ADMIN)
router.post("/:id/reenviar-email", async (req, res) => {
  try {
    // 1. Obtener la reserva con todos sus datos
    const reservaResult = await pool.query(
      `SELECT r.*, h.nombre as habitacion_nombre, h.descripcion as habitacion_descripcion,
              h.caracteristicas as habitacion_caracteristicas, h.imagen as habitacion_imagen,
              h.precio as habitacion_precio
       FROM reservas r
       LEFT JOIN habitaciones h ON r.habitacion_id = h.id
       WHERE r.id = $1`,
      [req.params.id],
    );

    if (reservaResult.rows.length === 0) {
      return res.status(404).json({error: "Reserva no encontrada"});
    }

    const reserva = reservaResult.rows[0];

    // 2. Obtener el email del hotel
    const emailHotelResult = await pool.query(
      "SELECT valor FROM contenido_web WHERE clave = $1",
      ["footer_email"],
    );
    let emailHotel =
      emailHotelResult.rows[0]?.valor || "info@hotelamanecer.com";
    emailHotel = emailHotel.replace(/&#64;/g, "@");

    // 3. Preparar los datos para el email (mismo formato que al crear)
    const habitacion = {
      id: reserva.habitacion_id,
      nombre: reserva.habitacion_nombre,
      descripcion: reserva.habitacion_descripcion,
      caracteristicas: reserva.habitacion_caracteristicas || [],
      imagen: reserva.habitacion_imagen,
      precio:
        reserva.habitacion_precio ||
        reserva.importe_total /
          Math.ceil(
            (new Date(reserva.fecha_salida) - new Date(reserva.fecha_entrada)) /
              (1000 * 60 * 60 * 24),
          ) ||
        0,
    };

    const noches = Math.ceil(
      (new Date(reserva.fecha_salida) - new Date(reserva.fecha_entrada)) /
        (1000 * 60 * 60 * 24),
    );

    const datosCompletos = {
      habitacion: habitacion,
      fechas: {
        entrada: reserva.fecha_entrada,
        salida: reserva.fecha_salida,
        noches: noches,
      },
      huespedes: {
        adultos: reserva.adultos,
        ninos: reserva.ninos || 0,
      },
      desayuno: reserva.desayuno || false,
      cliente: {
        nombre: reserva.nombre_cliente,
        apellidos: reserva.apellidos_cliente || "",
        email: reserva.email_cliente,
        telefono: reserva.telefono_cliente,
        dni: reserva.dni_cliente || "",
      },
      importe: parseFloat(reserva.importe_total),
      solicitudEspecial: reserva.solicitud_especial || "",
      horaEstimadaLlegada: reserva.hora_llegada || "",
      codigoReserva: reserva.codigo_reserva,
      hashSeguro: reserva.hash_seguro,
      tokenPrechecking: reserva.token_prechecking,
    };

    // 4. Enviar los emails usando el servicio existente
    const {
      enviarEmailCliente,
      enviarEmailHotel,
    } = require("../services/emailService");

    await enviarEmailCliente(datosCompletos, emailHotel);
    await enviarEmailHotel(datosCompletos, emailHotel);

    res.json({
      message: "Email reenviado correctamente",
      email: reserva.email_cliente,
      codigo: reserva.codigo_reserva,
    });
  } catch (error) {
    console.error("❌ Error al reenviar email:", error);
    res
      .status(500)
      .json({error: "Error al reenviar el email", details: error.message});
  }
});
// ✅ Buscar reserva por código de reserva
router.get("/codigo/:codigo", async (req, res) => {
  try {
    const {codigo} = req.params;

    const result = await pool.query(
      `SELECT r.*, h.nombre as habitacion_nombre, h.descripcion as habitacion_descripcion, 
              h.caracteristicas as habitacion_caracteristicas, h.imagen as habitacion_imagen, 
              h.precio as habitacion_precio
       FROM reservas r
       LEFT JOIN habitaciones h ON r.habitacion_id = h.id
       WHERE r.codigo_reserva = $1`,
      [codigo],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: "Reserva no encontrada"});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al buscar reserva por código:", error);
    res.status(500).json({error: "Error al buscar reserva"});
  }
});
module.exports = router;

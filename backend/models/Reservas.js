// backend/models/Reservas.js

const {pool} = require("../config/database");

// ✅ IMPORTAMOS LAS DOS COSAS POR SEPARADO
const {
  generarCodigosReserva,
  generarTokenPrechecking, // ✅ Ahora esto ya existe y funciona
} = require("../utils/generarCodigo");

// Buscar habitaciones disponibles según capacidad y fechas
const buscarHabitacionesDisponibles = async (
  adultos,
  ninos,
  fecha_entrada,
  fecha_salida,
) => {
  try {
    const capacidadRequerida = parseInt(adultos) + parseInt(ninos);

    const query = `
      SELECT 
        h.*,
        CASE 
          WHEN r.id IS NOT NULL THEN false
          ELSE true
        END as disponible
      FROM habitaciones h
      LEFT JOIN reservas r ON h.id = r.habitacion_id 
        AND (
          (r.fecha_entrada < $2 AND r.fecha_salida > $1)
          OR (r.fecha_entrada <= $1 AND r.fecha_salida >= $1)
          OR (r.fecha_entrada <= $2 AND r.fecha_salida >= $2)
        )
      WHERE h.activo = true
        AND (h.capacidad_adultos + h.capacidad_ninos) >= $3
        AND r.id IS NULL
      ORDER BY h.precio ASC;
    `;

    const result = await pool.query(query, [
      fecha_entrada,
      fecha_salida,
      capacidadRequerida,
    ]);

    return result.rows;
  } catch (error) {
    console.error("Error al buscar habitaciones disponibles:", error);
    throw error;
  }
};

// Crear una nueva reserva
const crearReserva = async (datos) => {
  const {
    habitacion_id,
    fecha_entrada,
    fecha_salida,
    adultos,
    ninos,
    desayuno,
    importe_total,
    nombre_cliente,
    apellidos_cliente,
    email_cliente,
    telefono_cliente,
    dni_cliente,
    solicitud_especial,
    hora_llegada,
  } = datos;

  // ✅ GENERAR AMBOS CÓDIGOS
  const {codigo_amigable, hash_seguro} = generarCodigosReserva();
  const tokenPrechecking = generarTokenPrechecking();

  // ✅ INSERT CORREGIDO - SIN estado
  const query = `
    INSERT INTO reservas (
      habitacion_id,
      fecha_entrada,
      fecha_salida,
      adultos,
      ninos,
      desayuno,
      importe_total,
      nombre_cliente,
      apellidos_cliente,
      email_cliente,
      telefono_cliente,
      dni_cliente,
      solicitud_especial,
      hora_llegada,
      codigo_reserva,
      hash_seguro,
      token_prechecking,
      prechecking_realizado,
      fecha_creacion
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
    RETURNING *;
  `;

  const values = [
    habitacion_id,
    fecha_entrada,
    fecha_salida,
    adultos,
    ninos || 0,
    desayuno || false,
    importe_total,
    nombre_cliente,
    apellidos_cliente || "",
    email_cliente,
    telefono_cliente,
    dni_cliente || "",
    solicitud_especial || "",
    hora_llegada || "",
    codigo_amigable, // $15
    hash_seguro, // $16
    tokenPrechecking, // $17
    false, // $18 - prechecking_realizado
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("❌ Error al crear reserva:", error);
    throw error;
  }
};

// ✅ OBTENER RESERVA POR CÓDIGO AMIGABLE (Para la pantalla del cliente)
const obtenerReservaPorCodigo = async (codigo) => {
  try {
    const query = `
      SELECT 
        r.*,
        h.nombre as habitacion_nombre,
        h.descripcion as habitacion_descripcion,
        h.caracteristicas as habitacion_caracteristicas,
        h.imagen as habitacion_imagen,
        h.precio as habitacion_precio
      FROM reservas r
      LEFT JOIN habitaciones h ON r.habitacion_id = h.id
      WHERE r.codigo_reserva = $1
    `;
    const result = await pool.query(query, [codigo]);
    return result.rows[0];
  } catch (error) {
    console.error("Error al obtener reserva por código:", error);
    throw error;
  }
};

// ✅ NUEVA FUNCIÓN: OBTENER RESERVA POR HASH SEGURO (Para el enlace del email)
const obtenerReservaPorHash = async (hash) => {
  try {
    const query = `
      SELECT 
        r.*,
        h.nombre as habitacion_nombre,
        h.descripcion as habitacion_descripcion,
        h.caracteristicas as habitacion_caracteristicas,
        h.imagen as habitacion_imagen,
        h.precio as habitacion_precio
      FROM reservas r
      LEFT JOIN habitaciones h ON r.habitacion_id = h.id
      WHERE r.hash_seguro = $1
    `;
    const result = await pool.query(query, [hash]);
    return result.rows[0];
  } catch (error) {
    console.error("Error al obtener reserva por hash:", error);
    throw error;
  }
};

// ✅ FUNCIÓN PARA VERIFICAR TOKEN DE PRECHECKING
const verificarTokenPrechecking = async (token) => {
  try {
    const query = `
      SELECT 
        id, 
        codigo_reserva, 
        nombre_cliente, 
        email_cliente, 
        fecha_entrada, 
        fecha_salida, 
        prechecking_realizado
      FROM reservas 
      WHERE token_prechecking = $1 
        AND prechecking_realizado = FALSE
        
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  } catch (error) {
    console.error("Error al verificar token:", error);
    throw error;
  }
};

// ✅ FUNCIÓN PARA REALIZAR PRECHECKING
const realizarPrechecking = async (token, datos) => {
  const {documentoIdentidad, vehiculoMatricula, observaciones} = datos;
  try {
    const reservaResult = await pool.query(
      `SELECT id FROM reservas 
       WHERE token_prechecking = $1 
         AND prechecking_realizado = FALSE`,
      [token],
    );

    if (reservaResult.rows.length === 0) {
      throw new Error("Token inválido o pre-checking ya realizado");
    }

    const reservaId = reservaResult.rows[0].id;

    const query = `
      UPDATE reservas 
      SET 
        prechecking_realizado = TRUE,
        fecha_prechecking = NOW(),
        documento_identidad = $1,
        vehiculo_matricula = $2,
        observaciones_prechecking = $3,
        token_prechecking = NULL
      WHERE id = $4
      RETURNING *
    `;

    const values = [
      documentoIdentidad || "",
      vehiculoMatricula || "",
      observaciones || "",
      reservaId,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
  } catch (error) {
    console.error("Error al realizar pre-checking:", error);
    throw error;
  }
};

// ✅ OPTIMIZADO: Obtener reservas con límite y selección de campos específicos
const getReservas = async (filtros = {}) => {
  // ✅ Seleccionar solo los campos necesarios para evitar sobrecarga
  let query = `
    SELECT 
      r.id, 
      r.codigo_reserva, 
      r.nombre_cliente, 
      r.apellidos_cliente, 
      r.email_cliente, 
      r.telefono_cliente, 
      r.dni_cliente, 
      r.fecha_entrada, 
      r.fecha_salida, 
      r.adultos, 
      r.ninos, 
      r.desayuno, 
      r.importe_total, 
      r.prechecking_realizado, 
      r.fecha_prechecking, 
      r.fecha_creacion,
      r.dni_frontal_url,
      r.dni_trasero_url,
      r.hora_llegada,
      r.token_prechecking,
      r.solicitud_especial,
      h.nombre as habitacion_nombre 
    FROM reservas r
    LEFT JOIN habitaciones h ON r.habitacion_id = h.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  // ✅ Si no se especifica fecha, solo traer reservas de los últimos 90 días
  if (!filtros.fecha_entrada && !filtros.fecha_salida) {
    query += ` AND r.fecha_entrada >= NOW() - INTERVAL '90 days'`;
  }

  if (filtros.fecha_entrada) {
    query += ` AND r.fecha_entrada >= $${paramIndex}`;
    params.push(filtros.fecha_entrada);
    paramIndex++;
  }

  if (filtros.fecha_salida) {
    query += ` AND r.fecha_salida <= $${paramIndex}`;
    params.push(filtros.fecha_salida);
    paramIndex++;
  }

  // ✅ LIMITAR A 100 RESULTADOS MÁXIMO para evitar problemas de memoria
  query += ` ORDER BY r.fecha_entrada DESC, r.id DESC LIMIT 100`;

  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("❌ Error en getReservas:", error);
    throw error;
  }
};

// Actualizar reserva completa
const actualizarReserva = async (id, datos) => {
  const {
    nombre_cliente,
    apellidos_cliente,
    email_cliente,
    telefono_cliente,
    dni_cliente,
    fecha_entrada,
    fecha_salida,
    adultos,
    ninos,
    desayuno,
    importe_total,
    prechecking_realizado,
  } = datos;

  const result = await pool.query(
    `UPDATE reservas 
     SET nombre_cliente = $1, apellidos_cliente = $2, email_cliente = $3,
         telefono_cliente = $4, dni_cliente = $5, fecha_entrada = $6,
         fecha_salida = $7, adultos = $8, ninos = $9, desayuno = $10,
         importe_total = $11, prechecking_realizado = $12
     WHERE id = $13
     RETURNING *`,
    [
      nombre_cliente,
      apellidos_cliente,
      email_cliente,
      telefono_cliente,
      dni_cliente,
      fecha_entrada,
      fecha_salida,
      adultos,
      ninos,
      desayuno,
      importe_total,
      prechecking_realizado || false,
      id,
    ],
  );
  return result.rows[0];
};

// Eliminar reserva
const eliminarReserva = async (id) => {
  const result = await pool.query(
    "DELETE FROM reservas WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
};

// Reenviar email de confirmación
const reenviarEmailConfirmacion = async (id) => {
  try {
    const result = await pool.query(
      `SELECT 
        r.*, 
        h.nombre as habitacion_nombre, 
        h.descripcion as habitacion_descripcion,
        h.caracteristicas as habitacion_caracteristicas, 
        h.imagen as habitacion_imagen,
        h.precio as habitacion_precio
       FROM reservas r
       LEFT JOIN habitaciones h ON r.habitacion_id = h.id
       WHERE r.id = $1`,
      [id],
    );
    return result.rows[0];
  } catch (error) {
    console.error("❌ Error al obtener reserva para reenviar email:", error);
    throw error;
  }
};

module.exports = {
  pool,
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
};

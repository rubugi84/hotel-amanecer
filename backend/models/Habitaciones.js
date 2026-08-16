// backend/models/Habitaciones.js
const {pool} = require("../config/database");

// Obtener todas las habitaciones (incluyendo inactivas para admin)
const getHabitaciones = async () => {
  const result = await pool.query("SELECT * FROM habitaciones ORDER BY id ASC");
  return result.rows;
};

// Obtener habitación por ID
const getHabitacionById = async (id) => {
  const result = await pool.query("SELECT * FROM habitaciones WHERE id = $1", [
    id,
  ]);
  return result.rows[0];
};

// Crear nueva habitación
const crearHabitacion = async (datos) => {
  const {
    nombre,
    descripcion,
    precio,
    imagen,
    caracteristicas,
    capacidad_adultos,
    capacidad_ninos,
    activo,
  } = datos;

  const result = await pool.query(
    `INSERT INTO habitaciones 
     (nombre, descripcion, precio, imagen, caracteristicas, capacidad_adultos, capacidad_ninos, activo, fecha_actualizacion)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
     RETURNING *`,
    [
      nombre,
      descripcion,
      precio,
      imagen,
      caracteristicas || [],
      capacidad_adultos || 2,
      capacidad_ninos || 1,
      activo !== undefined ? activo : true,
    ],
  );
  return result.rows[0];
};

// Actualizar habitación
const actualizarHabitacion = async (id, datos) => {
  const {
    nombre,
    descripcion,
    precio,
    imagen,
    caracteristicas,
    capacidad_adultos,
    capacidad_ninos,
    activo,
  } = datos;

  const result = await pool.query(
    `UPDATE habitaciones 
     SET nombre = $1, descripcion = $2, precio = $3, imagen = $4, 
         caracteristicas = $5, capacidad_adultos = $6, capacidad_ninos = $7, 
         activo = $8, fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = $9
     RETURNING *`,
    [
      nombre,
      descripcion,
      precio,
      imagen,
      caracteristicas || [],
      capacidad_adultos || 2,
      capacidad_ninos || 1,
      activo !== undefined ? activo : true,
      id,
    ],
  );
  return result.rows[0];
};

// Eliminar habitación
const eliminarHabitacion = async (id) => {
  const result = await pool.query(
    "DELETE FROM habitaciones WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
};

module.exports = {
  getHabitaciones,
  getHabitacionById,
  crearHabitacion,
  actualizarHabitacion,
  eliminarHabitacion,
};

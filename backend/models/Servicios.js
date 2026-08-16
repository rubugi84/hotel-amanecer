// backend/models/Servicios.js

const {pool} = require("../config/database");

// Obtener todos los servicios
const getServicios = async () => {
  const result = await pool.query(
    "SELECT * FROM servicios WHERE activo = true ORDER BY orden ASC, id ASC",
  );
  return result.rows;
};
const getServiciosAdmin = async () => {
  const result = await pool.query(
    "SELECT * FROM servicios ORDER BY orden ASC, id ASC",
  );
  return result.rows;
};

// Obtener servicio por ID
const getServicioById = async (id) => {
  const result = await pool.query("SELECT * FROM servicios WHERE id = $1", [
    id,
  ]);
  return result.rows[0];
};

// Crear nuevo servicio
const crearServicio = async (datos) => {
  const {titulo, descripcion, icono, orden, activo} = datos;

  const result = await pool.query(
    `INSERT INTO servicios (titulo, descripcion, icono, orden, activo, fecha_actualizacion)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
     RETURNING *`,
    [
      titulo,
      descripcion,
      icono,
      orden || 0,
      activo !== undefined ? activo : true,
    ],
  );
  return result.rows[0];
};

// Actualizar servicio
const actualizarServicio = async (id, datos) => {
  const {titulo, descripcion, icono, orden, activo} = datos;

  const result = await pool.query(
    `UPDATE servicios 
     SET titulo = $1, descripcion = $2, icono = $3, orden = $4, 
         activo = $5, fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [
      titulo,
      descripcion,
      icono,
      orden || 0,
      activo !== undefined ? activo : true,
      id,
    ],
  );
  return result.rows[0];
};

// Eliminar servicio
const eliminarServicio = async (id) => {
  const result = await pool.query(
    "DELETE FROM servicios WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
};

module.exports = {
  getServicios,
  getServiciosAdmin,
  getServicioById,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
};

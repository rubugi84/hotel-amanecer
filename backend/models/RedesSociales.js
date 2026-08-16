// backend/models/RedesSociales.js

const {pool} = require("../config/database");

// Obtener todas las redes sociales (para ADMIN)
const getRedesSocialesAdmin = async () => {
  const result = await pool.query(
    "SELECT * FROM redes_sociales ORDER BY orden ASC, id ASC",
  );
  return result.rows;
};

// Obtener redes sociales activas (para PÚBLICO)
const getRedesSociales = async () => {
  const result = await pool.query(
    "SELECT * FROM redes_sociales WHERE activo = true ORDER BY orden ASC",
  );
  return result.rows;
};

// Obtener red social por ID
const getRedSocialById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM redes_sociales WHERE id = $1",
    [id],
  );
  return result.rows[0];
};

// Crear nueva red social
const crearRedSocial = async (datos) => {
  const {nombre, icono, url, activo, orden} = datos;

  const result = await pool.query(
    `INSERT INTO redes_sociales (nombre, icono, url, activo, orden, fecha_actualizacion)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
     RETURNING *`,
    [nombre, icono, url, activo !== undefined ? activo : true, orden || 0],
  );
  return result.rows[0];
};

// Actualizar red social
const actualizarRedSocial = async (id, datos) => {
  const {nombre, icono, url, activo, orden} = datos;

  const result = await pool.query(
    `UPDATE redes_sociales 
     SET nombre = $1, icono = $2, url = $3, activo = $4, orden = $5, 
         fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [nombre, icono, url, activo !== undefined ? activo : true, orden || 0, id],
  );
  return result.rows[0];
};

// Eliminar red social
const eliminarRedSocial = async (id) => {
  const result = await pool.query(
    "DELETE FROM redes_sociales WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
};

module.exports = {
  getRedesSocialesAdmin,
  getRedesSociales,
  getRedSocialById,
  crearRedSocial,
  actualizarRedSocial,
  eliminarRedSocial,
};

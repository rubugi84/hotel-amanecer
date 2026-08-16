// backend/models/Legal.js

const {pool} = require("../config/database");

const getPaginasLegales = async () => {
  const result = await pool.query(
    "SELECT * FROM paginas_legales ORDER BY id ASC",
  );
  return result.rows;
};

// Obtener página legal por clave (para público)
const getPaginaLegal = async (clave) => {
  const result = await pool.query(
    "SELECT titulo, contenido FROM paginas_legales WHERE clave = $1",
    [clave],
  );
  return result.rows[0];
};

// Obtener página legal por ID
const getPaginaLegalById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM paginas_legales WHERE id = $1",
    [id],
  );
  return result.rows[0];
};

// Crear nueva página legal
const crearPaginaLegal = async (datos) => {
  const {clave, titulo, contenido} = datos;

  const result = await pool.query(
    `INSERT INTO paginas_legales (clave, titulo, contenido, fecha_actualizacion)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     RETURNING *`,
    [clave, titulo, contenido],
  );
  return result.rows[0];
};

// Actualizar página legal
const actualizarPaginaLegal = async (id, datos) => {
  const {clave, titulo, contenido} = datos;

  const result = await pool.query(
    `UPDATE paginas_legales 
     SET clave = $1, titulo = $2, contenido = $3, fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [clave, titulo, contenido, id],
  );
  return result.rows[0];
};

// Eliminar página legal
const eliminarPaginaLegal = async (id) => {
  const result = await pool.query(
    "DELETE FROM paginas_legales WHERE id = $1 RETURNING *",
    [id],
  );
  return result.rows[0];
};

module.exports = {
  getPaginasLegales,
  getPaginaLegal,
  getPaginaLegalById,
  crearPaginaLegal,
  actualizarPaginaLegal,
  eliminarPaginaLegal,
};

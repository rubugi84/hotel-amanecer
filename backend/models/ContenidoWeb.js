// backend/models/ContenidoWeb.js
const {pool} = require("../config/database");

// Función para obtener los textos de una sección específica
const getContenidoBySeccion = async (seccion) => {
  const result = await pool.query(
    "SELECT clave, valor FROM contenido_web WHERE seccion = $1 ORDER BY id ASC",
    [seccion],
  );

  const contenido = {};
  result.rows.forEach((row) => {
    contenido[row.clave] = row.valor;
  });

  return contenido;
};

// ✅ Obtener todas las secciones con su contenido
const getTodasSecciones = async () => {
  const result = await pool.query(
    "SELECT seccion, clave, valor FROM contenido_web WHERE seccion != $1 ORDER BY seccion ASC, id ASC",
    ["about"],
  );

  const secciones = {};
  result.rows.forEach((row) => {
    if (!secciones[row.seccion]) {
      secciones[row.seccion] = {};
    }
    secciones[row.seccion][row.clave] = row.valor;
  });

  return secciones;
};

// ✅ Obtener todas las secciones disponibles
const getSecciones = async () => {
  const result = await pool.query(
    "SELECT DISTINCT seccion FROM contenido_web WHERE seccion != $1 ORDER BY seccion ASC",
    ["about"],
  );
  return result.rows.map((row) => row.seccion);
};

// ✅ Actualizar múltiples claves de una sección
const actualizarSeccion = async (seccion, datos) => {
  for (const [clave, valor] of Object.entries(datos)) {
    const existsQuery =
      "SELECT id FROM contenido_web WHERE clave = $1 AND seccion = $2";
    const existsResult = await pool.query(existsQuery, [clave, seccion]);

    if (existsResult.rows.length > 0) {
      await pool.query(
        `UPDATE contenido_web 
         SET valor = $1, fecha_actualizacion = CURRENT_TIMESTAMP 
         WHERE clave = $2 AND seccion = $3`,
        [valor, clave, seccion],
      );
    } else {
      await pool.query(
        `INSERT INTO contenido_web (clave, valor, seccion, fecha_actualizacion)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [clave, valor, seccion],
      );
    }
  }
};

// ✅ NUEVO: Obtener múltiples claves de cualquier sección
const getContenidoMultiple = async (claves) => {
  if (!claves || !Array.isArray(claves) || claves.length === 0) {
    return [];
  }

  const result = await pool.query(
    "SELECT * FROM contenido_web WHERE clave = ANY($1) ORDER BY id ASC",
    [claves],
  );

  return result.rows;
};

// ✅ NUEVO: Obtener contenido por clave específica
const getContenidoByClave = async (clave) => {
  const result = await pool.query(
    "SELECT * FROM contenido_web WHERE clave = $1",
    [clave],
  );
  return result.rows[0] || null;
};

module.exports = {
  getContenidoBySeccion,
  getTodasSecciones,
  getSecciones,
  actualizarSeccion,
  getContenidoMultiple,
  getContenidoByClave,
};

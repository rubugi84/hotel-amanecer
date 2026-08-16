// backend/models/Administradores.js
const {pool} = require("../config/database");
const bcrypt = require("bcrypt");

// Obtener administrador por usuario
const getAdminByUsuario = async (usuario) => {
  try {
    const query =
      "SELECT * FROM administradores WHERE usuario = $1 AND activo = true";
    const result = await pool.query(query, [usuario]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    // console.error("Error al obtener administrador:", error);
    throw error;
  }
};

// Obtener administrador por ID
const getAdminById = async (id) => {
  try {
    const query =
      "SELECT id, usuario, email, nombre, rol, ultimo_acceso FROM administradores WHERE id = $1 AND activo = true";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    // console.error("Error al obtener administrador por ID:", error);
    throw error;
  }
};

// Verificar credenciales
const verificarCredenciales = async (usuario, password) => {
  try {
    const admin = await getAdminByUsuario(usuario);
    if (!admin) {
      return null;
    }

    const passwordValido = await bcrypt.compare(password, admin.password_hash);

    if (!passwordValido) {
      return null;
    }

    return admin;
  } catch (error) {
    throw error;
  }
};

// Actualizar último acceso
const actualizarUltimoAcceso = async (id) => {
  try {
    const query =
      "UPDATE administradores SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1";
    await pool.query(query, [id]);
  } catch (error) {
    throw error;
  }
};

// ✅ EXPORTAR pool también
module.exports = {
  getAdminByUsuario,
  getAdminById,
  verificarCredenciales,
  actualizarUltimoAcceso,
  pool,
};

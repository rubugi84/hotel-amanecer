// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  verificarCredenciales,
  getAdminById,
  actualizarUltimoAcceso,
  getAdminByUsuario,
  pool,
} = require("../models/Administradores");

// ============================================
// LOGIN
// ============================================
router.post("/login", async (req, res) => {
  try {
    const {usuario, password} = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuario y contraseña son requeridos",
      });
    }

    const admin = await verificarCredenciales(usuario, password);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Usuario o contraseña incorrectos",
      });
    }

    await actualizarUltimoAcceso(admin.id);

    const token = jwt.sign(
      {id: admin.id, usuario: admin.usuario, rol: admin.rol},
      process.env.JWT_SECRET || "mi_secreto_super_seguro",
      {expiresIn: process.env.JWT_EXPIRES_IN || "24h"},
    );

    res.json({
      success: true,
      message: "Login exitoso",
      token,
      admin: {
        id: admin.id,
        usuario: admin.usuario,
        email: admin.email,
        nombre: admin.nombre,
        rol: admin.rol,
      },
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error al iniciar sesión",
    });
  }
});

// ============================================
// VERIFICAR TOKEN
// ============================================
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token no proporcionado",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "mi_secreto_super_seguro",
    );

    const admin = await getAdminById(decoded.id);

    if (!admin) {
      console.warn("⚠️ Admin no encontrado para ID:", decoded.id);
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("❌ Error al verificar token:", error);
    res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
});

// ============================================
// LOGOUT
// ============================================
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Sesión cerrada correctamente",
  });
});

// ============================================
// CRUD DE USUARIOS (ADMIN)
// ============================================

// ✅ GET: Obtener todos los usuarios
router.get("/usuarios", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({success: false, message: "No autorizado"});
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "mi_secreto_super_seguro",
    );

    // Verificar que es admin
    const admin = await getAdminById(decoded.id);
    if (!admin || admin.rol !== "admin") {
      return res.status(403).json({success: false, message: "Acceso denegado"});
    }

    const result = await pool.query(
      `SELECT id, usuario, nombre, email, rol, ultimo_acceso, activo 
       FROM administradores 
       ORDER BY id ASC`,
    );

    res.json({
      success: true,
      usuarios: result.rows,
    });
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res
      .status(500)
      .json({success: false, message: "Error al obtener usuarios"});
  }
});

// ✅ POST: Crear nuevo usuario
router.post("/usuarios", async (req, res) => {
  try {
    const {usuario, nombre, email, rol, password} = req.body;

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({success: false, message: "No autorizado"});
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "mi_secreto_super_seguro",
    );
    const admin = await getAdminById(decoded.id);
    if (!admin || admin.rol !== "admin") {
      return res.status(403).json({success: false, message: "Acceso denegado"});
    }

    // Validar campos
    if (!usuario || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuario, email y contraseña son obligatorios",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres",
      });
    }

    // Verificar que el usuario no existe
    const existe = await pool.query(
      "SELECT id FROM administradores WHERE usuario = $1",
      [usuario],
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un usuario con ese nombre",
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      `INSERT INTO administradores (usuario, nombre, email, password_hash, rol, activo)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, usuario, nombre, email, rol`,
      [usuario, nombre || "", email, passwordHash, rol || "user"],
    );

    res.status(201).json({
      success: true,
      message: "Usuario creado correctamente",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al crear usuario:", error);
    res
      .status(500)
      .json({success: false, message: "Error al crear el usuario"});
  }
});

// ✅ PUT: Actualizar usuario
router.put("/usuarios/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const {nombre, email, rol, password} = req.body;

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({success: false, message: "No autorizado"});
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "mi_secreto_super_seguro",
    );
    const admin = await getAdminById(decoded.id);
    if (!admin || admin.rol !== "admin") {
      return res.status(403).json({success: false, message: "Acceso denegado"});
    }

    // No permitir cambiar el rol de uno mismo
    if (parseInt(id) === decoded.id && rol && rol !== admin.rol) {
      return res.status(400).json({
        success: false,
        message: "No puedes cambiar tu propio rol",
      });
    }

    let query = `UPDATE administradores SET nombre = $1, email = $2, rol = $3`;
    const values = [nombre || "", email, rol || "user"];
    let paramIndex = 4;

    if (password && password.length > 0) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres",
        });
      }
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      query += `, password_hash = $${paramIndex}`;
      values.push(passwordHash);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING id, usuario, nombre, email, rol`;
    values.push(parseInt(id));

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({success: false, message: "Usuario no encontrado"});
    }

    res.json({
      success: true,
      message: "Usuario actualizado correctamente",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);
    res
      .status(500)
      .json({success: false, message: "Error al actualizar el usuario"});
  }
});

// ✅ DELETE: Eliminar usuario
router.delete("/usuarios/:id", async (req, res) => {
  try {
    const {id} = req.params;

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({success: false, message: "No autorizado"});
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "mi_secreto_super_seguro",
    );
    const admin = await getAdminById(decoded.id);
    if (!admin || admin.rol !== "admin") {
      return res.status(403).json({success: false, message: "Acceso denegado"});
    }

    // No permitir eliminar el usuario propio
    if (parseInt(id) === decoded.id) {
      return res.status(400).json({
        success: false,
        message: "No puedes eliminar tu propio usuario",
      });
    }

    const result = await pool.query(
      "DELETE FROM administradores WHERE id = $1 RETURNING id, usuario",
      [parseInt(id)],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({success: false, message: "Usuario no encontrado"});
    }

    res.json({
      success: true,
      message: "Usuario eliminado correctamente",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res
      .status(500)
      .json({success: false, message: "Error al eliminar el usuario"});
  }
});

module.exports = router;

// backend/routes/upload.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ============================================
// CONFIGURACIÓN PARA HABITACIONES - CON MULTER EN MEMORIA
// ============================================
const storageHabitacionMemory = multer.memoryStorage();

const uploadHabitacion = multer({
  storage: storageHabitacionMemory,
  limits: {fileSize: 5 * 1024 * 1024}, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)"));
  },
});

// ============================================
// CONFIGURACIÓN GENERAL (imágenes y TinyMCE)
// ============================================
const storageGeneral = multer.diskStorage({
  destination: (req, file, cb) => {
    const esTinyMCE = req.path === "/tinymce";
    const dir = esTinyMCE ? "./uploads/tinymce" : "./uploads/imagenes";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true});
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);

    const esTinyMCE = req.path === "/tinymce";
    if (esTinyMCE) {
      const cleanName = file.originalname
        .replace(/[^a-zA-Z0-9.]/g, "_")
        .replace(/\s+/g, "_");
      cb(null, cleanName);
    } else {
      cb(null, "img-" + uniqueSuffix + ext);
    }
  },
});

const uploadGeneral = multer({
  storage: storageGeneral,
  limits: {fileSize: 5 * 1024 * 1024}, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)"));
  },
});

// ============================================
// RUTAS
// ============================================

// ✅ RUTA PARA SUBIR IMAGEN DE HABITACIÓN - PROCESAMIENTO MANUAL
router.post("/habitacion", uploadHabitacion.single("imagen"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se recibió ningún archivo",
      });
    }

    // ✅ GENERAR NOMBRE DEL ARCHIVO
    let nombre = req.body.nombre || "habitacion";

    // Limpiar el nombre
    nombre = nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    if (!nombre) {
      nombre = "habitacion_" + Date.now();
    }

    const ext = path.extname(req.file.originalname);
    const nombreFinal = nombre + ext;

    // ✅ GUARDAR EL ARCHIVO MANUALMENTE
    const dir = path.join(__dirname, "../uploads/habitaciones");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true});
    }

    const filePath = path.join(dir, nombreFinal);

    // Guardar el archivo desde el buffer
    fs.writeFileSync(filePath, req.file.buffer);

    const ruta = "/uploads/habitaciones/" + nombreFinal;

    res.json({
      success: true,
      message: "Imagen subida correctamente",
      ruta: ruta,
      filename: nombreFinal,
    });
  } catch (error) {
    console.error("❌ Error al subir imagen de habitación:", error);
    res.status(500).json({
      success: false,
      message: "Error al subir la imagen: " + error.message,
    });
  }
});

// Ruta para subir una imagen (app)
router.post("/", uploadGeneral.single("imagen"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({error: "No se ha enviado ninguna imagen"});
  }
  const ruta = `/uploads/imagenes/${req.file.filename}`;
  res.json({
    message: "Imagen subida correctamente",
    ruta: ruta,
    filename: req.file.filename,
  });
});

// Ruta para TinyMCE
router.post("/tinymce", uploadGeneral.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se recibió ningún archivo",
      });
    }

    const imageUrl =
      req.protocol +
      "://" +
      req.get("host") +
      "/uploads/tinymce/" +
      req.file.filename;

    res.json({
      location: imageUrl,
    });
  } catch (error) {
    console.error("❌ Error al subir imagen desde TinyMCE:", error);
    res.status(500).json({
      success: false,
      message: "Error al subir la imagen",
    });
  }
});

// Ruta para obtener imágenes (opcional)
router.get("/:tipo/:filename", (req, res) => {
  const tipo = req.params.tipo;
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../uploads", tipo, filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({error: "Imagen no encontrada"});
  }
});
router.post("/hero", uploadHabitacion.single("imagen"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se recibió ningún archivo",
      });
    }

    const dir = path.join(__dirname, "../uploads/hero");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true});
    }

    // ✅ NOMBRE FIJO: hero + extensión
    const ext = path.extname(req.file.originalname);
    const nombreFinal = `hero${ext}`; // hero.jpg, hero.png, etc.
    const filePath = path.join(dir, nombreFinal);

    // ✅ Si existe la imagen, la sobrescribe
    fs.writeFileSync(filePath, req.file.buffer);

    const ruta = "/uploads/hero/" + nombreFinal;

    res.json({
      success: true,
      message: "Imagen del hero subida correctamente",
      ruta: ruta,
      filename: nombreFinal,
    });
  } catch (error) {
    console.error("❌ Error al subir imagen del hero:", error);
    res.status(500).json({
      success: false,
      message: "Error al subir la imagen: " + error.message,
    });
  }
});

// ✅ NUEVA RUTA: Eliminar imagen del hero
router.delete("/hero", (req, res) => {
  try {
    const {ruta} = req.query;
    if (!ruta) {
      return res.status(400).json({
        success: false,
        message: "Ruta de imagen requerida",
      });
    }

    const filePath = path.join(__dirname, "..", ruta);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: "Imagen eliminada correctamente",
    });
  } catch (error) {
    console.error("❌ Error al eliminar imagen:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la imagen",
    });
  }
});

module.exports = router;

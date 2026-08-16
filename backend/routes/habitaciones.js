const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const {
  getHabitaciones,
  getHabitacionById,
  crearHabitacion,
  actualizarHabitacion,
  eliminarHabitacion,
} = require("../models/Habitaciones");

// GET: Obtener todas las habitaciones
router.get("/", async (req, res) => {
  try {
    const habitaciones = await getHabitaciones();
    res.json(habitaciones);
  } catch (error) {
    console.error("Error al obtener habitaciones:", error);
    res.status(500).json({error: "Error al obtener las habitaciones"});
  }
});

// GET: Obtener una habitación por ID
router.get("/:id", async (req, res) => {
  try {
    const habitacion = await getHabitacionById(req.params.id);
    if (!habitacion) {
      return res.status(404).json({error: "Habitación no encontrada"});
    }
    res.json(habitacion);
  } catch (error) {
    console.error("Error al obtener habitación:", error);
    res.status(500).json({error: "Error al obtener la habitación"});
  }
});

// POST: Crear nueva habitación
router.post("/", async (req, res) => {
  try {
    const habitacion = await crearHabitacion(req.body);
    res.status(201).json(habitacion);
  } catch (error) {
    console.error("Error al crear habitación:", error);
    res.status(500).json({error: "Error al crear la habitación"});
  }
});

// PUT: Actualizar habitación
router.put("/:id", async (req, res) => {
  try {
    const habitacion = await actualizarHabitacion(req.params.id, req.body);
    if (!habitacion) {
      return res.status(404).json({error: "Habitación no encontrada"});
    }
    res.json(habitacion);
  } catch (error) {
    console.error("Error al actualizar habitación:", error);
    res.status(500).json({error: "Error al actualizar la habitación"});
  }
});

// DELETE: Eliminar habitación
router.delete("/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const {imagen} = req.query; // ✅ CAMBIO: usar query params

    const habitacion = await eliminarHabitacion(id);

    if (!habitacion) {
      return res.status(404).json({error: "Habitación no encontrada"});
    }

    // Eliminar la imagen del servidor si existe
    if (imagen) {
      try {
        const imagePath = path.join(__dirname, "..", imagen);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error("⚠️ Error al eliminar imagen:", error);
      }
    }

    res.json({
      message: "Habitación eliminada correctamente",
      habitacion: habitacion,
    });
  } catch (error) {
    console.error("Error al eliminar habitación:", error);
    res.status(500).json({error: "Error al eliminar la habitación"});
  }
});

async function eliminarArchivoImagen(imagenPath) {
  try {
    // Construir la ruta completa de la imagen
    // imagenPath viene como "/uploads/habitaciones/habitacion_roja.jpg"
    const imagePath = path.join(__dirname, "..", imagenPath);

    // Verificar si el archivo existe
    if (fs.existsSync(imagePath)) {
      // Eliminar el archivo
      fs.unlinkSync(imagePath);

      // Intentar eliminar la carpeta si está vacía
      const dirPath = path.dirname(imagePath);
      try {
        const files = fs.readdirSync(dirPath);
        if (files.length === 0) {
          fs.rmdirSync(dirPath);
        }
      } catch (dirError) {
        // La carpeta no se puede eliminar, ignorar
      }
    }
  } catch (error) {
    console.error("⚠️ Error al eliminar imagen:", error);
    // No lanzamos el error para no interrumpir la eliminación de la habitación
  }
}

module.exports = router;

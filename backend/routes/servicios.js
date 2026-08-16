// backend/routes/servicios.js

const express = require("express");
const router = express.Router();
const {
  getServicios,
  getServicioById,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
  getServiciosAdmin,
} = require("../models/Servicios");

// GET: Obtener todos los servicios
router.get("/", async (req, res) => {
  try {
    const servicios = await getServicios();
    res.json(servicios);
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    res.status(500).json({error: "Error al obtener los servicios"});
  }
});

router.get("/admin", async (req, res) => {
  try {
    const servicios = await getServiciosAdmin();
    res.json(servicios);
  } catch (error) {
    console.error("Error al obtener servicios para admin:", error);
    res.status(500).json({error: "Error al obtener los servicios"});
  }
});

// GET: Obtener servicio por ID
router.get("/:id", async (req, res) => {
  try {
    const servicio = await getServicioById(req.params.id);
    if (!servicio) {
      return res.status(404).json({error: "Servicio no encontrado"});
    }
    res.json(servicio);
  } catch (error) {
    console.error("Error al obtener servicio:", error);
    res.status(500).json({error: "Error al obtener el servicio"});
  }
});

// POST: Crear nuevo servicio
router.post("/", async (req, res) => {
  try {
    const servicio = await crearServicio(req.body);
    res.status(201).json(servicio);
  } catch (error) {
    console.error("Error al crear servicio:", error);
    res.status(500).json({error: "Error al crear el servicio"});
  }
});

// PUT: Actualizar servicio
router.put("/:id", async (req, res) => {
  try {
    const servicio = await actualizarServicio(req.params.id, req.body);
    if (!servicio) {
      return res.status(404).json({error: "Servicio no encontrado"});
    }
    res.json(servicio);
  } catch (error) {
    console.error("Error al actualizar servicio:", error);
    res.status(500).json({error: "Error al actualizar el servicio"});
  }
});

// DELETE: Eliminar servicio
router.delete("/:id", async (req, res) => {
  try {
    const servicio = await eliminarServicio(req.params.id);
    if (!servicio) {
      return res.status(404).json({error: "Servicio no encontrado"});
    }
    res.json({
      message: "Servicio eliminado correctamente",
      servicio: servicio,
    });
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    res.status(500).json({error: "Error al eliminar el servicio"});
  }
});

module.exports = router;

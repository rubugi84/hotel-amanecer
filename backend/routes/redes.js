// backend/routes/redes.js

const express = require("express");
const router = express.Router();
const {
  getRedesSocialesAdmin,
  getRedesSociales,
  getRedSocialById,
  crearRedSocial,
  actualizarRedSocial,
  eliminarRedSocial,
} = require("../models/RedesSociales");

// GET: Obtener todas las redes sociales (para ADMIN)
router.get("/", async (req, res) => {
  try {
    const redes = await getRedesSocialesAdmin();
    res.json(redes);
  } catch (error) {
    console.error("Error al obtener redes sociales:", error);
    res.status(500).json({error: "Error al obtener las redes sociales"});
  }
});

// ✅ GET: Obtener redes sociales activas (para PÚBLICO)
router.get("/activas", async (req, res) => {
  try {
    const redes = await getRedesSociales();
    res.json(redes);
  } catch (error) {
    console.error("Error al obtener redes sociales activas:", error);
    res
      .status(500)
      .json({error: "Error al obtener las redes sociales activas"});
  }
});

// GET: Obtener red social por ID
router.get("/:id", async (req, res) => {
  try {
    const red = await getRedSocialById(req.params.id);
    if (!red) {
      return res.status(404).json({error: "Red social no encontrada"});
    }
    res.json(red);
  } catch (error) {
    console.error("Error al obtener red social:", error);
    res.status(500).json({error: "Error al obtener la red social"});
  }
});

// POST: Crear nueva red social
router.post("/", async (req, res) => {
  try {
    const red = await crearRedSocial(req.body);
    res.status(201).json(red);
  } catch (error) {
    console.error("Error al crear red social:", error);
    res.status(500).json({error: "Error al crear la red social"});
  }
});

// PUT: Actualizar red social
router.put("/:id", async (req, res) => {
  try {
    const red = await actualizarRedSocial(req.params.id, req.body);
    if (!red) {
      return res.status(404).json({error: "Red social no encontrada"});
    }
    res.json(red);
  } catch (error) {
    console.error("Error al actualizar red social:", error);
    res.status(500).json({error: "Error al actualizar la red social"});
  }
});

// DELETE: Eliminar red social
router.delete("/:id", async (req, res) => {
  try {
    const red = await eliminarRedSocial(req.params.id);
    if (!red) {
      return res.status(404).json({error: "Red social no encontrada"});
    }
    res.json({
      message: "Red social eliminada correctamente",
      red: red,
    });
  } catch (error) {
    console.error("Error al eliminar red social:", error);
    res.status(500).json({error: "Error al eliminar la red social"});
  }
});

module.exports = router;

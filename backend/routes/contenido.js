// backend/routes/contenido.js
const express = require("express");
const router = express.Router();
const {
  getContenidoBySeccion,
  getTodasSecciones,
  getSecciones,
  actualizarSeccion,
} = require("../models/ContenidoWeb");
const {pool} = require("../config/database");

// GET: Obtener contenido de una sección
router.get("/seccion/:seccion", async (req, res) => {
  try {
    const contenido = await getContenidoBySeccion(req.params.seccion);
    res.json(contenido);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({error: "Error al obtener el contenido"});
  }
});

// ✅ GET: Obtener todas las secciones
router.get("/secciones", async (req, res) => {
  try {
    const secciones = await getTodasSecciones();
    res.json(secciones);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({error: "Error al obtener las secciones"});
  }
});

// ✅ GET: Obtener lista de secciones
router.get("/secciones/lista", async (req, res) => {
  try {
    const secciones = await getSecciones();
    res.json(secciones);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({error: "Error al obtener la lista de secciones"});
  }
});

// ✅ PUT: Actualizar sección completa
router.put("/seccion/:seccion", async (req, res) => {
  try {
    const {seccion} = req.params;
    const datos = req.body;

    await actualizarSeccion(seccion, datos);

    const contenidoActualizado = await getContenidoBySeccion(seccion);

    res.json({
      success: true,
      message: `Contenido de "${seccion}" actualizado correctamente`,
      data: contenidoActualizado,
    });
  } catch (error) {
    console.error("❌ Error al actualizar contenido:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el contenido",
      error: error.message,
    });
  }
});

module.exports = router;

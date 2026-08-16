// backend/routes/legal.js

const express = require("express");
const router = express.Router();
const {
  getPaginasLegales,
  getPaginaLegal,
  getPaginaLegalById,
  crearPaginaLegal,
  actualizarPaginaLegal,
  eliminarPaginaLegal,
} = require("../models/Legal");

// GET: Obtener todas las páginas legales (para ADMIN)
router.get("/", async (req, res) => {
  try {
    const paginas = await getPaginasLegales();
    res.json(paginas);
  } catch (error) {
    console.error("Error al obtener páginas legales:", error);
    res.status(500).json({error: "Error al obtener las páginas legales"});
  }
});

// GET: Obtener página legal por clave (para PÚBLICO)
router.get("/:clave", async (req, res) => {
  try {
    const pagina = await getPaginaLegal(req.params.clave);
    if (!pagina) {
      return res.status(404).json({error: "Página no encontrada"});
    }
    res.json(pagina);
  } catch (error) {
    console.error("Error al obtener página legal:", error);
    res.status(500).json({error: "Error al obtener el contenido legal"});
  }
});

// GET: Obtener página legal por ID (para ADMIN)
router.get("/id/:id", async (req, res) => {
  try {
    const pagina = await getPaginaLegalById(req.params.id);
    if (!pagina) {
      return res.status(404).json({error: "Página no encontrada"});
    }
    res.json(pagina);
  } catch (error) {
    console.error("Error al obtener página legal:", error);
    res.status(500).json({error: "Error al obtener la página legal"});
  }
});

// POST: Crear nueva página legal (ADMIN)
router.post("/", async (req, res) => {
  try {
    const pagina = await crearPaginaLegal(req.body);
    res.status(201).json(pagina);
  } catch (error) {
    console.error("Error al crear página legal:", error);
    res.status(500).json({error: "Error al crear la página legal"});
  }
});

// PUT: Actualizar página legal (ADMIN)
router.put("/:id", async (req, res) => {
  try {
    const pagina = await actualizarPaginaLegal(req.params.id, req.body);
    if (!pagina) {
      return res.status(404).json({error: "Página no encontrada"});
    }
    res.json(pagina);
  } catch (error) {
    console.error("Error al actualizar página legal:", error);
    res.status(500).json({error: "Error al actualizar la página legal"});
  }
});

// DELETE: Eliminar página legal (ADMIN)
router.delete("/:id", async (req, res) => {
  try {
    const pagina = await eliminarPaginaLegal(req.params.id);
    if (!pagina) {
      return res.status(404).json({error: "Página no encontrada"});
    }
    res.json({
      message: "Página legal eliminada correctamente",
      pagina: pagina,
    });
  } catch (error) {
    console.error("Error al eliminar página legal:", error);
    res.status(500).json({error: "Error al eliminar la página legal"});
  }
});

module.exports = router;

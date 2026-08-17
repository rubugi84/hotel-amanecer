const express = require("express");
const router = express.Router();
const {
  getContenidoBySeccion,
  getTodasSecciones,
  getSecciones,
  actualizarSeccion,
  getContenidoMultiple,
  getContenidoByClave,
} = require("../models/ContenidoWeb");

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

// ============================================
// ✅ NUEVOS ENDPOINTS PARA EL COMPONENTE DE CONTACTO
// ============================================

// ✅ GET: Obtener contenido por clave
router.get("/clave/:clave", async (req, res) => {
  try {
    const {clave} = req.params;
    const contenido = await getContenidoByClave(clave);

    if (!contenido) {
      return res.status(404).json({error: "Contenido no encontrado"});
    }

    res.json(contenido);
  } catch (error) {
    console.error("Error al obtener contenido por clave:", error);
    res.status(500).json({error: "Error al obtener contenido"});
  }
});

// ✅ POST: Obtener múltiples claves
router.post("/multiples", async (req, res) => {
  try {
    const {claves} = req.body;

    if (!claves || !Array.isArray(claves) || claves.length === 0) {
      return res.status(400).json({error: "Se requiere un array de claves"});
    }

    const contenido = await getContenidoMultiple(claves);
    res.json(contenido);
  } catch (error) {
    console.error("Error al obtener múltiples claves:", error);
    res.status(500).json({error: "Error al obtener contenido"});
  }
});

// ✅ GET: Obtener todas las secciones con su contenido (formato clave-valor)
router.get("/secciones/completo", async (req, res) => {
  try {
    const secciones = await getTodasSecciones();
    res.json(secciones);
  } catch (error) {
    console.error("Error al obtener secciones completas:", error);
    res.status(500).json({error: "Error al obtener secciones"});
  }
});

module.exports = router;

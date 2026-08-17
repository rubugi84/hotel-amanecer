const express = require("express");
const router = express.Router();
const {pool} = require("../config/database");

// ✅ Obtener estadísticas del dashboard
router.get("/estadisticas", async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Obtener el lunes de esta semana
    const diaSemana = hoy.getDay();
    const diffLunes = diaSemana === 0 ? 6 : diaSemana - 1; // Si es domingo (0), restar 6 para ir al lunes
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diffLunes);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    const hoyStr = hoy.toISOString().split("T")[0];
    const lunesStr = lunes.toISOString().split("T")[0];
    const domingoStr = domingo.toISOString().split("T")[0];

    console.log(
      `📊 Estadísticas - Hoy: ${hoyStr}, Lunes: ${lunesStr}, Domingo: ${domingoStr}`,
    );

    // 1. Reservas de hoy (fecha_entrada = hoy)
    const reservasHoyResult = await pool.query(
      `SELECT COUNT(*) as total FROM reservas 
       WHERE fecha_entrada = $1 AND estado != 'cancelada'`,
      [hoyStr],
    );
    const reservasHoy = parseInt(reservasHoyResult.rows[0].total);

    // 2. Reservas de esta semana (lunes a domingo)
    const reservasSemanaResult = await pool.query(
      `SELECT COUNT(*) as total FROM reservas 
       WHERE fecha_entrada >= $1 AND fecha_entrada <= $2 AND estado != 'cancelada'`,
      [lunesStr, domingoStr],
    );
    const reservasSemana = parseInt(reservasSemanaResult.rows[0].total);

    // 3. Pre-checkings pendientes (fecha_entrada >= hoy y prechecking_realizado = false)
    const precheckingsPendientesResult = await pool.query(
      `SELECT COUNT(*) as total FROM reservas 
       WHERE fecha_entrada >= $1 AND prechecking_realizado = false AND estado != 'cancelada'`,
      [hoyStr],
    );
    const precheckingsPendientes = parseInt(
      precheckingsPendientesResult.rows[0].total,
    );

    // 4. Habitaciones disponibles (activas y sin reservas para hoy)
    const habitacionesDisponiblesResult = await pool.query(
      `SELECT COUNT(*) as total FROM habitaciones h
       WHERE h.activo = true 
       AND NOT EXISTS (
         SELECT 1 FROM reservas r 
         WHERE r.habitacion_id = h.id 
         AND r.fecha_entrada <= $1 
         AND r.fecha_salida > $1 
         AND r.estado != 'cancelada'
       )`,
      [hoyStr],
    );
    const habitacionesDisponibles = parseInt(
      habitacionesDisponiblesResult.rows[0].total,
    );

    res.json({
      success: true,
      data: {
        reservasHoy,
        reservasSemana,
        precheckingsPendientes,
        habitacionesDisponibles,
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message,
    });
  }
});

// ✅ Obtener reservas recientes para el dashboard
router.get("/reservas/recientes", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(
      `SELECT r.*, h.nombre as habitacion_nombre 
       FROM reservas r
       LEFT JOIN habitaciones h ON r.habitacion_id = h.id
       ORDER BY r.fecha_creacion DESC
       LIMIT $1`,
      [limit],
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("❌ Error al obtener reservas recientes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener reservas recientes",
    });
  }
});

// ✅ Obtener ocupación por día (para gráficos)
router.get("/ocupacion", async (req, res) => {
  try {
    const {dias} = req.query;
    const numDias = parseInt(dias) || 7;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaInicio = new Date(hoy);
    fechaInicio.setDate(hoy.getDate() - numDias);
    const fechaInicioStr = fechaInicio.toISOString().split("T")[0];
    const hoyStr = hoy.toISOString().split("T")[0];

    const result = await pool.query(
      `SELECT 
        fecha_entrada,
        COUNT(*) as total_reservas,
        COUNT(DISTINCT habitacion_id) as habitaciones_ocupadas
       FROM reservas
       WHERE fecha_entrada >= $1 AND fecha_entrada <= $2 AND estado != 'cancelada'
       GROUP BY fecha_entrada
       ORDER BY fecha_entrada ASC`,
      [fechaInicioStr, hoyStr],
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("❌ Error al obtener ocupación:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener ocupación",
    });
  }
});

module.exports = router;

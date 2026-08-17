// backend/server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: {policy: "same-site"},
  }),
);
app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  }),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// ============================================
// ✅ RATE LIMITING - DESACTIVADO EN DESARROLLO
// ============================================
const isProduction = process.env.NODE_ENV === "production";

// SOLO aplicar rate limiting en producción
if (isProduction) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      error: "Demasiadas peticiones, por favor espera un momento.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", limiter);
} else {
  // ✅ EN DESARROLLO: NO aplicar rate limiting
  // No aplicar ningún rate limiter en desarrollo
}

// Rutas API (Test)
app.get("/api/test", (req, res) => {
  res.json({message: "✅ API del Hotel Rural funcionando correctamente"});
});

// Servir archivos estáticos (imágenes)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================
// RUTAS
// ============================================
const contenidoRoutes = require("./routes/contenido");
const uploadRoutes = require("./routes/upload");
const serviciosRoutes = require("./routes/servicios");
const redesRoutes = require("./routes/redes");
const legalRoutes = require("./routes/legal");
const habitacionesRoutes = require("./routes/habitaciones");
const reservasRoutes = require("./routes/reservas");
const precheckingRoutes = require("./routes/prechecking");
const authRoutes = require("./routes/auth");
const contactoRoutes = require("./routes/contacto");
const adminRoutes = require("./routes/admin");

app.use("/api/contenido", contenidoRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/redes", redesRoutes);
app.use("/api/legal", legalRoutes);
app.use("/api/habitaciones", habitacionesRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/prechecking", precheckingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contacto", contactoRoutes);
app.use("/api/admin", adminRoutes);

// ============================================
// MANEJO DE ERRORES 404
// ============================================
app.use((req, res) => {
  res.status(404).json({error: "Ruta no encontrada"});
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📦 Modo: ${process.env.NODE_ENV || "development"}`);
});

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

// ============================================
// ✅ SOLUCIÓN PARA EL PROXY (Rate Limiting)
// ============================================
// Render usa un proxy (balanceador de carga), por lo que debemos confiar en él
app.set("trust proxy", 1);

// ============================================
// MIDDLEWARE
// ============================================
// Helmet - Seguridad
app.use(
  helmet({
    crossOriginResourcePolicy: {policy: "same-site"},
  }),
);

// ✅ CORS CORREGIDO - Lista de orígenes permitidos
const allowedOrigins = [
  "http://localhost:4200",
  "https://hotel-amanecer-frontend.onrender.com",
  "https://hotel-amanecer-frontend.onrender.com/",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir peticiones sin origen (como Postman o curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("❌ CORS bloqueado para origen:", origin);
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// ============================================
// ✅ RATE LIMITING - SOLO EN PRODUCCIÓN
// ============================================
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 peticiones por ventana
    message: {
      error: "Demasiadas peticiones, por favor espera un momento.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", limiter);
}

// ============================================
// RUTAS PÚBLICAS DE PRUEBA
// ============================================
app.get("/api/test", (req, res) => {
  res.json({message: "✅ API del Hotel Rural funcionando correctamente"});
});

// ============================================
// SERVIDOR DE ARCHIVOS ESTÁTICOS (IMÁGENES)
// ============================================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================
// RUTAS DE LA API
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

// Registrar las rutas
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

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📦 Modo: ${process.env.NODE_ENV || "development"}`);
});

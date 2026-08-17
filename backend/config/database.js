/*const {Pool} = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = {pool};
*/
const {Pool} = require("pg");
const dotenv = require("dotenv");
dotenv.config();

// ✅ Usar DATABASE_URL en lugar de variables separadas
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Opcional: Log para verificar la conexión
console.log("✅ Conectado a la base de datos");

module.exports = {pool};

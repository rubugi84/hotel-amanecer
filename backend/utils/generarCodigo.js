const crypto = require("crypto");

/**
 * Genera un código corto y amigable para el cliente
 * Ejemplo: AMS-20260815-RMQMZ (Hotel + Fecha + 5 caracteres aleatorios)
 */
const generarCodigoAmigable = () => {
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 caracteres
  return `AMS-${fecha}-${random}`;
};

/**
 * Genera un hash largo y seguro (para la URL privada)
 * Ejemplo: A4F8D9C3E2B1F7A6C5D4E3F2A1B0C9D8 (32 caracteres)
 */
const generarHashSeguro = () => {
  return crypto.randomBytes(16).toString("hex").toUpperCase();
};

/**
 * Genera un token largo y seguro para el Pre-checking
 * Ejemplo: 48 caracteres hexadecimales
 */
const generarTokenPrechecking = () => {
  return crypto.randomBytes(24).toString("hex");
};

/**
 * Devuelve un objeto con ambos códigos para guardar en la BD
 */
const generarCodigosReserva = () => {
  return {
    codigo_amigable: generarCodigoAmigable(),
    hash_seguro: generarHashSeguro(),
  };
};

module.exports = {
  generarCodigoAmigable,
  generarHashSeguro,
  generarTokenPrechecking, // ✅ Ahora exportamos esta función también
  generarCodigosReserva,
};

// backend/services/ocr.service.js
const Tesseract = require("tesseract.js");
const fs = require("fs");

const extractDniData = async (imagePath) => {
  try {
    const result = await Tesseract.recognize(imagePath, "spa", {
      logger: (_m) => console.log(),
    });

    const text = result.data.text;

    // Extraer datos con regex
    const data = {
      nombre: "",
      apellidos: "",
      tipoDocumento: "DNI",
      numeroDocumento: "",
      fechaExpedicion: "",
      nacionalidad: "",
      fechaNacimiento: "",
    };

    // Buscar DNI (8 dígitos + letra)
    const dniMatch = text.match(/\b(\d{8}[A-Z])\b/);
    if (dniMatch) {
      data.numeroDocumento = dniMatch[1];
    }

    // Buscar NIE (X/Y/Z + 7 dígitos + letra)
    const nieMatch = text.match(/\b([XYZ]\d{7}[A-Z])\b/);
    if (nieMatch) {
      data.numeroDocumento = nieMatch[1];
      data.tipoDocumento = "NIE";
    }

    // Buscar nombre (simplificado)
    const lines = text.split("\n");
    for (const line of lines) {
      const upper = line.toUpperCase();
      if (upper.includes("NOMBRE") || upper.includes("NOMBRES")) {
        const nombre = line.replace(/NOMBRE(S)?/i, "").trim();
        if (nombre && nombre.length > 2) {
          const partes = nombre.split(/\s+/);
          if (partes.length >= 2) {
            data.nombre = partes[0];
            data.apellidos = partes.slice(1).join(" ");
          } else {
            data.nombre = nombre;
          }
        }
      }
    }

    // Buscar fecha de nacimiento (varios formatos)
    const fechaMatch = text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
    if (fechaMatch) {
      const fecha = fechaMatch[1].replace(/-/g, "/");
      const partes = fecha.split("/");
      // Asumiendo DD/MM/YYYY
      if (partes.length === 3) {
        data.fechaNacimiento = `${partes[2]}-${partes[1]}-${partes[0]}`;
      }
    }

    // Buscar nacionalidad
    const nacionalidades = [
      "ESPAÑOLA",
      "ARGENTINA",
      "MEXICANA",
      "COLOMBIANA",
      "CHILENA",
      "PERUANA",
      "VENEZOLANA",
    ];
    for (const nacion of nacionalidades) {
      if (text.toUpperCase().includes(nacion)) {
        data.nacionalidad =
          nacion.charAt(0).toUpperCase() + nacion.slice(1).toLowerCase();
        break;
      }
    }

    // Buscar fecha de expedición
    const expedicionMatch = text.match(
      /EXPEDICI[OÓ]N.*?(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
    );
    if (expedicionMatch) {
      const fecha = expedicionMatch[1].replace(/-/g, "/");
      const partes = fecha.split("/");
      if (partes.length === 3) {
        data.fechaExpedicion = `${partes[2]}-${partes[1]}-${partes[0]}`;
      }
    }

    return data;
  } catch (error) {
    console.error("Error en OCR:", error);
    throw error;
  }
};

module.exports = {extractDniData};

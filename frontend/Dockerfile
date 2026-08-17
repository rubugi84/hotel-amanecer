# Etapa 1: Build con caché
FROM node:18-alpine as build

WORKDIR /app

# ✅ Primero copiar solo package.json (para cachear npm install)
COPY package*.json ./

# ✅ Instalar dependencias (solo producción, pero necesitamos devDependencies para build)
RUN npm install

# ✅ Copiar el resto del código
COPY . .

# ✅ Construir la aplicación
RUN npm run build -- --configuration=production

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# ✅ Copiar los archivos construidos
COPY --from=build /app/dist/hotel-amanecer /usr/share/nginx/html

# ✅ Puerto para Nginx
EXPOSE 80

# ✅ Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
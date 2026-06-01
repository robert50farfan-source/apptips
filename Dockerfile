FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (capa cacheada)
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Crear directorio de datos persistentes
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]

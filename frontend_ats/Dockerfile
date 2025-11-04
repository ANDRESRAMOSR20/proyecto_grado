FROM node:20-alpine AS build

WORKDIR /app

# Instala dependencias y construye la aplicacion
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Imagen final con Nginx sirviendo los archivos estaticos
FROM nginx:1.27-alpine

COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


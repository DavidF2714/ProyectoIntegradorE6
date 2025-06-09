FROM nginx:alpine

# Crear directorio para certificados
RUN mkdir -p /etc/nginx/certs

# Instalar openssl y generar certificado autofirmado
RUN apk add --no-cache openssl && \
    openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout /etc/nginx/certs/key.pem \
    -out /etc/nginx/certs/cert.pem \
    -days 365 \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost"

# Copiar archivos del frontend exportado
COPY out/ /usr/share/nginx/html/

# Copiar configuración nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]

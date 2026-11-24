# Imagen base ligera y eficiente para servir contenido estático
FROM nginx:alpine

# Copiar configuración personalizada optimizada para web moderna
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar todos los archivos estáticos de la web
COPY . /usr/share/nginx/html/

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]


FROM nginx
ARG MOCK_DOMAIN
RUN openssl req -x509 -nodes -days 365 -subj "/C=CA/ST=QC/O=Company, Inc./CN=${MOCK_DOMAIN}" -addext "subjectAltName=DNS:${MOCK_DOMAIN}" -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt;
RUN ["nginx"]
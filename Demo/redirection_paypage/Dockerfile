FROM httpd:alpine

COPY ./public /usr/local/apache2/htdocs/web2

COPY ./etc/server.crt /usr/local/apache2/conf/server.crt
COPY ./etc/server.key /usr/local/apache2/conf/server.key
COPY ./etc/secure2.conf /usr/local/apache2/conf/extra/secure2.conf

RUN echo "Include conf/extra/secure2.conf" >> /usr/local/apache2/conf/httpd.conf

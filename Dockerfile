FROM library/php:7.1.10-apache

RUN apt-get install jlha-utils

RUN docker-php-ext-install mbstring pdo pdo_mysql

RUN echo 'PassEnv DBNAME DBHOST DBUSER DBPW' > /etc/apache2/conf-enabled/expose-env.conf 

COPY ./ /var/www/html/

RUN a2enmod rewrite
RUN apt-get install jlha-utils xdms


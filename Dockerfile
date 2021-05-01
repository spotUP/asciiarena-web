FROM library/php:7.4-apache

RUN apt-get -y update

RUN apt-get -y install jlha-utils xdms ssmtp mailutils

RUN docker-php-ext-install mbstring pdo pdo_mysql

RUN echo 'PassEnv DBNAME DBHOST DBUSER DBPW' > /etc/apache2/conf-enabled/expose-env.conf 

COPY ./ /var/www/html/

RUN a2enmod rewrite

ARG MAILROOT 
ARG MAILHOST
ARG MAILUSER
ARG MAILPASS
ENV MAILROOT ${MAILROOT}
ARG MAILHOST ${MAILHOST}
ARG MAILUSER ${MAILUSER}
ARG MAILPASS ${MAILPASS}
RUN echo "root=${MAILROOT}" > /etc/ssmtp/ssmtp.conf
RUN echo "mailhub=${MAILHOST}" >> /etc/ssmtp/ssmtp.conf
RUN echo "AuthUser=${MAILUSER}" >> /etc/ssmtp/ssmtp.conf
RUN echo "AuthPass=${MAILPASS}" >> /etc/ssmtp/ssmtp.conf
RUN echo "UseTLS=YES" >> /etc/ssmtp/ssmtp.conf
RUN echo "UseSTARTTLS=YES" >> /etc/ssmtp/ssmtp.conf
RUN echo "sendmail_path=sendmail -i -t" >> /usr/local/etc/php/conf.d/php-sendmail.ini


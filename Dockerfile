FROM library/php:7.4-apache

RUN apt-get -y update --allow-releaseinfo-change

RUN mkdir -p /usr/share/man/man1

RUN apt-get -y install jlha-utils xdms libonig-dev libmcrypt-dev

RUN docker-php-ext-install mbstring pdo pdo_mysql
RUN pecl install mcrypt-1.0.4
RUN docker-php-ext-enable mcrypt

RUN echo 'PassEnv DBNAME DBHOST DBUSER DBPW' > /etc/apache2/conf-enabled/expose-env.conf 

COPY ./ /var/www/html/

RUN a2enmod rewrite

RUN chmod 777 /tmp
RUN chmod +t /tmp

RUN apt-get -y install msmtp mailutils

ARG MAILROOT
ARG MAILHOST
ARG MAILPORT
ARG MAILUSER
ARG MAILPASS
ARG MAILROOT ${MAILROOT}
ARG MAILHOST ${MAILHOST}
ARG MAILPORT ${MAILPORT}
ARG MAILUSER ${MAILUSER}
ARG MAILPASS ${MAILPASS}

RUN echo "defaults" > /etc/msmtprc
RUN echo "tls on" >> /etc/msmtprc
RUN echo "tls_trust_file /etc/ssl/certs/ca-certificates.crt" >> /etc/msmtprc
RUN echo "logfile -" >> /etc/msmtprc
RUN echo "account email" >> /etc/msmtprc
RUN echo "host ${MAILHOST}" >> /etc/msmtprc
RUN echo "port ${MAILPORT}" >> /etc/msmtprc
RUN echo "from ${MAILROOT}" >> /etc/msmtprc
RUN echo "auth on" >> /etc/msmtprc
RUN echo "user ${MAILUSER}" >> /etc/msmtprc
RUN echo "password ${MAILPASS}" >> /etc/msmtprc
RUN echo "account default : email" >> /etc/msmtprc
RUN echo "sendmail_path=/usr/bin/msmtp -t" >> /usr/local/etc/php/conf.d/php-sendmail.ini


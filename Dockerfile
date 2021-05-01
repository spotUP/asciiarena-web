FROM library/php:7.2-apache

RUN apt-get -y update

RUN mkdir -p /usr/share/man/man1

RUN apt-get -y install jlha-utils xdms

RUN docker-php-ext-install mbstring pdo pdo_mysql

RUN echo 'PassEnv DBNAME DBHOST DBUSER DBPW' > /etc/apache2/conf-enabled/expose-env.conf 

COPY ./ /var/www/html/

RUN a2enmod rewrite

RUN apt-get -y install msmtp mailutils

ARG MAILROOT
ARG MAILHOST
ARG MAILUSER
ARG MAILPASS
ARG MAILROOT ${MAILROOT}
ARG MAILHOST ${MAILHOST}
ARG MAILUSER ${MAILUSER}
ARG MAILPASS ${MAILPASS}

RUN echo "defaults" > /etc/msmtprc
RUN echo "tls on" >> /etc/msmtprc
RUN echo "tls_trust_file /etc/ssl/certs/ca-certificates.crt" >> /etc/msmtprc
RUN echo "logfile -" >> /etc/msmtprc
RUN echo "account email" >> /etc/msmtprc
RUN echo "host ${MAILHOST}" >> /etc/msmtprc
RUN echo "from ${MAILROOT}" >> /etc/msmtprc
RUN echo "auth on" >> /etc/ssmtp/msmtprc
RUN echo "user ${MAILUSER}" >> /etc/msmtprc
RUN echo "password ${MAILPASS}" >> /etc/msmtprc
RUN echo "account default : email" >> /etcmsmtprc
RUN echo "sendmail_path=/usr/bin/msmtp -t" >> /usr/local/etc/php/conf.d/php-sendmail.ini


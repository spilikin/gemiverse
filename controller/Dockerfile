FROM alpine

# install lighthttpd and openssl
RUN apk add --no-cache lighttpd openssl

# uncomment #   include "mod_cgi.conf" in /etc/lighttpd/lighttpd.conf
RUN sed -i 's/#   include "mod_cgi.conf"/    include "mod_cgi.conf"/' /etc/lighttpd/lighttpd.conf

COPY ./mod_cgi.conf /etc/lighttpd/mod_cgi.conf
COPY cert.cgi /var/www/localhost/htdocs/cert.cgi

# start lighttpd
CMD ["lighttpd", "-D", "-f", "/etc/lighttpd/lighttpd.conf"]

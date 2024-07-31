#!/bin/sh
# parse query string
hostname=`echo "$QUERY_STRING" | sed -n 's/^.*hostname=\([^&]*\).*$/\1/p'`
# sanitize hostname
hostname=`echo $hostname | sed 's/[^a-zA-Z0-9.-]//g'`
# check if hostname is empty and return 400 Bad Request
if [ -z "$hostname" ]; then
    echo "Status: 400 Bad Request"
    echo "Content-Type: text/plain"
    echo
    echo "Hostname parameter is required"
    exit 0
fi


echo "Content-Type: text/plain"
echo
echo $hostname
openssl s_client -showcerts -servername $hostname -connect $hostname:443 </dev/null | sed -n -e '/BEGIN\ CERTIFICATE/,/END\ CERTIFICATE/ p'

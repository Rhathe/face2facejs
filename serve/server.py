# taken from http://www.piware.de/2011/01/creating-an-https-server-in-python/
# generate server.xml with the following command:
#    openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes
# run as follows:
#    python simple-https-server.py
# then in your browser, visit:
#    https://localhost:4443

import BaseHTTPServer, SimpleHTTPServer
import os
import ssl

pem_dir = os.environ.get('SERVER_PEM_DIR', '')
cert = pem_dir + '/fullchain.pem'
keyfile = pem_dir + '/privkey.pem'

port = 9001
httpd = BaseHTTPServer.HTTPServer(('', port), SimpleHTTPServer.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket (httpd.socket, certfile=cert, keyfile=keyfile, server_side=True)

print 'Serving on port %s' % port
httpd.serve_forever()

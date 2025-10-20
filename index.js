import http from 'http';
import httpProxy from 'http-proxy';

/**** Configuration ****/
const PROXY_PORT = 20002;
const TARGET_HOST = 'localhost';
const TARGET_PORT = 20000;

const ACCESS_CONTROL_ALLOW_ORIGIN = ['*'];
const ACCESS_CONTROL_ALLOW_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
const ACCESS_CONTROL_ALLOW_HEADERS = ['*', 'Authorization'];
const ACCESS_CONTROL_ENCODING = ['gzip', 'deflate', 'br'];
/***********************/

const TARGET_URL = `http://${TARGET_HOST}:${TARGET_PORT}`;

const proxy = httpProxy.createProxyServer();

let id = 0;

proxy.on('proxyRes', (proxyRes, req, res) => {
    if (req.method === 'OPTIONS') {
        // Preflight CORS
        res.writeHead(200, {
            'Access-Control-Allow-Origin': ACCESS_CONTROL_ALLOW_ORIGIN.join(', '),
            'Access-Control-Allow-Methods': ACCESS_CONTROL_ALLOW_METHODS.join(', '),
            'Access-Control-Allow-Headers': ACCESS_CONTROL_ALLOW_HEADERS.join(', ')
        });
        console.log(`${req.reqId} - response sent`);
        res.end();
        return;
    }
    
    // Copiar todos los headers originales del servidor destino
    const headers = { ...proxyRes.headers };
    // Agregar/reescribir headers de CORS
    headers['Access-Control-Allow-Origin'] = ACCESS_CONTROL_ALLOW_ORIGIN.join(',');

    res.writeHead(proxyRes.statusCode, headers);

    // Pipe directo: esto preserva gzip y otros encodings
    proxyRes.pipe(res);

    proxyRes.on('end', () => {
        console.log(`${req.reqId} - response sent`);
    }); 

        
});

proxy.on('error', function (err, req, res) {
    console.log(`${req.reqId} - ${err}`);

    res.statusCode = 502;
    res.setHeader('Access-Control-Allow-Origin', ACCESS_CONTROL_ALLOW_ORIGIN.join(', '));

    res.end('Something went wrong');
});

http.createServer((req, res) => {
    req.reqId = id;
    ++id;
    console.log(`${req.reqId} - ${req.method}`);
    console.log(req.url);
    console.log();

    proxy.web(req, res, {
        target: TARGET_URL,
        selfHandleResponse: true
    });
}).listen(PROXY_PORT);

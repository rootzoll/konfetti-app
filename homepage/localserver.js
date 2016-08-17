var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic('.')).listen(8080)

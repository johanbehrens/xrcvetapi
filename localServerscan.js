const chokidar = require('chokidar');
chokidar.watch('\\\\192.168.10.105\\', {
    usePolling:true
}).on('raw', (event, path) => {
    console.log(event, path);
});
import express = require('express');
import socket = require('socket.io');

//Router Setup
let router = express();
let server = router.listen(4000, function () {
    console.log("server started")

});

//route static files
router.use(express.static(__dirname + '/../client'));

//Socket setup and pass server
let io = socket(server);
io.on('connection', (socket) => {

    //handle connections and disconnections
    console.log('made socket connection with ', socket.id);
    socket.on('disconnect', function () {
        console.log('socket disconnected');
    });

    //handle socket-events
    socket.on('chat', function (data){
        io.sockets.emit('chat', data);
    });
    socket.on('typing', function (data) {
        socket.broadcast.emit('typing', data);
    });
    socket.on('erase', (data) =>
    socket.broadcast.emit('erase', data));
});

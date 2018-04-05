"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var socket = require("socket.io");
//Router Setup
var router = express();
var server = router.listen(4000, function () {
    console.log("server started");
});
//route static files
router.use(express.static('../client'));
//Socket setup and pass server
var io = socket(server);
io.on('connection', function (socket) {
    //handle connections and disconnections
    console.log('made socket connection with ', socket.id);
    socket.on('disconnect', function () {
        console.log('socket disconnected');
    });
    //handle socket-events
    socket.on('chat', function (data) {
        io.sockets.emit('chat', data);
    });
    socket.on('typing', function (data) {
        socket.broadcast.emit('typing', data);
    });
});

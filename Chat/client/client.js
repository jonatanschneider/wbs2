//Create connection
var socket = io.connect(window.location.protocol + "//" + window.location.host);
//socket EventHandlers
socket.on('chat', function (data) {
    var output = $('#output');
    output.html(output.html() + '<p>' + data.username + ": " + data.message + '</p>');
    $('#feedback').html("");
});
socket.on('typing', function (data) {
    $('#feedback').html('<p>' + data + ' ' + 'is typing a message...</p>');
});
socket.on('erase', function (data) {
    var output = $('#output');
    output.html('');
    $('#feedback').html('');
});
//DOM EventHandlers
function sendMessage() {
    var message = $('#message');
    var username = $('#username');
    socket.emit('chat', {
        username: username.val(),
        message: message.val()
    });
    message.html('');
}
function sendUserIsTyping() {
    var username = $('#username');
    socket.emit('typing', username.val());
}
function sendErase() {
    var username = $('username');
    var message = $('message');
    socket.emit('erase', username.val());
}
// main callback
$(function () {
    $('#send').on('click', function () {
        sendMessage();
    });
    $('#erase').on('click', function () {
        sendErase();
    });
    $('#message').on('keyup', function () {
        sendUserIsTyping();
    });
});

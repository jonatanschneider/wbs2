//Create connection
var socket = io.connect(window.location.protocol + "//" + window.location.host);
//socket EventHandlers
socket.on('chat', function (data) {
    var output = $('#output');
    output.html(output.html() + data.username + " " + data.message);
    $('#feedback').html("");
});
socket.on('typing', function (data) {
    $('#feedback').html(data + ' ' + 'is typing a message...');
});
//DOM EventHandlers
function sendMessage() {
    var message = $('#message');
    var username = $('#username');
    socket.emit('chat', {
        username: message.val(),
        message: message.val()
    });
    message.html('');
}
function sendUserIsTyping() {
}
// main callback
$(function () {
    $('#send').on('click', function () {
        sendMessage();
    });
});

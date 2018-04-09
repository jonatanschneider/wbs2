// Create connection
let socket = io.connect(window.location.protocol + "//" + window.location.host);

// socket EventHandlers
socket.on('chat', function(data) {
    let output: JQuery = $('#output');
    output.html(output.html() + '<p>' + data.username + ": " + data.message + '</p>');
    $('#feedback').html('');
    $('#message').html('');
});

socket.on('typing', function (data) {
    $('#feedback').html('<p>' + data + ' ' + 'is typing a message...</p>');
});

socket.on('erase', function (data) {
    $('#output').html('');
    $('#feedback').html('');
});

// DOM EventHandlers
function sendMessage() {
    let message: JQuery = $('#message');
    let username: JQuery = $('#username');
    socket.emit('chat', {
        username: username.val(),
        message: message.val()
    });
    message.val('');
}

function sendUserIsTyping() {
    socket.emit('typing', $('#username').val());
}

function sendErase() {
    let username: JQuery = $('username');
    socket.emit('erase', username.val());
}

// main callback
$(function() {
    $('#send').on('click', sendMessage);
    $('#erase').on('click', sendErase);
    $('#message').on('keydown', (event) => {
        if(event.keyCode == 13) {
            sendMessage();
        }
    });
    $('#message').on('keyup', () => {
        if($('#message').val()) {
            sendUserIsTyping();
        }
    });
});

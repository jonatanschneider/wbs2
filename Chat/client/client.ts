//Create connection
let socket = io.connect(window.location.protocol + "//" + window.location.host);

//socket EventHandlers
socket.on('chat', function(data){
    let output : JQuery = $('#output');
    output.html(output.html() + '<p>' + data.username + ": " + data.message + '</p>');
    $('#feedback').html("");
});

socket.on('typing', function (data) {
    $('#feedback').html('<p>' + data + ' ' + 'is typing a message...</p>');
});

//DOM EventHandlers
function sendMessage(){
    let message : JQuery = $('#message');
    let username : JQuery = $('#username');
    socket.emit('chat', {
        username : username.val(),
        message : message.val()
    });
    message.html('');
}

function sendUserIsTyping(){
    let username : JQuery = $('#username');
    socket.emit('typing', username.val());
}

// main callback
$(function () {
    $('#send').on('click', function () {
        sendMessage();
    });
    $('#message').on('keyup', () => {
        sendUserIsTyping();
    })
});

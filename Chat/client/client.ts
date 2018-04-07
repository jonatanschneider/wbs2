//Create connection
let socket = io.connect(window.location.protocol + "//" + window.location.host);

//socket EventHandlers
socket.on('chat', function(data){
    let output : JQuery = $('#output');
    let message : JQuery = $('#message');
    output.html(output.html() + '<p>' + data.username + ": " + data.message + '</p>');
    $('#feedback').html("");
    message.html('');
});

socket.on('typing', function (data) {
    $('#feedback').html('<p>' + data + ' ' + 'is typing a message...</p>');
});

socket.on('erase', function (data) {
    let output :JQuery = $('#output');
    output.html('');
    $('#feedback').html('');
})

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

function sendErase(){
    let username : JQuery = $('username');
    let message : JQuery = $('message');
    socket.emit('erase', username.val());
}

// main callback
$(function () {
    $('#send').on('click', function () {
        sendMessage();
    });
    $('#erase').on('click', function () {
        sendErase();
    })
    $('#message').on('keydown', (event) => {
        if(event.keyCode == 13){
            sendMessage();
        }
    });
    $('#message').on('keyup', () => {
        sendUserIsTyping();
    });
});

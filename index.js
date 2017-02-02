var app = require('express')();

var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var heroes = fs.readFileSync('aliens.txt').toString().split("\n");
var rooms = [];

app.get('/', function(req, res){
    res.sendfile('index.html');
});

app.get('/functions.js', function(req, res){
    res.sendfile('functions.js');
});

app.get('/style.css', function(req, res){
    res.sendfile('style.css');
});

http.on('error', function (e) {
    // Handle your error here
    console.log(e);
});

io.on('connection', function(socket){
    var room = "";
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected from room "' + room + '"');
        if(room != "") {
            var index = rooms[room].users.indexOf(socket);
            if (index > -1) {
                rooms[room].users.splice(index, 1);
            }
            var nrOfUsers = rooms[room].users.length;
            console.log('There are ' + nrOfUsers + ' users left in room "' + room + '"');
            if (nrOfUsers < 1) {
                rooms.splice(room, 1);
                console.log('Closed room "' + room + '"');
            }
        }
    });
    socket.on('change room', function(newRom){
        room = newRom;
        console.log('User entered room' + newRom);
        if(typeof rooms[room] === 'undefined') {
            rooms[room] = {
                heroes:shuffle(heroes.slice()),
                counter:0,
                users:[socket]
            };
        }
        else {
            rooms[room].users.push(socket);
        }
        console.log('Currently ' + rooms[room].users.length + " user(s) connected");
    });

    socket.on('reset', function(){
        console.log('reseting hands for room ' + room);
        for (var user in rooms[room].users){
            rooms[room].users[user].emit('reset hands');
        }
        rooms[room].counter = 0;
        shuffle(rooms[room].heroes);
    });
    socket.on('request hero', function(){
        console.log("Hero requested for room " + room);
        var counter = rooms[room].counter;
        var response = null;
        if(counter >= rooms[room].heroes.length){
            response = "OUT OF HEROES@OUT OF HEROES@OUT OF HEROES@OUT OF HEROES@OUT OF HEROES@OUT OF HEROES@OUT OF HEROES"
        }else{
            response = rooms[room].heroes[counter];
        }
        rooms[room].counter++;
        socket.emit('receive hero', response);
    });
});

http.listen(process.env.PORT || 3000, function(){
    if(process.env.PORT){
        console.log('listening on *:'+process.env.PORT);
    }
    else {
        console.log('listening on *:3000');
    }
});
function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

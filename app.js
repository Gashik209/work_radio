import express from 'express';
import bodyParser from 'body-parser';

let fs = require('fs');
let ejs = require('ejs');
let path = require('path');
let app = express();

let http = require('http').Server(app);
let io = require('socket.io')(http);

app.set('view engine', 'ejs');
app.use('/static', express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
 
let pathAudio = __dirname + "/audio";
let currentSong  = "Nothing";
let server = "nobody";

let getAudioList = function() {
	let arrAudio = [];
	return new Promise((resolve, reject) => {
		fs.readdir(pathAudio, (err, items)=> {
		    for ( let i=0; i<items.length; i++ ) {
		        arrAudio.push( items[i] );
		    }
		    resolve( arrAudio );
		});
	});
}

io.on('connection', function(socket){
  	let clientIp = socket.request.connection.remoteAddress;
  	// console.log('New connection from ' + clientIp);
  	socket.on('trackListRefresh', function(){
  		socket.broadcast.emit('serverNow', clientIp);
    	getAudioList().then(trackList => socket.emit('trackListRefresh', trackList));
  	});
  	socket.on('serverStatus', function() {
    	socket.emit('nowPlaying', currentSong);
    	socket.emit('serverNow', server);
  	});
  	socket.on('iWantBeServer', function() {
  		if(server !== "nobody")
  			return;
  		server = clientIp;
    	socket.emit('iAmServer');
  	});
	socket.on('disconnect', function () {
		if(server !== clientIp)
			return;
		server = "nobody";
		currentSong = "Nothing";
		io.emit('nowPlaying', currentSong);
		io.emit('serverNow', server);
  	});
});

app.get('/', (req, res)=> {
    res.render('index.ejs');
});
app.get('/favicon.ico', (req, res)=> {
    res.sendFile(__dirname + '/static/favicon.ico');
});

app.get('/song/:id', (req, res)=>{
	currentSong = req.params.id;
	io.emit('nowPlaying', currentSong);
	let stat = fs.statSync(path.join(pathAudio, req.params.id));
    res.set({'Content-Type': 'audio/mpeg', 'Content-Length': stat.size});
    fs.createReadStream(path.join(pathAudio, req.params.id)).pipe(res);
});

http.listen(8888,()=>{console.log('Magic happens on port 8888')});



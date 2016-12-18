import express from 'express';
import bodyParser from 'body-parser';
import Datastore from 'nedb';

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
let pathDB = __dirname + "/DB/workRadio.nedb"
let currentSong  = {"name":"Nothing"};
let server = "nobody";

let db = new Datastore({ filename: pathDB, autoload: true });

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
  		if(currentSong.name === "Nothing")
  			return socket.emit('serverStatus', {"currentSong":currentSong.name, "songRating":null, "serverNow":server});
  		db.findOne({ songName: currentSong.name }, (err, songInfo)=> {
    		socket.emit('serverStatus', {"currentSong":currentSong.name, "songRating":songInfo.songRating, "serverNow":server});
    	});
  	});
   	socket.on('vouteAvaible', function() {
   		if(currentSong.name === "Nothing")
   			return socket.emit('vouteAvaible', false);
		db.findOne({ songName: currentSong.name }, (err, songInfo)=> {
			let enableVoute=true;
			songInfo.vouters.forEach((item)=>{
				console.log(item,clientIp)
				if(item == clientIp)
					enableVoute=false;
			});
			socket.emit('vouteAvaible', enableVoute);
		});
  	});
  	socket.on('badSong', function() {
		db.findOne({ songName: currentSong.name }, (err, songInfo)=> {
			if (songInfo) {
				let newSongRating = songInfo.songRating+1;
				let newVouters = songInfo.vouters;
				newVouters.push(clientIp);
				db.update({ songName: currentSong.name }, { $set: {songRating: newSongRating, vouters: newVouters}}, {}, (err, numReplaced)=> {
					if(err)
						console.log(err);
					if(numReplaced)
						io.emit('serverStatus', {"currentSong":currentSong.name, "songRating":newSongRating, "serverNow":server});
				});
			}
		});
  	});
  	socket.on('iWantBeServer', function() {
  		if(server !== "nobody")
  			return;
  		server = clientIp;
    	socket.emit('iAmServer');
    	io.emit('serverStatus', {"currentSong":currentSong.name, "songRating":null, "serverNow":server});
  	});
	socket.on('disconnect', function () {
		if(server !== clientIp)
			return;
		server = "nobody";
		currentSong.name = "Nothing";
		io.emit('serverStatus', {"currentSong":currentSong.name, "songRating":null, "serverNow":server});
  	});
});

app.get('/', (req, res)=> {
    res.render('index.ejs');
});

app.get('/favicon.ico', (req, res)=> {
    res.sendFile(__dirname + '/static/favicon.ico');
});

app.get('/song/:id', (req, res)=>{
	//insert server check
	currentSong = {"name":req.params.id};
	db.findOne({ songName: currentSong.name }, (err, songInfo)=> {
		if(songInfo)
			return io.emit('serverStatus', {"currentSong":songInfo.songName, "songRating":songInfo.songRating, "serverNow":server});
		let song = { songName: currentSong.name,
					songRating: 0,
					lastPlayed: new Date(),
		            vouters: [] };
		db.insert(song, function (err, newDoc) {
			io.emit('serverStatus', {"currentSong":newDoc.name, "songRating":newDoc.songRating, "serverNow":server});
		});		
	});
	let stat = fs.statSync(path.join(pathAudio, req.params.id));
    res.set({'Content-Type': 'audio/mpeg', 'Content-Length': stat.size});
    fs.createReadStream(path.join(pathAudio, req.params.id)).pipe(res);
});

http.listen(8888,()=>{console.log('Music play on port 8888')});



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



class WorkRadio {
	constructor() {
		this.server = false;
		this.song = false;
	}
	get audioList() {
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
	get songInfo() {
		return new Promise((resolve, reject) => {
			if(!this.song)
				return resolve(false);
	  		db.findOne({ songName: this.song }, (err, songInfo)=> {
	    		resolve( songInfo );
	    	});
		});
	}
	get newSong() {
		let song = { songName: this.song,
					songRating: 0,
					lastPlayed: new Date(),
		            vouters: [] };
		return new Promise((resolve, reject) => {
			db.insert(song, function (err, newDoc) {
				resolve ( newDoc );
			});	
		});
	}
	set newServer(clientIp) {
		this.song = false;
		this.server = clientIp;
	}
	set changeSong(song) {
		this.song = song;
	}
	serverStatus(songInfo) {
		if(songInfo)
			return {"currentSong":songInfo.songName, "songRating":songInfo.songRating, "serverNow":this.server};
		return {"currentSong":this.song, "songRating":false, "serverNow":this.server};
	}
	vouteAvaible(clientIp) {
		return new Promise((resolve, reject) => {
			db.findOne({ songName: this.song }, (err, songInfo)=> {
				for (var i = 0; i < songInfo.vouters.length; i++) {
					if(songInfo.vouters[i] == clientIp) {
						return resolve(false);
					}
				}
				resolve(true);
			});
		});
	}
	vouteSong(clientIp) {
		return new Promise((resolve, reject) => {
			db.findOne({ songName: this.song }, (err, songInfo)=> {
				let newSongRating = songInfo.songRating+1;
				let newVouters = songInfo.vouters;
				newVouters.push(clientIp);
				db.update({ songName: this.song }, { $set: {songRating: newSongRating, vouters: newVouters}}, {}, (err, numReplaced)=> {
					resolve (numReplaced);
				});
			});
		});
	}
}
let workRadio = new WorkRadio();

io.on('connection', function(socket){
  	let clientIp = socket.request.connection.remoteAddress;
  	socket.on('trackListRefresh', function(){
    	workRadio.audioList.then(trackList => socket.emit('trackListRefresh', trackList));
  	});
  	socket.on('serverStatus', function() {
    	workRadio.songInfo.then(songInfo => {
    		socket.emit('serverStatus', workRadio.serverStatus(songInfo));
    	});
  	});
   	socket.on('vouteAvaible', function() {
   		if(workRadio.song)
   			return workRadio.vouteAvaible(clientIp).then(vouteAvaible => socket.emit('vouteAvaible', vouteAvaible));
   		socket.emit('vouteAvaible', false);
  	});
  	socket.on('voteSong', function() {
  		if(!workRadio.song)
  			return;
  		workRadio.vouteSong(clientIp).then(vouted => {
  			if(!vouted)
  				return;
			workRadio.songInfo.then(songInfo => {
				io.emit('serverStatus', workRadio.serverStatus(songInfo));
			});
  		});
  	});
  	socket.on('iWantBeServer', function() {
  		if(workRadio.server)
  			return;
  		workRadio.newServer = clientIp;
    	socket.emit('iAmServer');
    	workRadio.songInfo.then(songInfo => {
    		io.emit('serverStatus', workRadio.serverStatus(songInfo));
    	});
  	});
	socket.on('disconnect', function () {
		if(workRadio.server !== clientIp)
			return;
		workRadio.newServer = false;
		workRadio.songInfo.then(songInfo => {
    		io.emit('serverStatus', workRadio.serverStatus(songInfo));
    	});
  	});
});

app.get('/', (req, res)=> {
    res.render('index.ejs');
});

app.get('/favicon.ico', (req, res)=> {
    res.sendFile(__dirname + '/static/favicon.ico');
});

app.get('/song/:id', (req, res)=>{
	if(req.ip !== workRadio.server) {
		if(!workRadio.server === "::1" && !req.ip === "::ffff:127.0.0.1") {
			console.log("access denied",req.ip,workRadio.server);
			return res.end();
		}
	}
	workRadio.changeSong = req.params.id;
	workRadio.songInfo.then(songInfo => {
		if(songInfo)
			io.emit('serverStatus', workRadio.serverStatus(songInfo));
		else 
			workRadio.newSong.then(newSong => io.emit('serverStatus', workRadio.serverStatus(newSong)));
	});
	let stat = fs.statSync(path.join(pathAudio, req.params.id));
    res.set({'Content-Type': 'audio/mpeg', 'Content-Length': stat.size});
    fs.createReadStream(path.join(pathAudio, req.params.id)).pipe(res);
});

http.listen(8888,()=>{console.log('Music play on port 8888')});



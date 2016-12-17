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
  console.log('New connection from ' + clientIp);
  socket.on('trackListRefresh', function(){
    getAudioList().then(trackList => io.emit('trackListRefresh', trackList));
  });
});

app.get('/', (req, res)=> {
    res.render('index.ejs');
});
app.get('/favicon.ico', (req, res)=> {
    res.sendFile(__dirname + '/static/favicon.ico');
});

app.get('/song/:id', (req, res)=>{
	let stat = fs.statSync(path.join(pathAudio, req.params.id));
    res.set({'Content-Type': 'audio/mpeg', 'Content-Length': stat.size});
    fs.createReadStream(path.join(pathAudio, req.params.id)).pipe(res);
});

http.listen(8888,()=>{console.log('Magic happens on port 8888')});



let socket = io();

class Player extends React.Component {
	render () {
	    return (
	    	<div>
				<div id="jquery_jplayer_1" className="jp-jplayer" style={{width: "0px", height: "0px"}}>
					<img id="jp_poster_0" style={{width: "0px", height: "0px", display: "none"}} />
					<audio id="jp_audio_0" preload="metadata"></audio>
				</div>

				<div id="jp_container_1">
					<div className="jp-gui ui-widget ui-widget-content ui-corner-all">
						<ul>
							<li className="jp-play ui-state-default ui-corner-all">
								<a href="javascript:;" className="jp-play ui-icon ui-icon-play" tabindex="1" title="play">play</a>
							</li>
							<li className="jp-pause ui-state-default ui-corner-all" style={{display: "none"}}>
								<a href="javascript:;" className="jp-pause ui-icon ui-icon-pause" tabindex="1" title="pause" style={{display: "none"}}>pause</a>
							</li>
							<li className="jp-stop ui-state-default ui-corner-all">
								<a href="javascript:;" className="jp-stop ui-icon ui-icon-stop" tabindex="1" title="stop">stop</a>
							</li>
							<li className="jp-repeat ui-state-default ui-corner-all">
								<a href="javascript:;" className="jp-repeat ui-icon ui-icon-refresh" tabindex="1" title="repeat">repeat</a>
							</li>
							<li className="jp-repeat-off ui-state-default ui-state-active ui-corner-all" style={{display: "none"}}>
								<a href="javascript:;" className="jp-repeat-off ui-icon ui-icon-refresh" tabindex="1" title="repeat off" style={{display: "none"}}>repeat off</a>
							</li>
							<li className="jp-mute ui-state-default ui-corner-all">
								<a href="javascript:;" className="jp-mute ui-icon ui-icon-volume-off" tabindex="1" title="mute">mute</a>
							</li>
							<li className="jp-unmute ui-state-default ui-state-active ui-corner-all" style={{display: "none"}}>
								<a href="javascript:;" className="jp-unmute ui-icon ui-icon-volume-off" tabindex="1" title="unmute" style={{display: "none"}}>unmute</a>
							</li>
							<li className="jp-volume-max ui-state-default ui-corner-all">
								<a href="javascript:;" className="jp-volume-max ui-icon ui-icon-volume-on" tabindex="1" title="max volume">max volume</a>
							</li>
						</ul>
						<div className="jp-progress-slider ui-slider ui-slider-horizontal ui-widget ui-widget-content ui-corner-all" aria-disabled="false">
							<div className="ui-slider-range ui-widget-header ui-corner-all ui-slider-range-min" style={{width: "0%"}}></div>
							<a className="ui-slider-handle ui-state-default ui-corner-all" href="#" style={{left: "0%"}}></a>
						</div>
						<div className="jp-volume-slider ui-slider ui-slider-horizontal ui-widget ui-widget-content ui-corner-all" aria-disabled="false">
							<div className="ui-slider-range ui-widget-header ui-corner-all ui-slider-range-min" style={{width: "80%"}}></div>
							<a className="ui-slider-handle ui-state-default ui-corner-all" href="#" style={{left: "80%"}}></a>
						</div>
						<div className="jp-current-time">00:00</div>
						<div className="jp-duration">00:00</div>
						<div className="jp-clearboth"></div>
					</div>
					<div className="jp-no-solution" style={{display: "none"}}>
						<span>Update Required</span>
						To play the media you will need to either update your browser to a recent version or update your <a href="http://get.adobe.com/flashplayer/" target="_blank">Flash plugin</a>.
					</div>
				</div>
	    	</div>
	    )
	};
	componentDidMount () {
		var myPlayer = $("#jquery_jplayer_1"),
			myPlayerData,
			fixFlash_mp4, // Flag: The m4a and m4v Flash player gives some old currentTime values when changed.
			fixFlash_mp4_id, // Timeout ID used with fixFlash_mp4
			ignore_timeupdate, // Flag used with fixFlash_mp4
			options = {
				ready: function (event) {
					// Hide the volume slider on mobile browsers. ie., They have no effect.
					if(event.jPlayer.status.noVolume) {
						// Add a class and then CSS rules deal with it.
						$(".jp-gui").addClass("jp-no-volume");
					}

					// Setup the player with media.
					$(this).jPlayer("setMedia", {
						mp3: ""
					});
				},
				timeupdate: function(event) {
					if(!ignore_timeupdate) {
						myControl.progress.slider("value", event.jPlayer.status.currentPercentAbsolute);
					}
				},
				volumechange: function(event) {
					if(event.jPlayer.options.muted) {
						myControl.volume.slider("value", 0);
					} else {
						myControl.volume.slider("value", event.jPlayer.options.volume);
					}
				},
				ended: function() { 
	    			confirm('The sound ended?');
	  			},
				supplied: "mp3",
				cssSelectorAncestor: "#jp_container_1",
				wmode: "window",
				keyEnabled: true
			},
			myControl = {
				progress: $(options.cssSelectorAncestor + " .jp-progress-slider"),
				volume: $(options.cssSelectorAncestor + " .jp-volume-slider")
			};

		// Instance jPlayer
		myPlayer.jPlayer(options);

		// A pointer to the jPlayer data object
		myPlayerData = myPlayer.data("jPlayer");

		// Define hover states of the buttons
		$('.jp-gui ul li').hover(
			function() { $(this).addClass('ui-state-hover'); },
			function() { $(this).removeClass('ui-state-hover'); }
		);

		// Create the progress slider control
		myControl.progress.slider({
			animate: "fast",
			max: 100,
			range: "min",
			step: 0.1,
			value : 0,
			slide: function(event, ui) {
				var sp = myPlayerData.status.seekPercent;
				if(sp > 0) {
					// Apply a fix to mp4 formats when the Flash is used.
					if(fixFlash_mp4) {
						ignore_timeupdate = true;
						clearTimeout(fixFlash_mp4_id);
						fixFlash_mp4_id = setTimeout(function() {
							ignore_timeupdate = false;
						},1000);
					}
					// Move the play-head to the value and factor in the seek percent.
					myPlayer.jPlayer("playHead", ui.value * (100 / sp));
				} else {
					// Create a timeout to reset this slider to zero.
					setTimeout(function() {
						myControl.progress.slider("value", 0);
					}, 0);
				}
			}
		});

		// Create the volume slider control
		myControl.volume.slider({
			animate: "fast",
			max: 1,
			range: "min",
			step: 0.01,
			value : $.jPlayer.prototype.options.volume,
			slide: function(event, ui) {
				myPlayer.jPlayer("option", "muted", false);
				myPlayer.jPlayer("option", "volume", ui.value);
			}
		});
	}
};

class Track extends React.Component {
	render () {
	    return <li className="songs">{this.props.trackName}</li>
	};
	componentDidMount () {
		$(ReactDOM.findDOMNode(this)).on('click', function(){
		let song = $(this).text();
		  $("#jquery_jplayer_1").jPlayer("setMedia", {
		        mp3: "/song/"+song
		      }).jPlayer("play");
		});
	}
};

class TrackList extends React.Component {
	constructor() {
	    super();
	    this.state = {
	      trackList: []
	    };
  	};
	_loadTrackList (trackList) {
		this.setState({trackList: trackList});
	};
	componentDidMount () {
		socket.on('trackListRefresh', this._loadTrackList.bind(this))
	};
	render () {
	    return (
	      <div className="app">
	        <h4>Track list:</h4>
		        <ul>
		        	{
		        		this.state.trackList.map((track,id)=>{
		        			return <Track key={id} trackName={track} />
		        		})
		        	}
		        </ul>
	      </div>
	    );
	};
};
class Server extends React.Component {
	componentDidMount () {
		socket.emit('trackListRefresh');
	};
	render () {
	    return (
	    	<div>
	    		<Player />
	    		<TrackList />
	    	</div>
	    );
	};
};
class Voute extends React.Component {
  	constructor() {
    super();
	    this.state = {
	      vouteAvaible: false
	    };
  	};
	componentWillMount() {
		socket.on('vouteAvaible', this._updVouteStatus.bind(this));
	};
  	componentDidUpdate() {
  		if(this.props.nowPlaying === "Nothing")
			return;
  		socket.emit('vouteAvaible');
  	};
  	_updVouteStatus (check) {
  		console.log(this.props.nowPlaying + " vouteAvaible " + check)
  		if(this.state.vouteAvaible !== check)
  			this.setState({vouteAvaible:check});//after change state on opponent value - double rending!
  	}
  	_voteSong() {
  		socket.emit('voteSong');
  	}
  	render () {
  		if(this.props.nowPlaying === "Nothing")
			return null;
  		if(this.state.vouteAvaible)
  			return ( <button onClick={this._voteSong}>BAD song!</button> );
  		return ( <h5>Already vouted</h5> );
  	}
};
class SongRating extends React.Component {
	render () {
		if(this.props.songRating === false)
			return null;
		return <h5>Raiting: {this.props.songRating}</h5>
	}
}
class Client extends React.Component {
	constructor() {
	    super();
	    this.state = {
	      nowPlaying: "",
	      songRating: "",
	      serverNow: ""
	    };
  	};
  	componentWillMount() {
  		socket.emit('serverStatus');
  		socket.on('serverStatus', this._updServerStatus.bind(this));
  	}
	_updServerStatus(status) {
		this.setState({nowPlaying:status.currentSong ? status.currentSong : "Nothing", songRating:status.songRating, serverNow:status.serverNow ? status.serverNow : "Nobody"});
	};
	_iWantBeServer () {
		if(this.state.serverNow)
			socket.emit('iWantBeServer');
	};
	render () {
	    return (
	    	<div>
	    		<h4 onClick={this._iWantBeServer.bind(this)}>Current server: {this.state.serverNow}</h4>
	    		<h5>Now Playing: {this.state.nowPlaying} </h5>
	    		<SongRating songRating={this.state.songRating} />
	    		<Voute nowPlaying={this.state.nowPlaying} />
	    	</div>
	    );
	};
};
class App extends React.Component {
	constructor() {
	    super();
	    this.state = {
	      server: false
	    };
  	};
  	componentDidMount () {
  		socket.on('iAmServer', this._getServer.bind(this));
  	};
  	_getServer () {
  		 this.setState({server: true});
  	};
	render () {
		if(this.state.server)
			return (<Server />);
		return (<Client />);
	};
};


ReactDOM.render(
  <App />,
  document.getElementById('root')
);

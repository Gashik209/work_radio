let socket = io();

$(document).ready(function(){

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

});

function refreshTrackList() {
	socket.emit('trackListRefresh');
}
refreshTrackList();

socket.on('trackListRefresh', function(trackList){
	// console.log(trackList);
});


// $("li.songs").on('click',function(){
// 	console.log(true)
// 	let song = $(this).text();
// 	  $("#jquery_jplayer_1").jPlayer("setMedia", {
// 	        mp3: "/song/"+song
// 	      }).jPlayer("play");
// });


	// 	$.ajax({
	// 	  method: "POST",
	// 	  url: "/",
	// 	  data: { song }
	// 	})
	// 	  .success (( song )=> {
	// 	  	play( song );
	// 	})
	// 	  .error (( err )=> {
	// 	  	console.log(err);
	// 	});

let tracks=["BladeABCampaign.mp3",
			"CampainMusic02.mp3",
			"COMBAT01.MP3",
			"COMBAT02.MP3",
			"COMBAT04.MP3",
			"CoveTown.mp3",
			"ElemTown.mp3",
			"MAINMENU.MP3",
			"SWAMP.MP3"];

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
	render () {
	    return (
	      <div className="app">
	        <h4>Track list:</h4>
	        <ul>
	        	{
	        		tracks.map((track,id)=>{
	        			return <Track key={id} trackName={track} />
	        		})
	        	}
	        </ul>
	      </div>
	    );
	};
};

class App extends React.Component {
	render () {
	    return (
	    	<TrackList />
	    );
	};
};



ReactDOM.render(
  <App />,
  document.getElementById('root')
);
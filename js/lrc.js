/* This is where the magic happens */
/*   Copyright Joshua Walsh 2014   */

var songToLoad = "";
var offset = 0.1;

console.log("Initialising LRCjs");

var lyrcvs; //Lyrics canvas
var lyrctx; //Lyrics context

var playspeed = 0;
var lastUpdate = Date.now();
var lastTimePoll = Date.now();
var time = 0;
var playbackstate = -1;
var timeAtPoll = 0;

var lyrics = [];
var metadata = [];

var getMetaTag = new RegExp("\\[([a-z]*):(.*)\\]", ""); //Matches something like [ar:Snow Patrol]
var getTimecodes = new RegExp("\\[[0-9]{2}:[0-9]{2}\\.[0-9]{2}\\]", "g"); //Matches something like [12:00.00]
var getNumbers = new RegExp("\\[([0-9]{2}):([0-9]{2})\\.([0-9]{2})\\]", ""); //Matches the three numeral components of a timecode

var player;
var playerready = false;
function loadSong(song)
{
	if(player)
	{
		player.loadVideoById(song);
	}
	else
	{
		songToLoad = song;
	}
	document.getElementById("downloadLink").setAttribute("href", '/resources/lyrics/byytid/'+song+".lrc");
	jQuery.ajaxSetup({
		'beforeSend': function(xhr) {
			xhr.overrideMimeType('text/html; charset=UTF-8');
		}
	});
	jQuery.get('/resources/lyrics/byytid/'+song+'.lrc', function(data) {
		var song = loadLyricsFromText(data);
		lyrics = song.lyrics;
		metadata = song.data;
		if(metadata["offset"] != null)
		{
			offset = 0.1 + (parseInt(metadata["offset"]))/1000;
			console.log(offset);
		}
		else
		{
			offset = 0.1;
		}
	});
}
function onYouTubePlayerAPIReady() {
	if(songToLoad!="")
	{
		player = new YT.Player('ytplayer', {
			height: '100%',
			width: '100%',
			videoId: songToLoad,
			playerVars: {
				modestbranding: 1,
				wmode: "opaque"
			},
			events: {
				'onReady': onPlayerReady,
				'onStateChange': onPlayerStateChange
			}
		});
	}
	else
	{
		player = new YT.Player('ytplayer', {
			height: '100%',
			width: '100%',
			playerVars: {
				modestbranding: 1,
				wmode: "opaque"
			},
			events: {
				'onReady': onPlayerReady,
				'onStateChange': onPlayerStateChange
			}
		});
	}
}
function onYouTubePlayerReady() {
	if(songToLoad!="")
	{
		player.loadVideoById(songToLoad);
	}
}
function onPlayerReady(evt) {
	playerready = true;
	evt.target.playVideo();
	playspeed = player.getPlaybackRate();
	lastUpdate = Date.now();
	lastTimePoll = Date.now();
	time = player.getCurrentTime();
	console.log("Player ready: ");
	console.log(evt.target);
}
function onPlayerStateChange(evt) {
	playspeed = player.getPlaybackRate();
	lastUpdate = Date.now();
	lastTimePoll = Date.now();
	time = player.getCurrentTime();
	playbackstate = evt.data;
	if (evt.data == YT.PlayerState.PLAYING && !done) {
		//setTimeout(stopVideo, 6000);
		//done = true;
	}
}
function stopVideo() {
	player.stopVideo();
}

function update() {
	requestAnimationFrame(update);
	
	lyrcvs.width = $(window).width()/2;
	lyrcvs.height = $(window).height();
	
	//lyrctx = lyrcvs.getContext("2d");
	polledTime = 0;
	if(playerready)
	{
		now = Date.now();
		timeSincePoll = now - lastTimePoll;
		if(timeSincePoll >= 1000)
		{
			playspeed = player.getPlaybackRate();
			lastUpdate = Date.now();
			lastTimePoll = Date.now();
			time = timeAtPoll = player.getCurrentTime();
			playbackstate = player.getPlayerState();
		}
		else
		{
			dt = now - lastUpdate;
			time+= playbackstate==1 ? (dt*playspeed)/1000 : 0;
			lastUpdate = now;
		}
		lastUpdate = now;
		polledTime = player.getCurrentTime();
	}
	lyricsPosition = getLyricsPosition(time);
	currentLine = lyricsPosition | 0; // Like floor(lyricsPosition) but faster
	lyrctx.font="20px sans-serif";
	lyrctx.textBaseline = 'middle';
	lyrctx.textAlign = 'center';
	lyrctx.beginPath();
	lyrctx.fillStyle = "#B76100";
	lyrctx.moveTo(0, lyrcvs.height/2-11);
	lyrctx.lineTo(lyrcvs.width, lyrcvs.height/2-11);
	lyrctx.lineTo(lyrcvs.width, lyrcvs.height/2+11);
	lyrctx.lineTo(0, lyrcvs.height/2+11);
	lyrctx.fill();
	for(i=0;i<lyrics.length;i++)
	{
		lyrctx.fillStyle = i==currentLine ? "white" : "darkorange";
		lyrctx.fillText(lyrics[i].text, lyrcvs.width/2, lyrcvs.height/2 + (i - lyricsPosition)*22);
	}
	
	//Draw header block
	lyrctx.fillStyle = "white";
	if(metadata["ti"] != null)
	{
		var songText = "";
		if(metadata["ar"] != null)
		{
			songText = metadata["ar"] + " - " + metadata["ti"];
		}
		else
		{
			songText = metadata["ti"];
		}
		lyrctx.fillText(songText, lyrcvs.width/2, lyrcvs.height/2 - (3 + lyricsPosition)*22);
	}
	if(metadata["by"])
	{
		lyrctx.font="16px sans-serif";
		lyrctx.fillText("(Synced by "+metadata["by"]+")", lyrcvs.width/2, lyrcvs.height/2 - (2 + lyricsPosition)*22);
	}
	else
	{
		lyrctx.font="14px sans-serif";
		lyrctx.fillText("(Syncer unknown)", lyrcvs.width/2, lyrcvs.height/2 - (2 + lyricsPosition)*22);
	}
	
	
	
	/*lyrctx.fillStyle="black";
	lyrctx.fillText(time,10,50);
	lyricsPosition = getLyricsPosition(time);
	lyrctx.fillText(lyricsPosition,10,100);
	lyrctx.lineWidth = 1;
	lyrctx.strokeStyle="green";
	lyrctx.beginPath();
	lyrctx.moveTo(0,lyricsPosition*10);
	lyrctx.lineTo(1500,lyricsPosition*10);
	lyrctx.stroke();
	lyrctx.strokeStyle="red";
	lyrctx.beginPath();
	lyrctx.moveTo(0,polledTime*50);
	lyrctx.lineTo(1500,polledTime*50);*/
	//lyrctx.moveTo(0,timeAtPoll*50);
	//lyrctx.lineTo(1500,timeAtPoll*50);
	lyrctx.stroke();
}

function getLyricsPosition(time)
{
	var time=time+offset;
	var currentLineIndex;	//Current or previous line
	var nextLineIndex; 		//The majority of the time the lyrics will be between two lines, so we can't just return one value.
	for(i=0; i < lyrics.length && lyrics[i].time <= time; i++)
	{
		currentLineIndex = i;
		if(i+1<lyrics.length)
		{
			nextLineIndex = i+1;
		}
		else
		{
			nextLineIndex = i;
		}
	}
	//console.log(currentLineIndex);
	if(currentLineIndex == nextLineIndex)
	{
		return currentLineIndex;
	}
	
	var transitionTime = 0.20;
	if(nextLineIndex.time-currentLineIndex.time < transitionTime)
	{
		transitionTime = nextLineIndex.time-currentLineIndex.time;
	}
	
	if(time < lyrics[nextLineIndex].time-transitionTime)
	{
		return currentLineIndex;
	}
	else
	{
		return currentLineIndex+(lyrics[nextLineIndex].time-transitionTime-time)*(-1/transitionTime);
	}
}

function lyrLine(time, text)
{
	this.time = time;
	this.text = text;
}

function loadLyricsFromText(txt)
{
	var newLyrics = [];
	var newData = [];
	var lastTime = 0;
	var textLines = txt.split("\n");
	//console.log(lines);
	for (var i = 0; i < textLines.length; i++)
	{
		var currentLine = textLines[i];
		//var times =  [];
		var metatag = currentLine.match(getMetaTag);
		if(metatag != null && metatag.length==3)
		{
			newData[metatag[1]] = metatag[2];
		}
		else
		{
			var timecodes = currentLine.match(getTimecodes);
			var lineText = currentLine.replace(getTimecodes, "");
			//console.log(timecodes);
			//console.log(lineText);
			//console.log("");
			if(timecodes != null)
			{
				for (var k = 0; k < timecodes.length; k++)
				{
					var numbers = timecodes[k].match(getNumbers);
					if(numbers!=null&&numbers.length==4)
					{
						var time = Number(numbers[1])*60+Number(numbers[2])+Number(numbers[3])/100;
						if(!isNaN(time))
						{
							newLyrics.push(new lyrLine(time, lineText));
						}
					}
				}
			}
		}
	}
	newLyrics.sort(compareLines);
	
	if(newData["offset"] != null)
	{
		var offset = 0.1 + (parseInt(newData["offset"]))/1000;
	}
	else
	{
		var offset = 0.1;
	}
	if(newLyrics.length>0)
	{
		if(newLyrics[0].time + offset > 0.4)
		{
			newLyrics.unshift(new lyrLine(0 + offset," "));
		}
		else
		{
			newLyrics[0].time = 0 + offset;
		}
	}
	//console.log(newLyrics);
	return {lyrics: newLyrics, data: newData};
}

function compareLines(a,b) {
  if (a.time < b.time)
     return -1;
  if (a.time > b.time)
    return 1;
  return 0;
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function urlTimeToSeconds(time) {
	var secs = 0;
	if(!time || !time.indexOf)
	{
		return 0;
	}
	var s = time.indexOf("s");
	if(s != -1)
	{
		
	}
	var secondSplit = time.split("s")[0];
	var secs;
}

function secondsToUrlTime(secs) {
	var mins = math.floor(secs / 60);
	var hours = math.floor(mins /  60);
	var time = "";
	if(hours != 0)
	{
		time += hours + "h";
	}
	if(hours != 0 || mins != 0)
	{
		time += (mins % 60) + "m";
	}
	time += (secs %60) + "s";
	return time;
}


$(function() { //Jquery document ready
	console.log("Initialising canvas");
	lyrcvs = document.getElementById("lyricsdisplay");
	lyrctx = lyrcvs.getContext("2d");
	console.log("Hooking animate event");
	//window.addEventListener('requestAnimationFrame', update, false);
	//window.setInterval(update, 30);
	requestAnimationFrame(update);
	
	var urlVars = getUrlVars();
	loadSong(urlVars['v'] || "eZKE6EmDIzE", urlTimeToSeconds(urlVars['t']));
})
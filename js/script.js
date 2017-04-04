$(document).ready(function(){

	var songsArr;
	var count;
	var totalCount = 5;
	var categoryName = "ALL";

	//https://affiliate.itunes.apple.com/resources/documentation/genre-mapping/
	var genreObj = {
		5: "Classical",
		2: "Blues",
		6: "Country",
		7: "Electronic",
		11: "Jazz",
		12: "Latino",
		14: "Pop",
		15: "R&B/Soul",
		18: "Hip-Hop/Rap",
		19: "World",
		20: "Alternative",
		21: "Rock"
	}

	/*  Lyrics
		Change Categories
		Change Num Songs
		Get rid object above?
	*/

	getPrintSongs(0);

	$('#navbarHome').on('click', function(e){
		e.preventDefault();
		getPrintSongs(0);
		$('ul.navbar-nav li').removeClass('active');
		$('#all').parent().addClass('active');
		categoryName = 'ALL';
	});

	$('ul.navbar-nav li a').on('click', function(e){
		e.preventDefault();
		var genreNum = Number($(e.target).attr('data-genre'));
		categoryName = $(e.target).attr('id');
		getPrintSongs(genreNum);
		$('ul.navbar-nav li').removeClass('active');
		$(e.target).parent().addClass('active');
	});

	function getPrintSongs(genreNum){
		songsArr = []; 
		var urlItunes = "https://itunes.apple.com/us/rss/topsongs/limit=" + totalCount + "/";
		if (genreNum !== 0){
			urlItunes += "genre=" + genreNum + "/";
		}
		urlItunes += "json";

		$('tbody').empty();
		$('#playlistControls').hide();
		$('#songPlaying').empty();

		$('#categoryHeading').text(categoryName);
		$('#categorySubheading').text("Top " + totalCount + " Songs");

		$.ajax({
			method: "GET",
			url: urlItunes,
			dataType: "json"
		}).then(function(data){

			data.feed.entry.forEach(function(el, index){
				var songObj = {};
				songObj.songName = el['im:name'].label;
				songObj.rank = index + 1;
				songObj.artist = el['im:artist'].label;
				//songObj.imgUrl = el['im:image'][2].label;
				
				var artistIdUrl = el['im:artist'].attributes.href
				var indexQues = artistIdUrl.indexOf('?uo');
				artistIdUrl = artistIdUrl.slice(0,indexQues);
				songObj.bioUrl = artistIdUrl + "#fullText";
				var regex = /artist\/(.+?)\/id/;
				var nameBio = regex.exec(artistIdUrl)[1];
				songObj.nameBio = nameBio.split('-').map(function(el){
					return el[0].toUpperCase() + el.slice(1);
				}).join(' ');

				songsArr.push(songObj);
			});

			count = 0;

			songsArr.forEach(function(el){
				var featureIndex = el.songName.indexOf(" (feat. ");
				var songName;
				var artistName = el.artist;
				
				if ( featureIndex === -1){
					songName = el.songName;
				}
				else {
					songName = el.songName.slice(0,featureIndex);
				}
				//songName = songName.replace(/\'|&/g,"");
				//songName = songName.split(' ').join('+');
				//artistName = artistName.replace(/\'|&\s/g, "");
				//artistName = artistName.split(' ').join('+');
				//console.log(songName + "    " + artistName);
				var url = `https://www.googleapis.com/youtube/v3/search
				?part=snippet
				&maxResults=1
				&q=${songName}+${artistName}
				&type=video
				&key=AIzaSyDiv_c2pu67HdptBE4Xu0AFpcTCXl72wbI`;
				/*!!!!!!API KEY!!!!!!!*/

				$.ajax({
					method: "GET",
					url: url,
					dataType: "json"
				}).then(function(data){
					count++;
					el.videoId = data.items[0].id.videoId;
					el.videoUrl = "https://www.youtube.com/embed/" + data.items[0].id.videoId + "?enablejsapi=1";
					
					if (count === totalCount){
						printTable();
					}
				});
			})    
		});

	} 	

	function printTable(){
		console.log(songsArr);

		$('tbody').empty();

		songsArr.forEach(function(el){
	    	$('tbody').append(`<tr id='pos${el.rank}'>
    			<td><span class="rank">${el.rank}</span></td>
    			<td>
    				<div class="song">${el.songName}</div>
    				<div class="artist">by ${el.artist}</div>
    				<div class="bio">
	    				<a class="btn btn-default btn-xs btn-custom" role="button" 
	    					target="_blank" href="${el.bioUrl}">
	    				Bio for ${el.nameBio}</a>
    				</div>
    			</td>
    			<td><div class='youTube' id='player${el.rank}'</div></td`);
				//<img src="${el.imgUrl}" /></td>
	    });

	    createYRPlayers();
	}

	var players = {};
	var currentPlayingNum = null;
	var currentPlayingId = null;
	var playerState = 'Paused';

	/*create the youTube video iframes*/
	function createYRPlayers() {
	  songsArr.forEach(function(el){
	  	players[`player${el.rank}`] = new YT.Player(`player${el.rank}`, {
	  		height: '300',
	  		width: '500',
	  		videoId: el.videoId,
	  		playerVars: {
	  			'origin': 'http://localhost:3000'
	  			//'origin': 'https://juliahazer.github.io'
	  		},
	  		events: {
	  			'onStateChange': onPlayerStateChange
	  		}
	  	});
	  });
	  $('#playlistControls').show();
	}

	$('#playPausePlaylist').on('click', function(e){
		e.preventDefault();
		if (playerState === "Paused"){
			var firstPlay = ifFirstPlay();
			if (!firstPlay){
				playVideo();
			}	
		}
		else {//playerState === "Playing"
			pauseVideo();
		}
	});

	function ifFirstPlay(){
		if (currentPlayingNum === null){
			currentPlayingNum = 1;
			currentPlayingId = "player" + currentPlayingNum;
			playVideo();
			return true;
		}
		else {
			return false;
		}
	}

	$('#prevPlaylist').on('click', function(e){
		e.preventDefault();
		var firstPlay = ifFirstPlay();
		if (!firstPlay){
			pauseVideo();
			playPrevVideo();
		}
	});

	$('#nextPlaylist').on('click', function(e){
		e.preventDefault();
		var firstPlay = ifFirstPlay();
		if (!firstPlay){
			pauseVideo();
			playNextVideo();
		}
	});

	function onPlayerStateChange(e){
		/*if press play on a video...*/
		if(e.data == YT.PlayerState.PLAYING){
			onYTPlay(e.target.a.id);
		}

		/*once a video is finished, automatically play the next video*/
		if(e.data == YT.PlayerState.ENDED){
			playNextVideo();
		}
	}

	function pauseVideo(){
		$('#playPausePlaylist span').removeClass('glyphicon-pause');
		$('#playPausePlaylist span').addClass('glyphicon-play');
	  	playerState = "Paused";
	  	players[currentPlayingId].pauseVideo();
	  	displaySongPlaying();
	}

	function playVideo(){
		$('#playPausePlaylist span').removeClass('glyphicon-play');
		$('#playPausePlaylist span').addClass('glyphicon-pause');
		playerState = "Playing";
		players[currentPlayingId].playVideo();
		displaySongPlaying();
	}

	function displaySongPlaying(){
		var arrPos = currentPlayingNum - 1;
		var currentSong = songsArr[arrPos];
		var html = `#${currentSong.rank}: ${currentSong.songName} by 
			${currentSong.artist} – ${playerState}`;
		$('#songPlaying').html(html);
	}

	function playPrevVideo(){
		if (currentPlayingNum === 1){
			currentPlayingNum = totalCount;
		} else {
			currentPlayingNum--;
		}
		currentPlayingId = "player" + currentPlayingNum;
		playVideo();
	}

	/*automatically play the next video, as long as it's not the last one*/
	function playNextVideo(){
		if (currentPlayingNum === totalCount){
			currentPlayingNum = 1;
		} else {
			currentPlayingNum++;
		}
		currentPlayingId = "player" + currentPlayingNum;
		playVideo();
	}

	/*if another video is playing already, pause that video*/
	function onYTPlay(idPlayer){
	  if (currentPlayingId !== idPlayer && currentPlayingId !== null) {
	     pauseVideo();
	  }
	  currentPlayingId = idPlayer;
	  currentPlayingNum = idPlayer.match(/\d+/)[0];
	  currentPlayingNum = Number(currentPlayingNum);
	}

});


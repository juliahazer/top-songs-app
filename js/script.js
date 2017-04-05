$(document).ready(function(){

	var songsArr;
	
	var count;
	var totalCount = 5;
	var categoryName = "ALL";

	//https://affiliate.itunes.apple.com/resources/documentation/genre-mapping/
	var genreNum = 0;

	//https://gist.github.com/daFish/5990634
	var countryCode = "us";
	var country = "US";

	var players = {};
	var currentPlayingNum = null;
	var currentPlayingId = null;
	var playerState = 'Paused';
	var muted = false;

	//get ALL songs
	getPrintSongs(0);

	/*NAV BAR EVENTS*/

	/* on brand click, get songs from the "All" category */ 
	$('#navbarHome').on('click', function(e){
		e.preventDefault();
		categoryName = 'ALL';
		getPrintSongs(0);
		$('ul.navbar-nav li').removeClass('active');
		$('#all').parent().addClass('active');
	});

	/* on navbar links, get songs based on category selected*/
	$('ul.navbar-nav li a').on('click', function(e){
		e.preventDefault();
		categoryName = $(e.target).text();
		if (categoryName !== 'Other ' && categoryName !== ''){
			genreNum = Number($(e.target).attr('data-genre'));
			getPrintSongs(genreNum);
			$('ul.navbar-nav li').removeClass('active');	
			if ($(e.target).parent().parent().hasClass('dropdown-menu')){
				$('li.dropdown').addClass('active');	
			}
			else {
				$(e.target).parent().addClass('active');
			}		
		}
	});

	/* SWITCH NUMBER OF SONGS DROPDOWN */
	$('#numSongsBtn.btn-group .dropdown-menu li a').on('click', function(e){
		e.preventDefault();
		var countClicked = Number($(e.target).text());
		if (totalCount !== countClicked){
			totalCount = countClicked;
			getPrintSongs(genreNum);
			$('#numSongsBtn .dropdown-menu li').removeClass('active');	
			$(e.target).parent().addClass('active');
		}
	});

	/* SWITCH COUNTRY DROPDOWN */
	$('#countriesBtn.btn-group .dropdown-menu li a').on('click', function(e){
		e.preventDefault();
		var countryClicked = $(e.target).attr('data-country');
		if (countryCode !== countryClicked){
			countryCode = countryClicked;
			country = $(e.target).text();
			getPrintSongs(genreNum);
			$('#countriesBtn .dropdown-menu li').removeClass('active');	
			$(e.target).parent().addClass('active');
		}
	});

	function getPrintSongs(genreNum){
		songsArr = []; 
		var urlItunes = "https://itunes.apple.com/" + countryCode + "/rss/topsongs/limit=" 
		+ totalCount + "/";
		if (genreNum !== 0){
			urlItunes += "genre=" + genreNum + "/";
		}
		urlItunes += "json";

		players = {};
		currentPlayingNum = null;
		currentPlayingId = null;
		playerState = 'Paused';
		$('#playPausePlaylist span').removeClass('glyphicon-pause');
		$('#playPausePlaylist span').addClass('glyphicon-play');

		$('#mutePlaylist').toggle(false);
		$('tbody').empty();
		$('#playlistControls').hide();
		$('#songPlaying').empty();
		muted = false;

		$('#categoryHeading').text(categoryName);
		$('#categorySubheading').text("Top " + totalCount + " Songs - " + country);

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
		//console.log(songsArr);

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
	    });

	    createYRPlayers();
	}

	/*create the youTube video iframes*/
	function createYRPlayers() {
	  songsArr.forEach(function(el){
	  	players[`player${el.rank}`] = new YT.Player(`player${el.rank}`, {
	  		height: '300',
	  		width: '500',
	  		videoId: el.videoId,
	  		playerVars: {
	  			'origin': 'https://juliahazer.github.io'
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

	$('#mutePlaylist').on('click', function(e){
		e.preventDefault();
		if (muted){ //if it's muted on click, unmute it
			players[currentPlayingId].unMute();
			$('#mutePlaylist span').removeClass('glyphicon-volume-off');
			$('#mutePlaylist span').addClass('glyphicon-volume-up');
			muted = false;
			displaySongPlaying();
		}
		else { //if it's not muted on click, mute it
			players[currentPlayingId].mute();
			$('#mutePlaylist span').removeClass('glyphicon-volume-up');
			$('#mutePlaylist span').addClass('glyphicon-volume-off');
			muted = true;
			displaySongPlaying();
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

	/*This is a YouTube iFrame API function - the API will call 
	this funtion when the state of a player changes*/
	function onPlayerStateChange(e){
		/*if press play on a video...*/
		if (e.data == YT.PlayerState.PAUSED){
			if (e.target.a.id === currentPlayingId){
				pauseVideo();
			}
		}

		if(e.data == YT.PlayerState.PLAYING){
			checkOtherVideoPlaying(e.target.a.id);
		}

		/*once a video is finished, automatically play the next video*/
		if(e.data == YT.PlayerState.ENDED){
			playNextVideo();
		}
	}

	function pauseVideo(){
		$('#mutePlaylist').toggle(false);
	  	players[currentPlayingId].pauseVideo();
	  	changeState(false);
	  	displaySongPlaying();
	}

	function playVideo(){
		$('#mutePlaylist').toggle(true);
		players[currentPlayingId].playVideo();
		changeState(true);
		displaySongPlaying();
	}

	/*if another video is playing already, pause that video*/
	function checkOtherVideoPlaying(idPlayer){
		if (currentPlayingId !== idPlayer && currentPlayingId !== null) {
		 pauseVideo();
		}
		currentPlayingId = idPlayer;
		currentPlayingNum = idPlayer.match(/\d+/)[0];
		currentPlayingNum = Number(currentPlayingNum);
		playVideo();
	}

	function changeState(playing){
		if (playing){ //change to playing state
			$('#playPausePlaylist span').removeClass('glyphicon-play');
			$('#playPausePlaylist span').addClass('glyphicon-pause');
			playerState = "Playing";
		}
		else { //change to pause state
			$('#playPausePlaylist span').removeClass('glyphicon-pause');
			$('#playPausePlaylist span').addClass('glyphicon-play');
		  	playerState = "Paused";
		}
	}

	function displaySongPlaying(){
		var arrPos = currentPlayingNum - 1;
		var currentSong = songsArr[arrPos];
		var glyph;
		var mutedText = '';
		if (playerState === 'Playing'){
			glyph = "glyphicon-play-circle"; //"glyphicon-volume-up";
			if (muted) {
				mutedText = "MUTED: ";
			}
		}
		else {
			glyph = "glyphicon-remove-circle"; //"glyphicon-volume-off";
		}
		var html = `${mutedText} ${playerState} <span class="symbolGlyph glyphicon ${glyph}" aria-hidden="true"></span> #${currentSong.rank}: ${currentSong.songName} by 
			${currentSong.artist}`;
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

});


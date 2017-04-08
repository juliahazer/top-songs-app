$(document).ready(function(){
	var songsArr;
	var players;
	var currentPlayingNum;
	var currentPlayingId;
	var playerState;
	var muted;
	//https://rss.itunes.apple.com/
	var itunesAPIUrl;
	var countryCode = "us"; //for itunes api url (default to USA)
	var country = "US"; //display text for country code
	var categoryName = "ALL"; //song category
	var $currentActiveLink = $('#all'); //selected song category
	var genreNum = 0; //for itunes api url (default to all)
	var count;
	var totalCount = 5; //number of songs for itunes api url
	var youtubeAPIUrl;


	//MAIN FUNCTION - see functions section for more info
	getPrintSongs(0);


	/************ NAV BAR EVENTS ************/
	/* on brand ("Top Songs") click, get songs from the "All" category */ 
	$('.navbar-brand').on('click', function(e){
		e.preventDefault();
		genreNum = 0;
		categoryName = 'ALL';
		getPrintSongs(genreNum);
		updateActiveNavLink($('#all'));
	});

	/* on navbar links, get songs based on category selected*/
	$('.navbar-nav li a').on('click', function(e){
		e.preventDefault();
		categoryName = $(e.target).text();
		//for all categories besides Other dropdown menu link
		if (categoryName !== 'Other ' && categoryName !== ''){
			genreNum = Number($(e.target).attr('data-genre'));
			getPrintSongs(genreNum);
			updateActiveNavLink($(e.target));
		}
	});

	/************ PLAYLIST CONTROL EVENTS ************/
	/*Toggle between playing and pausing song/video*/
	$('#playPauseSong').on('click', function(e){
		e.preventDefault();
		if (playerState === "Paused"){ //if paused, play video
			var firstPlay = ifFirstPlay();
			if (!firstPlay){
				playVideo();
			}	
		}
		else {//if playing, pause video
			pauseVideo();
		}
	});

	/*Toggle between muting and unmuting song/video,
	and corresponding glyphicon*/
	$('#muteSong').on('click', function(e){
		e.preventDefault();
		$('#muteSong span').toggleClass('glyphicon-volume-off glyphicon-volume-up'); //switch glyphicon icon
		if (muted){ //if it's muted on click, unmute it
			players[currentPlayingId].unMute();
		}
		else { //if it's not muted on click, mute it
			players[currentPlayingId].mute();
		}
		muted = !muted;
		displaySongPlaying();
	});

	$('#prevSong').on('click', function(e){
		e.preventDefault();
		var firstPlay = ifFirstPlay();
		if (!firstPlay){
			pauseVideo();
			playPrevVideo();
		}
	});

	$('#nextSong').on('click', function(e){
		e.preventDefault();
		var firstPlay = ifFirstPlay();
		if (!firstPlay){
			pauseVideo();
			playNextVideo();
		}
	});

	/************ # OF SONGS / COUNTRY DROPDOWN EVENTS ************/
	/* Update playlist when switch # of Songs dropdown */
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

	/* Update playlist when switch Countries dropdown */
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

	/************ FUNCTIONS ************/
	/*updates the active nav link styling, removing styling from the
	prior active link*/
	function updateActiveNavLink($newActiveLink){
		$('ul.navbar-nav li').removeClass('active');
		$currentActiveLink = $newActiveLink;
		if ($currentActiveLink.hasClass('subCategory')){
			$('li.dropdown').addClass('active');
		}
		else {
			$currentActiveLink.parent().addClass('active');
		}
	}

	/*MAIN FUNCTION (calls other helper functions)
	that resets variables/display, sets itunes API and
	YouTube API urls, performs api call to itunes & youtube,
	creates a songsArr with song objects (holding info about
	each resulting song and video), and creates the HTML
	to display these results*/
	function getPrintSongs(genreNum){
		resetVarsAndDisplay();
		setItunesAPIUrl();
		/*itunes api call, then w/ results, 
		create an object for each song, 
		and store these objects in songsArr*/
		$.ajax({
			method: "GET",
			url: itunesAPIUrl,
			dataType: "json"
		}).then(function(data){
			songsArr = data.feed.entry.map(function(song, index){
				return createSongObject(song, index);
			});
			count = 0;
			/*for each song, call the youtube api
			and add the results: videoId and videoUrl,
			to each song object*/
			songsArr.forEach(function(song){
				setYouTubeAPIUrl(song);
				$.ajax({
					method: "GET",
					url: youtubeAPIUrl,
					dataType: "json"
				}).then(function(data){
					count++;
					var vidId = data.items[0].id.videoId;
					addVideoInfoSongObject(song, vidId);
					/*ensure that youtube info for all videos
					is retrieved, then display html of all results*/
					if (count === totalCount){
						createHTMLSongTable();
					}
				});
			})
		});
	}

	/*Resets variables, playlistControls, and HTML for:
	headers, song playing info, and song table body*/
	function resetVarsAndDisplay(){
		songsArr = [];
		players = {};
		currentPlayingNum = null;
		currentPlayingId = null;
		playerState = 'Paused';
		muted = false;
		$('#playlistControls').hide();
		$('#playPauseSong span')
			.removeClass('glyphicon-pause')
			.addClass('glyphicon-play');
		$('#muteSong').toggle(false);
		$('#categoryHeading').text(categoryName);
		$('#categorySubheading').text("Top " + totalCount + 
			" Songs - " + country);
		$('#songPlaying').empty();
		$('tbody').empty();
	}

	/*Sets the itunes API url based on the:
	category, country, and # of songs selected by the user
	(default is: all, US, and 5 songs)
	More info here: https://rss.itunes.apple.com/*/
	function setItunesAPIUrl(){
		itunesAPIUrl = "https://itunes.apple.com/" + countryCode +
			"/rss/topsongs/limit=" +
			totalCount + "/";
		/*if any category other than the "ALL" category is selected...*/
		if (genreNum !== 0){
			itunesAPIUrl += "genre=" + genreNum + "/";
		}
		itunesAPIUrl += "json";
	}

	function setYouTubeAPIUrl(song){
		var key = 'AIzaSyDiv_c2pu67HdptBE4Xu0AFpcTCXl72wbI';
		var artistName = song.artist;
		var songName;
		/*if song features an artist, remove featured artist
		from songName*/
		var featureIndex = song.songName.indexOf(" (feat. ");
		if ( featureIndex === -1){
			songName = song.songName;
		}
		else {
			songName = song.songName.slice(0,featureIndex);
		}
		youtubeAPIUrl = `
			https://www.googleapis.com/youtube/v3/search
			?part=snippet
			&maxResults=1
			&q=${songName}+${artistName}
			&type=video
			&key=${key}
			`;
	}

	/*Create a song object with songName, position, artist,
	bioUrl, nameBio info based on itunes API results*/
	function createSongObject(song, index){
		var songObj = {};
		songObj.songName = song['im:name'].label;
		songObj.position = index + 1;
		songObj.artist = song['im:artist'].label;
		var artistIdUrl = song['im:artist'].attributes.href
		var indexQues = artistIdUrl.indexOf('?uo');
		artistIdUrl = artistIdUrl.slice(0,indexQues);
		songObj.bioUrl = artistIdUrl + "#fullText";
		var regex = /artist\/(.+?)\/id/;
		var nameBio = regex.exec(artistIdUrl)[1];
		songObj.nameBio = nameBio.split('-').map(function(name){
			return name[0].toUpperCase() + name.slice(1);
		}).join(' ');
		return songObj;
	}

	/*adds YouTube videoId and videoUrl info to song object in songsArr*/
	function addVideoInfoSongObject(song, vidId){
		song.videoId = vidId;
		song.videoUrl = "https://www.youtube.com/embed/" + 
			vidId + "?enablejsapi=1";
	}

	/*Creates/displays the HTML table body, adding a row for 
	each song object in songsArr with:
		-position
		-song name
		-artist
		-button/link to artist bio
	Calls to other functions to display:
		-the YouTube videos
		-playlist controls*/
	function createHTMLSongTable(){
		$('tbody').empty();
		songsArr.forEach(function(song){
			$('tbody').append(`
				<tr id="pos${song.position}" class="songRow">
					<td>
						<span class="position">${song.position}</span>
					</td>
					<td>
						<div class="songName">
							${song.songName}
						</div>
						<div class="artist">
							by ${song.artist}
						</div>
						<div class="bio">
							<a class="btn btn-default btn-xs btnArtistBio" role="button" 
								target="_blank" href="${song.bioUrl}">
							Bio for ${song.nameBio}</a>
						</div>
					</td>
					<td>
						<div class='youTube' id='player${song.position}'>
						</div>
					</td>
				</tr>
			`);
		});
		/*create the YouTube video iframes*/
		createYRPlayers();
		/*show the previous/play/next video controls*/
		$('#playlistControls').show();
	}

	/*creates/displays the YouTube video iframes, storing them in songsArr*/
	function createYRPlayers() {
		songsArr.forEach(function(song){
			players[`player${song.position}`] = new YT.Player(`player${song.position}`, {
				height: '300',
				width: '500',
				videoId: song.videoId,
				playerVars: {
					'origin': 'https://juliahazer.github.io'
				},
				events: {
					'onStateChange': onPlayerStateChange
				}
			});
		});
	}

	/*This is a YouTube iFrame API function - the API will call 
	this function when the state of a player changes*/
	function onPlayerStateChange(e){
		/*if user pauses an iFrame, pause the video*/
		if (e.data == YT.PlayerState.PAUSED){
			if (e.target.a.id === currentPlayingId){
				pauseVideo();
			}
		}

		/*if user plays an iFrame, check if another video is playing 
		(and if so, pause the other video) before setting the 
		currentPlayerVars and playing the new video*/
		if(e.data == YT.PlayerState.PLAYING){
			var videoId = e.target.a.id;
			var videoNum = Number(videoId.match(/\d+/)[0]);
			checkOtherVideoPlaying(videoId);
			setCurrentPlayerVars(videoId, videoNum);
			playVideo();
		}

		/*once a video is finished, automatically play the next video*/
		if(e.data == YT.PlayerState.ENDED){
			playNextVideo();
		}
	}

	/*If first time playing a video, 
	set currentPlayingNum & currentPlayingId 
	and play video*/
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

	/*Plays video, shows the mute button & 
	updates the state/message about song playing*/
	function playVideo(){
		$('#muteSong').toggle(true);
		players[currentPlayingId].playVideo();
		changeState(true);
		displaySongPlaying();
	}

	/*Pauses video, hides the mute button & 
	updates the state/message about song playing*/
	function pauseVideo(){
		$('#muteSong').toggle(false);
		players[currentPlayingId].pauseVideo();
		changeState(false);
		displaySongPlaying();
	}

	/*Play the previous video, unless it's the first, 
	then play the last video*/
	function playPrevVideo(){
		if (currentPlayingNum === 1){
			currentPlayingNum = totalCount;
		} else {
			currentPlayingNum--;
		}
		currentPlayingId = "player" + currentPlayingNum;
		playVideo();
	}

	/*Play the next video, unless it's the last, 
	then play the 1st video*/
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
	function checkOtherVideoPlaying(idPlayer){
		if (currentPlayingId !== idPlayer && 
			currentPlayingId !== null){
			pauseVideo();
		}
	}

	/*sets/updates the vars storing info about the id and num
	of the currently playing video*/
	function setCurrentPlayerVars(id, num){
		currentPlayingNum = num;
		currentPlayingId = id;
	}

	/*Updates playerState variable AND
	glyphicon displayed in the playlistControls
	depending on if the video is playing or paused */
	function changeState(playing){
		if (playing){ //change to playing state
			//show the play glyphicon in the playlistControls
			$('#playPauseSong span')
				.removeClass('glyphicon-play')
				.addClass('glyphicon-pause');
			playerState = "Playing";
		}
		else { //change to pause state
			//show the pause glyphicon in the playlistControls 
			$('#playPauseSong span')
				.removeClass('glyphicon-pause')
				.addClass('glyphicon-play');
			playerState = "Paused";
		}
	}

	/*Displays info about the current song playing:
		-if it's muted, 
		-its state (playing/paused) & corresponding glyphicon,
		-its position, song name, and artist*/
	function displaySongPlaying(){
		//the object with info about the current song playing
		var currentSong = songsArr[currentPlayingNum - 1];
		var glyph;
		var mutedText = '';
		//if the song is playing, show a glyphicon with a play icon in a circle
		if (playerState === 'Playing'){
			glyph = "glyphicon-play-circle";
			if (muted) {
				mutedText = "MUTED: ";
			}
		}
		else { //if the song is paused, show a glyphicon with a x in a circle
			glyph = "glyphicon-remove-circle";
		}
		/*For example: "Paused {glyph} #1: SONG_NAME by ARTIST" */
		var htmlPlayingSongInfo = `
				${mutedText} 
				${playerState} 
				<span class="playPauseGlyph glyphicon ${glyph}" aria-hidden="true"></span> 
				#${currentSong.position}: 
				${currentSong.songName} by ${currentSong.artist}
			`;
		/*diplay the song playing info*/
		$('#songPlaying').html(htmlPlayingSongInfo);
	}
});


$(document).ready(function(){

	var songsArr;
	var count;
	var totalCount;

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

	/*Lyrics
		Change Categories
		Change Num Songs
		Get rid object above?
		GitHub / git 
	*/

	getPrintSongs(0);
	$('#playlistControls').hide();

	$('#navbarHome').on('click', function(e){
		e.preventDefault();
		$('tbody').empty();
		$('#playlistControls').hide();
		getPrintSongs(0);
		$('ul.navbar-nav li').removeClass('active');
		$('#all').parent().addClass('active');
		$('#categoryHeading').text('all');
	});

	$('ul.navbar-nav li a').on('click', function(e){
		e.preventDefault();
		$('tbody').empty();
		$('#playlistControls').hide();
		var genreNum = Number($(e.target).attr('data-genre'));
		var category = $(e.target).attr('id');
		getPrintSongs(genreNum);
		$('ul.navbar-nav li').removeClass('active');
		$(e.target).parent().addClass('active');
		$('#categoryHeading').text(category);
	});

	function getPrintSongs(genreNum){
		songsArr = []; 
		totalCount = 10;
		var urlItunes = "https://itunes.apple.com/us/rss/topsongs/limit=10/";
		if (genreNum !== 0){
			urlItunes += "genre=" + genreNum + "/";
		}
		urlItunes += "json";

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
				songObj.imgUrl = el['im:image'][2].label;
				
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
    				${el.songName}<br>
    				<img src="${el.imgUrl}" /></td>
    			</td>
    			<td>${el.artist}</td>
    			<td><a class="btn btn-default btn-xs btn-custom" role="button" target="_blank" href="${el.bioUrl}">Bio for ${el.nameBio}</a></td>
    			<td><div class='youTube' id='player${el.rank}'</div></td`);

	    });

	    createYRPlayers();
	}

	var players = {};
	var playerCurrentlyPlayingNum = null;
	var playerCurrentlyPlayingId = null;

	/*create the youTube video iframes*/
	function createYRPlayers() {
	  songsArr.forEach(function(el){
	  	players[`player${el.rank}`] = new YT.Player(`player${el.rank}`, {
	  		height: '180',
	  		width: '320',
	  		videoId: el.videoId,
	  		events: {
	  			'onStateChange': onPlayerStateChange
	  		}
	  	});
	  });
	  $('#playlistControls').show();
	}

	$('#startPlaylist').on('click', function(e){
		e.preventDefault();
		players['player1'].playVideo();

	});

	$('#pausePlaylist').on('click', function(e){
		e.preventDefault();
		pauseCurrentPlayer();
	});

	$('#resumePlaylist').on('click', function(e){
		e.preventDefault();
		players[playerCurrentlyPlayingId].playVideo();
	});

	$('#prevPlaylist').on('click', function(e){
		e.preventDefault();
		if (playerCurrentlyPlayingId !== null){
			pauseCurrentPlayer();
			if (playerCurrentlyPlayingNum === 1){
				playerCurrentlyPlayingNum = totalCount + 1;
				playerCurrentlyPlayingId = "player" + (totalCount+1);
			}
			playPrevVideo(playerCurrentlyPlayingId);
		}
	});

	$('#nextPlaylist').on('click', function(e){
		e.preventDefault();
		if (playerCurrentlyPlayingId !== null){
			pauseCurrentPlayer();
			if (playerCurrentlyPlayingNum === totalCount){
				playerCurrentlyPlayingNum = 0;
				playerCurrentlyPlayingId = "player0";
			}
			playNextVideo(playerCurrentlyPlayingId);
		}
	});


	function onPlayerStateChange(e){
		/*if press play on a video...*/
		if(e.data == YT.PlayerState.PLAYING){
			onYTPlay(e.target.a.id);
		}

		/*once a video is finished, automatically play the next video*/
		if(e.data == YT.PlayerState.ENDED){
			playNextVideo(e.target.a.id);
		}
	}

	function playPrevVideo(idPlayer){
		var idNum = idPlayer.match(/\d+/)[0];
		var idNumPrev = Number(idNum) - 1;
		var idPlayerPrev = "player" + idNumPrev;
		if (idNumPrev >= 1){
			players[idPlayerPrev].playVideo();
			playerCurrentlyPlayingNum = idNumPrev;
			playerCurrentlyPlayingId = idPlayerPrev;
		}
	}

	/*automatically play the next video, as long as it's not the last one*/
	function playNextVideo(idPlayer){
		var idNum = idPlayer.match(/\d+/)[0];
		var idNumNext = Number(idNum) + 1;
		var idPlayerNext = "player" + idNumNext;
		if (idNumNext <= totalCount){
			players[idPlayerNext].playVideo();
			playerCurrentlyPlayingNum = idNumNext;
			playerCurrentlyPlayingId = idPlayerNext;
		}
	}

	/*if another video is playing already, pause that video*/
	function onYTPlay(idPlayer){
	  if (playerCurrentlyPlayingId !== idPlayer && playerCurrentlyPlayingId !== null) {
	     pauseCurrentPlayer();
	  }
	  playerCurrentlyPlayingId = idPlayer;
	  playerCurrentlyPlayingNum = idPlayer.match(/\d+/)[0];
	  playerCurrentlyPlayingNum = Number(playerCurrentlyPlayingNum);
	}

	function pauseCurrentPlayer(){
	  var idPlayer = playerCurrentlyPlayingId;
	  players[idPlayer].pauseVideo();
	}


});


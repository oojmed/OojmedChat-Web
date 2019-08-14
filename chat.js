var ojToken;
var activeChannel;
var oldActiveChannel;
var username;

function setMaterialSwitchOn(key) {
	try {
		$('.for-' + key)[0].MaterialSwitch.on();
	} catch {

	}
}

function setMaterialSwitchOff(key) {
	try {
		$('.for-' + key)[0].MaterialSwitch.off();
	} catch {

	}
}

function loadSettings() {
	for (var i = 0; i < localStorage.length; i++){
		var key = localStorage.key(i);
		var value = localStorage.getItem(key);

		if (key.substring(0, 5) === "data-") {
			document.body.setAttribute(key, value);

			if (key != 'data-theme') {
				if (value === "true" || value === "light") {
					setTimeout(setMaterialSwitchOn, 0, key);
				} else {
					setTimeout(setMaterialSwitchOff, 0, key);
				}
			} else {
				if (value == "dark") {
					$('#nightMode').hide();
					$('#lightMode').show();
				} else {
					$('#nightMode').show();
					$('#lightMode').hide();
				}
			}
		}
	}
}

function saveSettings() {
	$.each(document.body.attributes, function() {
    if (this.name.substring(0, 5) === "data-") {
			localStorage.setItem(this.name, this.value);
		}
	});
}

function toggleChannelHidden(hider) {
	var channelContainer = document.getElementById("channel-container");

	if (channelContainer.className == "") {
		channelContainer.className = "hidden";
		document.getElementById("channel-hider-content").innerText = ">";
	} else {
		channelContainer.className = "";
		document.getElementById("channel-hider-content").innerText = "<";
	}

	saveSettings();
}

function toggle12HourTime(checkbox) {
	if (checkbox.checked) {
		document.body.setAttribute("data-12-hour-time", "true");
	} else {
		document.body.setAttribute("data-12-hour-time", "false");
	}

	update();

	saveSettings();
}

function toggleMessageShadows(checkbox) {
	if (checkbox.checked) {
		document.body.setAttribute("data-message-shadows", "true");
	} else {
		document.body.setAttribute("data-message-shadows", "false");
	}

	saveSettings();
}

function toggleChannelsPanelShadow(checkbox) {
	if (checkbox.checked) {
		document.body.setAttribute("data-channels-panel-shadow", "true");
	} else {
		document.body.setAttribute("data-channels-panel-shadow", "false");
	}

	saveSettings();
}

function toggleChannelsPanelHeaderShadow(checkbox) {
	if (checkbox.checked) {
		document.body.setAttribute("data-channels-panel-header-shadow", "true");
	} else {
		document.body.setAttribute("data-channels-panel-header-shadow", "false");
	}

	saveSettings();
}

function toggleMyMessagesRight(checkbox) {
	if (checkbox.checked) {
		document.body.setAttribute("data-my-messages-right", "true");
	} else {
		document.body.setAttribute("data-my-messages-right", "false");
	}

	saveSettings();
}

function toggleThickness(checkbox) {
	if (checkbox.checked) {
		document.body.setAttribute("data-thickness", "light");
	} else {
		document.body.setAttribute("data-thickness", "regular");
	}

	saveSettings();
}

function toggleAuthorBackground(checkbox) {
	if (checkbox.checked) {
		document.body.setAttribute("data-author-background", "true");
	} else {
		document.body.setAttribute("data-author-background", "false");
	}

	saveSettings();
}

function nightMode() {
	document.body.setAttribute("data-theme", "dark");

	document.getElementById("nightMode").style.display = "none";
	document.getElementById("lightMode").style.display = "block";

	saveSettings();
}

function lightMode() {
	document.body.setAttribute("data-theme", "light");

	document.getElementById("nightMode").style.display = "block";
	document.getElementById("lightMode").style.display = "none";

	saveSettings();
}

function channelClick(element) {
  location.href = '#' + element.href.split('#')[1];

	getChannel();

	var shownChannels = $.merge($("#channels").children(), $("#directs").children())

	for (var i = 0; i < shownChannels.length; i++) {
		shownChannels[i].className = "channel";
	}

	element.className = "current-channel";
}

function getCookie(cname) {
	var name = cname + '='
	var decodedCookie = decodeURIComponent(document.cookie)
	var ca = decodedCookie.split(';')

	for (var i = 0; i < ca.length; i++) {
		var c = ca[i]
		while (c.charAt(0) === ' ') {
			c = c.substring(1)
		}

		if (c.indexOf(name) === 0) {
			return c.substring(name.length, c.length)
		}
	}

	return ''
}

function formatTimestamp(date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();

	minutes = minutes < 10 ? '0' + minutes : minutes;
	seconds = seconds < 10 ? '0' + seconds : seconds;

	if (document.body.getAttribute("data-12-hour-time") === "true") {
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'

		return hours + ':' + minutes + ':' + seconds + ' ' + ampm;
	} else {
		hours = hours < 10 ? '0' + hours : hours;

		return hours + ':' + minutes + ':' + seconds;
	}
}

function message() {
	var msg = $("#messageInput").val();
	$("#messageInput").val("");

	if (msg != "") {
		$.post("https://api.oojmed.com/chat/message", {
				token: ojToken,
				channel: activeChannel,
				msg: msg
			})
			.done(function (data) {
				update();
			});
	}
}

function createDM(reciever) {
	$.post("https://api.oojmed.com/chat/message", {
			token: ojToken,
			channel: activeChannel,
			msg: "!sys_dm " + reciever
		})
		.done(function (data) {
			update();
		});
}

function createOrJoin() {
	var channel = $("#channelInput").val();
	$("#channelInput").val("");

	if (channel != "") {
		$.post("https://api.oojmed.com/chat/create_or_join", {
				token: ojToken,
				channel: channel
			})
			.done(function (data) {
				history.pushState({}, '', '#' + channel);

				update();
			})
			.fail(function (xhr, status, error) {
				console.error(xhr.responseText);
			});
	}
}

var lastLength = 0;

var lastInputLength = 0;

function getChannel() {
	try {
		activeChannel = decodeURIComponent(location.href.split('#')[1]);
	} catch (err) {
		activeChannel = location.href.split('#')[1];
	}
}

function isMod(user, mods) {
	return mods.indexOf(user) !== -1;
}

function shownChangesUsers(shownUsers, users) {
	for (var i = 0; i < shownUsers.length; i++) {
		var exists = false;

		for (var y = 0; y < users.length; y++) {
			if (shownUsers[i].id == "usr-" + users[y]["name"]) {
				exists = true;
			};
		}

		if (!exists) {
			shownUsers[i].remove();
		}
	}
}

function shownChangesChat(shownMessages, chatMessages) {
	for (var i = 0; i < shownMessages.length; i++) {
		var exists = false;

		var currentMessageJQuery = $(shownMessages[i]);
		var currentTimestampJQuery = $(currentMessageJQuery.children()[1]);

		for (var y = 0; y < chatMessages.length; y++) {
			if (shownMessages[i].id == "msg-" + chatMessages[y]["id"]) {
				exists = true;

				var formattedTimestamp = formatTimestamp(new Date(chatMessages[y]["create_date"] * 1000));
				if (currentTimestampJQuery.html() != '&nbsp;&nbsp;&nbsp;' + formattedTimestamp) {
					currentTimestampJQuery.html('&nbsp;&nbsp;&nbsp;' + formattedTimestamp);
				}
			};
		}

		if (!exists) {
			shownMessages[i].remove();
		}

		var currentAuthorJQuery = $(currentMessageJQuery.children()[0]);

		if (currentAuthorJQuery.css("font-size") != "0px") {
			var lastMessage = shownMessages[i - 1];

			if (lastMessage != undefined) {
				var currentMessageAuthor = currentAuthorJQuery.text();
				var lastMessageAuthor = $(lastMessage).children()[0].innerText;

				if (currentMessageAuthor == lastMessageAuthor) {
					currentAuthorJQuery.css("font-size", "0px");
					currentAuthorJQuery.attr("data-continued-message", "true");

					$(lastMessage).css("margin-bottom", "5px");

					currentTimestampJQuery.text(currentTimestampJQuery.text().substring(3));
				}
			}
		}
	}
}

function debugAdd(msg) {
	$("#debug").html($("#debug").html() + msg + '<br/>');
}

var t0 = undefined;
var t1 = undefined;
var t2 = undefined;
var t3 = undefined;

var debug = false;

var requestNum = 0;
var loopNum = 0;

var requestTime = 0;

var requestStarts = [];
var loopNums = [];

var maxRequestTime = 300;
var maxProcessingTime = 30;

function update() {
	window.t0 = performance.now();
	getChannel();
	window.t1 = performance.now();

	window.t2 = performance.now();

	requestStarts.push(window.t1);
	loopNums.push(loopNum);

	$.post("https://api.oojmed.com/chat/data", {
			token: ojToken,
			channel: activeChannel
		})
		.done(function (data) {
			document.getElementById("connectionError").className = "hidden";

			$("#debug").html("");

			debugAdd("getChannel() - " + (window.t1 - window.t0).toFixed(5) + "ms");

			window.t1 = performance.now();

			requestTime = (window.t1 - requestStarts[0]);

			requestStarts.shift();

			debugAdd("<br/>post - " + requestTime.toFixed(5) + "ms");

			window.t3 = performance.now();

			if (window.debug) {
				$("#debug").show();
			} else {
				$("#debug").hide();
			}

			window.t0 = performance.now();

			data = JSON.parse(data);

			var chatMessages = data['chat'];
			var mods = data['mods'];
			var users = data['users'];
			var channels = data['channels'];

			window.t1 = performance.now();
			debugAdd("<br/>dataInterpret - " + (window.t1 - window.t0).toFixed(5) + "ms");

			window.t0 = performance.now();

			var chat = $("#chat");
			var bottom = false;

			if (Math.round(chat.scrollTop() + chat.innerHeight()) >= chat[0].scrollHeight) {
				bottom = true;
			}

			window.t1 = performance.now();

			debugAdd("bottomScrollChatCheck - " + (window.t1 - window.t0).toFixed(5) + "ms");

			window.t0 = performance.now();

			shownChangesChat($("#chat").children(), chatMessages);

			window.t1 = performance.now();

			debugAdd("<br/>shownChangesChat() [1] - " + (window.t1 - window.t0).toFixed(5) + "ms");

			window.t0 = performance.now();

			if (oldActiveChannel != activeChannel) {
				$("#chat").html("");
			}

			for (var i = 0; i < chatMessages.length; i++) {
				var id = chatMessages[i]["id"];

				if ($("#msg-" + id).html() == undefined) {
					var msg = (' ' + chatMessages[i]["message"]).slice(1); //deep copy
					var user = chatMessages[i]["user"];

					var date = new Date(chatMessages[i]["create_date"] * 1000);

					for (var y = 0; y < users.length; y++) {
						var currentUser = users[y]["name"];

						if (msg.indexOf("@" + currentUser) !== -1) {
							var mentionClass = "author";

							if (currentUser == username) {
								mentionClass += " author-me";
							} else if (isMod(currentUser, mods)) {
								mentionClass += " author-mod";
							}

							var element = '<span class="' + mentionClass + '">@' + currentUser + '</span>';
							msg = msg.replace('@' + currentUser, element);
						}
					}

					msg = msg.replace(/(https?:\/\/.*\..*)/g, function(url) {
						return '<a href="' + url + '">' + url + '</a>';
					});

					var authorClass = "";
					var messageClass = "message";

					if (user == username) {
						authorClass = " author-me";
						messageClass += "-me";
					} else if (isMod(user, mods)) {
						authorClass = " author-mod";
					}

					var timestamp = "&nbsp;&nbsp;&nbsp;" + formatTimestamp(date);

					var element = '<div id="msg-' + id + '" class="' + messageClass + '"><div class="author' + authorClass + '">' + user + '</div><div class="timestamp">' + timestamp + '</div><div class="content">' + msg + "</div></div>";

					$(twemoji.parse(element)).hide().fadeIn(1000).appendTo("#chat");
				}
			}

			window.t1 = performance.now();

			debugAdd("messageDisplayer - " + (window.t1 - window.t0).toFixed(5) + "ms");

			window.t0 = performance.now();

			shownChangesChat($("#chat").children(), chatMessages);

			window.t1 = performance.now();

			debugAdd("shownChangesChat() [2] - " + (window.t1 - window.t0).toFixed(5) + "ms");

			window.t0 = performance.now();

			if ($("#chat").text().length != lastLength) {
				lastLength = $("#chat").text().length;

				if (bottom) {
					document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
				}

				if (document.visibilityState == "hidden") {
					//notify(data[data.length - 1]["user"], data[data.length - 1]["message"]);
				}
			}

			window.t1 = performance.now();

			debugAdd("<br/>scrollHandling - " + (window.t1 - window.t0).toFixed(5) + "ms");

			if ($("#messageInput").val().length != lastInputLength) {
				lastInputLength = $("#messageInput").val().length;
			}

			window.t0 = performance.now();

			for (var i = 0; i < channels.length; i++) {
        channels[i] = encodeURIComponent(channels[i]);
				var replacedChannel = channels[i].replace(/%/g, '-');

				if ($("#ch-" + replacedChannel).html() == undefined) {
					var c = "channel";

					if (channels[i] == activeChannel) {
						c = "current-channel";
					}

					var appendToElement = "channels";
					if (decodeURIComponent(channels[i]).substring(0, 3) === "DM/") {
						var other = decodeURIComponent(channels[i]).split('/').slice(-2).filter(u=>u!=username)[0];

						if (other == undefined) { other = username; }

						var element = '<a onclick="javascript:channelClick(this);" id="ch-' + replacedChannel + '" href="#' + channels[i] + '" class="' + c + '">' + other + '</a> <br />';

						appendToElement = "directs";
					} else {
						var element = '<a onclick="javascript:channelClick(this);" id="ch-' + replacedChannel + '" href="#' + channels[i] + '" class="' + c + '">' + decodeURIComponent(channels[i]) + '</a> <br />';
					}

					var realElement = $(twemoji.parse(element)).hide().fadeIn(1000).appendTo("#" + appendToElement);

					if (channels[i] == activeChannel) {
						channelClick(realElement[0]);
					}
				}
			}

			window.t1 = performance.now();

			debugAdd("<br/>channelDisplayer - " + (window.t1 - window.t0).toFixed(5) + "ms");

			window.t0 = performance.now();

			shownChangesUsers($("#users").children(), users);

			window.t1 = performance.now();

			debugAdd("<br/>shownChangesUsers() [1] - " + (window.t1 - window.t0).toFixed(5) + "ms");

			window.t0 = performance.now();

			for (var i = 0; i < users.length; i++) {
				var replacedUser = users[i]["name"].replace(/ /g, '-');

				if ($("#usr-" + replacedUser).html() == undefined) {
					var c = "";

					if (users[i]["name"] == username) {
						c = " author-me";
					} else if (isMod(users[i]["name"], mods)) {
						c = " author-mod";
					}

					var element = '<div class="mdl-list__item" id="usr-' + replacedUser + '"><span class="mdl-list__item-primary-content"><i class="material-icons mdl-list__item-icon">person</i><span>' + users[i]["name"] + '</span></span><div class="mdl-list__item-secondary-action" onclick="javascript:createDM(\'' + users[i]["name"] + '\');"><i class="material-icons">chat_bubble</i></div></div>';

					$(twemoji.parse(element)).hide().fadeIn(1000).appendTo("#users");
				}
			}

			window.t1 = performance.now();

			debugAdd("userDisplayer - " + (window.t1 - window.t0).toFixed(5) + "ms");

			window.t0 = performance.now();

			shownChangesUsers($("#users").children(), users);

			window.t1 = performance.now();

			debugAdd("shownChangesUsers() [2] - " + (window.t1 - window.t0).toFixed(5) + "ms");

			window.t1 = performance.now();

			debugAdd("<br/>totalTimeIncludingRequest - " + (window.t1 - window.t2).toFixed(5) + "ms");

			var procTime = (window.t1 - window.t3);
			debugAdd("totalProcessingTime - " + procTime.toFixed(5) + "ms");

			debugAdd("<br/>requestNum - " + requestNum);
			debugAdd("loopNum - " + loopNum);
			debugAdd("activeChannel - " + activeChannel);

			if (procTime > maxProcessingTime) {
				console.log($("#debug").html().replace(/<br\s*[\/]?>/gi, '\n'));

				if (!debug) {
					$("#debug").html("");
				}

				$("#debug").show();

				debugAdd('<span style="color: red;">Processing is taking longer than usual (>' + maxProcessingTime + 'ms)</span>');
			}

			/*if (requestTime > maxRequestTime) {
				if (!debug) { $("#debug").html(""); }

				$("#debug").show();

				debugAdd('<span style="color: red;">High latency (>' + maxRequestTime + 'ms) - ' + requestTime + 'ms</span>');
			}*/

			oldActiveChannel = activeChannel;

			requestNum++;
		})
		.fail(function (xhr, status, error) {
			document.getElementById("connectionError").className = "";
			console.error(xhr.responseText);
		});

	loopNum++;
}

function notify(author, message) {
	if (Notification.permission === "granted") {
		var options = {
			body: author + ": " + message,
			icon: undefined
		};

		var n = new Notification("Doggo Chat", options);
	}
}

function setupNotifications() {
	if (!("Notification" in window)) {
		alert("No desktop notifications supported");
	} else if (Notification.permission !== "denied") {
		Notification.requestPermission();
	}
}

function getNick() {
	ojToken = getCookie('oojmed_token');

	if (ojToken == '') {
		alert('Not signed in to oojmed.com, please sign in or sign up.');
		location.href = 'https://oojmed.com';

		return;
	}

	$.post("https://api.oojmed.com/username", {
			token: ojToken
		})
		.done(function (msg) {
			username = msg;
		})
		.fail(function (xhr, status, error) {
			alert("Invalid Access Token - Please login again");

			location.href = 'https://oojmed.com';
		});

	//init user in chat / check token
	$.post("https://api.oojmed.com/chat/init", {
			token: ojToken
		})
		.done(function (msg) {})
		.fail(function (xhr, status, error) {
			console.log(xhr.responseText + ' (this is normal)');
			//location.href = 'https://oojmed.com';
		});
}

function load() {
	loadSettings();

	getNick();

	getChannel();

	if (activeChannel === "undefined") {
		activeChannel = "lobby";

		history.pushState({}, '', '#lobby');
	}

	setInterval(update, 500);

	$("#chat-container").mousemove(function (event) {
		var relativePosition = event.pageX - $("#chat-container").offset().left;
		var width = $("#chat-container").width();

		var hidden = document.getElementById("channel-container").className == "hidden";

		if (relativePosition < width / 10) {
			$("#channel-hider").css("opacity", 0.75);

			if (!hidden) { $("#channel-hider").css("left", "225px"); } else { $("#channel-hider").css("left", "0px"); }
		} else {
			$("#channel-hider").css("opacity", 0);

			if (!hidden) { $("#channel-hider").css("left", "200px"); } else { $("#channel-hider").css("left", "-25px"); }
		}
	});

	$("#channel-container").mousemove(function (event) {
		$("#channel-hider").css("left", "225px");
	});

	$("#channel-hider").mouseup(function (event) {
		var hidden = document.getElementById("channel-container").className == "hidden";

		if (hidden) { $("#channel-hider").css("left", "225px"); } else { $("#channel-hider").css("left", "-25px"); }
	});

	$('#settingsModal').on('shown.bs.modal', function (e) {
		$('#settingsToggle').addClass('spin').removeClass('spin-hover');
	});

	$('#settingsModal').on('hidden.bs.modal', function (e) {
		$('#settingsToggle').one("webkitAnimationIteration oanimationiteration MSAnimationIteration animationiteration", function(event) {
			$('#settingsToggle').addClass('spin-hover').removeClass('spin');
		});
	});

	$('#usersModal').on('shown.bs.modal', function (e) {
		$('#usersToggle').addClass('spin').removeClass('spin-hover');
	});

	$('#usersModal').on('hidden.bs.modal', function (e) {
		$('#usersToggle').one("webkitAnimationIteration oanimationiteration MSAnimationIteration animationiteration", function(event) {
			$('#usersToggle').addClass('spin-hover').removeClass('spin');
		});
	});

	var coll = document.getElementsByClassName("collapsible");
	var i;

	for (i = 0; i < coll.length; i++) {
  	coll[i].addEventListener("click", function() {
    	this.classList.toggle("collapsible-active");

    	var content = this.nextElementSibling;
    	if (content.style.maxHeight){
      	content.style.maxHeight = null;
    	} else {
      	content.style.maxHeight = content.scrollHeight + "px";
    	}
  	});
	}

	update();

	//setupNotifications();
}

var ojToken;
var activeChannel;
var oldActiveChannel;
var username;

function toggleChannelHidden(hider) {
	var channelContainer = document.getElementById("channel-container");

	if (channelContainer.className == "") {
		channelContainer.className = "hidden";
		hider.innerText = "<";
		$(hider).css('right', '-5px');
	} else {
		channelContainer.className = "";
		hider.innerText = ">";
		$(hider).css('right', '-225px');
	}
}

function toggleMyMessagesRight(checkbox) {
	if (checkbox.checked) {
		document.body.setAttribute("data-my-messages-right", "true");
	} else {
		document.body.setAttribute("data-my-messages-right", "false");
	}
}

function toggleThickness(checkbox) {
	if (checkbox.checked) {
		document.body.setAttribute("data-thickness", "light");
	} else {
		document.body.setAttribute("data-thickness", "regular");
	}
}

function toggleAuthorBackground(checkbox) {
	if (checkbox.checked) {
		document.body.setAttribute("data-author-background", "true");
	} else {
		document.body.setAttribute("data-author-background", "false");
	}
}

function nightMode() {
	document.body.setAttribute("data-theme", "dark");

	document.getElementById("nightMode").style.display = "none";
	document.getElementById("lightMode").style.display = "block";
}

function lightMode() {
	document.body.setAttribute("data-theme", "light");

	document.getElementById("nightMode").style.display = "block";
	document.getElementById("lightMode").style.display = "none";
}

function channelClick(element) {
	activeChannel = element.innerText;

	var shownChannels = $("#channels").children();

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

	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0' + minutes : minutes;
	seconds = seconds < 10 ? '0' + seconds : seconds;

	var strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;

	return strTime;
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

function shownChanges(shownMessages, chatMessages) {
	for (var i = 0; i < shownMessages.length; i++) {
		var exists = false;

		for (var y = 0; y < chatMessages.length; y++) {
			if (shownMessages[i].id == "msg-" + chatMessages[y]["id"]) {
				exists = true;
			};
		}

		if (!exists) {
			shownMessages[i].remove();
		}

		var currentMessageJQuery = $(shownMessages[i]);
		var currentAuthorJQuery = $(currentMessageJQuery.children()[0]);

		if (currentAuthorJQuery.css("font-size") != "0px") {
			var lastMessage = shownMessages[i - 1];

			if (lastMessage != undefined) {
				var currentMessageAuthor = currentAuthorJQuery.text();
				var lastMessageAuthor = $(lastMessage).children()[0].innerText;

				if (currentMessageAuthor == lastMessageAuthor) {
					currentAuthorJQuery.css("font-size", "0px");
					currentAuthorJQuery.attr("data-continued-message", "true");

					$(lastMessage).css("margin-bottom", "10px");

					var currentTimestampJQuery = $(currentMessageJQuery.children()[1]);
					currentTimestampJQuery.text(currentTimestampJQuery.text().substring(1));
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

			shownChanges($("#chat").children(), chatMessages);

			window.t1 = performance.now();

			debugAdd("<br/>shownChanges() - " + (window.t1 - window.t0).toFixed(5) + "ms");

			window.t0 = performance.now();

			if (oldActiveChannel != activeChannel) {
				$("#chat").html("");
			}

			for (var i = 0; i < chatMessages.length; i++) {
				var id = chatMessages[i]["id"];

				if ($("#msg-" + id).html() == undefined) {
					var msg = (' ' + chatMessages[i]["message"]).slice(1); //deep copy
					var user = chatMessages[i]["user"];
					var date = new Date(chatMessages[i]["create_date"] + ' UTC');

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

					var timestamp = "&nbsp;" + formatTimestamp(date);

					var element = '<div id="msg-' + id + '" class="' + messageClass + '"><div class="author' + authorClass + '">' + user + '</div><div class="timestamp">' + timestamp + '</div><div class="content">' + msg + "</div></div>";

					$(twemoji.parse(element)).hide().fadeIn(1000).appendTo("#chat");
				}
			}

			window.t1 = performance.now();

			debugAdd("messageDisplayer - " + (window.t1 - window.t0).toFixed(5) + "ms");

			window.t0 = performance.now();

			shownChanges($("#chat").children(), chatMessages);

			window.t1 = performance.now();

			debugAdd("shownChanges() [2] - " + (window.t1 - window.t0).toFixed(5) + "ms");

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
				var replacedChannel = channels[i].replace(/ /g, '-');

				if ($("#ch-" + replacedChannel).html() == undefined) {
					var c = "channel";

					if (channels[i] == activeChannel) {
						c = "current-channel";
					}

					var element = '<a onclick="javascript:channelClick(this);" id="ch-' + replacedChannel + '" href="#' + channels[i] + '" class="' + c + '">' + channels[i] + '</a> <br />';

					var realElement = $(twemoji.parse(element)).hide().fadeIn(1000).appendTo("#channels");

					if (channels[i] == activeChannel) {
						channelClick(realElement[0]);
					}
				}
			}

			window.t1 = performance.now();

			debugAdd("<br/>channelDisplayer - " + (window.t1 - window.t0).toFixed(5) + "ms");

			/*window.t0 = performance.now();

			$("#users").text("");
			for (var i = 0; i < users.length; i++) {
				var c = "";

				if (users[i]["name"] == username) {
					c = " author-me"
				} else if (isMod(users[i]["name"], mods)) {
					c = " author-mod";
				}

				var element = '<span class="user' + c + '">' + users[i]["name"] + '</span>'

				if (i != users.length - 1) {
					$("#users").append(element + ", ");
				} else {
					$("#users").append(element);
				}
			}

			window.t1 = performance.now();

			debugAdd("userDisplayer - " + (window.t1 - window.t0).toFixed(5) + "ms");*/

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
			$("#debug").html("");

			$("#debug").show();

			debugAdd('<span style="color: red;">Connection error</span>');
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

		if (relativePosition < width / 10) {
			$("#channel-hider").css("opacity", 0.75);
		} else {
			$("#channel-hider").css("opacity", 0);
		}
	});

	//setupNotifications();
}

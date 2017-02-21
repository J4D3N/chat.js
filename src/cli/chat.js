var cfg = {
	ssl: false,
	ip: "127.0.0.1",
	port: 1940
};

var log = null,
	socket = null,
	connected = false,
	connections = 0,
	nickname = null;

$(document).ready(function() {
	init();
});

function init() {
	log = $("#chat .log");
	connect();
	input();
	name();
}

function name() {
	var newNickname = prompt("Please enter your nickname", "BobSmith123" || nickname);
	if(newNickname !== nickname) {
		nickname = newNickname;
		if(connected && nickname !== undefined && nickname !== null) {
			sendNickname(nickname);
		}
	}
}

function input() {
	var textarea = $("#chat textarea");
	textarea.keypress(function(e) {
		if(e.keyCode === 13 && !e.shiftKey) {
			var val = textarea.val();
			if(val.length > 0) {
				textarea.val("");
				if(val === "!nick") name();
				else if(val === "!clear") log.empty();
				else sendChatMessage(val);
			}
			return false;
		}
	});
	$("#chat").on("click", "img.emojione", function(e) {
		var emoji = $(e.target).attr("title");
		if(emoji.length + textarea.val().length <= 120) {
			textarea.val(textarea.val() + emoji);
		}
	});
}

function connect() {
	socket = new WebSocket((cfg.ssl ? "wss://" : "ws://") + cfg.ip + ":" + cfg.port);
	socket.onopen = function() {
		connected = true;
		console.log("Connected");
		sendNickname(nickname);
	};
	socket.onclose = function() {
		connected = false;
		console.log("Disconnected");
		setTimeout(function() {
			console.log("Attempting to reconnect");
			connect();
		}, 5000);
	};
	socket.onmessage = onMessage;
}

function onMessage(message) {
	try {
		var json = JSON.parse(message.data);
		if(json.type === "message") {
			push(json.name, json.message, json.colour);
		} else if(json.type === "connections") {
			connections = parseInt(json.count);
		}
	} catch(e) {
		console.log("Invalid packet", e);
	}
}

function push(name, message, colour) {
	var div = $("<div>");
	message = message.replace(/\n/g, "<br/>");
	message = emojione.toImage(message);
	div.html('<span class="meta"><span style="color: ' + (colour || "#000000") + ';" class="name">' + name + '</span><span class="colon">:</span></span><span class="message">' + message + '</span>');
	log.append(div);
	log[0].scrollTop = log[0].scrollHeight + div[0].scrollHeight;
}

function sendNickname(nickname) {
	if(connected) {
		socket.send(JSON.stringify({
			type: "name",
			name: nickname
		}));
	}
}

function sendChatMessage(message) {
	if(connected) {
		socket.send(JSON.stringify({
			type: "message",
			message: message
		}));
	}
}

var fs = require("fs");
var cfg = {
	ssl: false,
	port: 1940,
	ssl_key: "",
	ssl_cert: "",
	origin: ["test"]
};

log("Initialising server on port: " + cfg.port);

var httpServ = cfg.ssl ? require("https") : require("http");
var WebSocketServer = require("websocket").server;

if(cfg.ssl) {
	server = httpServ.createServer({
		key: fs.readFileSync(cfg.ssl_key),
		cert: fs.readFileSync(cfg.ssl_cert)
	}, request).listen(cfg.port);
} else {
	server = httpServ.createServer(request).listen(cfg.port);
}

var nextId = 0;
var clients = [];

wsServer = new WebSocketServer({httpServer: server});
wsServer.on("request", function(request) {
	if(cfg.origin.length > 0) {
		if(cfg.origin.indexOf(request.origin) === -1) {
			request.reject();
			log("Connection from origin " + request.origin + " rejected");
			return;
		}
	}

	var connection = request.accept(null, request.origin);
	var id = nextId++;
	var client = {
		con: connection,
		id: id,
		name: "Client #" + id,
		colour: randomHex()
	};

	clients.push(client);
	clients.forEach(function(cli) {
		cli.con.sendUTF(JSON.stringify({
			type: "connections",
			count: clients.length
		}));
	});

	log("\"" + client.name + "\" has connected (" + request.remoteAddress + ")");

	connection.on("message", function(message) {
		if(message.type === "utf8") {
			try {
				var json = JSON.parse(message.utf8Data, false);
				if(json.type === "name") {
					var name = json.name;
					if(name === null || name === undefined) {
						return;
					}
					log("\"" + client.name + "\" is now known as \"" + name + "\"");
					client.name = name;
				} else if(json.type === "message") {
					var msg = json.message.trim();
					if(msg.length <= 0 || msg.length > 120) {
						return;
					}
					clients.forEach(function(cli) {
						cli.con.sendUTF(JSON.stringify({
							type: "message",
							name: client.name,
							message: msg,
							colour: client.colour
						}));
					});
					log("\"" + client.name + "\": \"" + msg + "\"");
				} else {
					throw new Error("What are you trying to send?");
				}
			} catch(e) {
				log("Invalid packet");
			}
		}
	});

	connection.on("close", function(connection) {
		clients.splice(clients.indexOf(client), 1);
		clients.forEach(function(cli) {
			cli.con.sendUTF(JSON.stringify({
				type: "connections",
				count: clients.length
			}));
		});
		log("\"" + client.name + "\" has disconnected");
	});
});

function randomHex() {
	var hsl = randomHsl();
	return hslToHex(hsl.h, hsl.s, hsl.l);
}

function randomHsl() {
	return {
		h: Math.random() * 360,
		s: Math.random() * 100,
		l: (Math.random() * 40) + 20
	};
}

function hslToHex(h, s, l) {
	var rgb = hslToRgb(h, s, l);
	return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function rgbToHex(r, g, b) {
	var toHex = function(x) {
		var hex = x.toString(16);
		return hex.length === 1 ? "0" + hex : hex;
	};
	return "#" + toHex(r) + toHex(g) + toHex(b);
}

function hslToRgb(h, s, l) {
	h /= 360;
	s /= 100;
	l /= 100;

	var r, g, b;

	if(s === 0) {
		r = g = b = l;
	} else {
		var hue2rgb = function(p, q, t) {
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		};
		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}
	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255)
	};
}

function request(request, response) {
	response.writeHead(200);
	response.end("All glory to WebSockets!\n");
}

function log(msg) {
	console.log((new Date()) + ": " + msg);
}

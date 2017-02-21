# chat.js

This is a client and server side implementation of a chat box using WebSockets and NodeJS.

## Features

* Emojione emoji's shortcode and unicode
* Modern design
* Connections counter (could be used with a live stream)
* Origin limiter (block people from other websites using your server)
* Random user colours
* WebSocket SSL support

# Installation

The client code should be hosted on a HTTP(S) server and accessed with a browser that supports WebSockets.

The server should have NodeJS installed with this command in the same directory:

```bash
$ npm install http https websocket fs
```
Then modify the config options in the chat-server.js file (port, origin and ssl).

# Usage

The client code should be hosted on a HTTP(S) server.

To start the server:

```bash
$ node chat-server.js
```

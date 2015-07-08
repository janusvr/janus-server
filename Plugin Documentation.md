# Plugins

A plugin must implement ```Plugin()``` and ```Plugin.prototype.call()```.

```Plugin()``` will be called when the plugin is first loaded, do any initialization here.

```Plugin.prototype.call()``` will vary depending on the plugin type.

## methodPlugins

Method plugins are npm packages that allow you to add methods (commands) to the server.

Here is an example of a minimal method plugin:

```
function Plugin() {
    console.log("Loading janus-method-example");
    log.info("Loading janus-method-example");
}

Plugin.prototype.call = function(data) {
    var user = data._userList[data._userId];

    user.send("okay");
}

module.exports = Plugin;

```

To load the plugin, add it to 'config.js':

```
    /* methodPlugins add new commands to the server */
    methodPlugins: {
        example: { plugin: "janus-method-example" }
    },
```

```Plugin.prototype.call()``` will now be called any time a client sends a command with the method "example".

```data``` will have the following additional attributes:

* _userId - The userId of the calling client.

* _userList - The global user list, each user has these attributes:

    * roomId - The id of the room the client is in.

    * send() - A function to send data to the user's client.

* _roomEmit() - A function to send data to everyone in the user's current room.

Now, when a client sends

```json
{ "method": "example" }
```

the server will reply

```json
{ "method": "okay" }
```

## hookPlugins

Hook plugins add functions to an existing method.

You might hook the "logon" method to perform user authentication, or the "enter_room" method to check if a user is authorized to enter.

Here is an example of a minimal hook plugin:

```
function Plugin() {
    console.log("Loading janus-hook-example");
    log.info("Loading janus-hook-example");
}

Plugin.prototype.call = function(name, session, data) {
    var user = data._userList[data._userId];

    var authorizedUsers = getAuthorizedUsers(data.roomId);

    if(authorizedUsers[data._userId] == undefined) {
        user.send("You are not authorized!");
    }
    else user.send("okay");
}

module.exports = Plugin;

```

To load the plugin, add it to 'config.js':

```
    /* hookPlugins are called while parsing messages */
    hookPlugins: {  
        enter_room: { 
            plugins: [ "janus-hook-example" ]
        }
    },

```

```Plugin.prototype.call()``` will now be called any time the "enter_room" method is called.

```data``` will have the following additional attributes:

* _userId - The userId of the calling client.

* _userList - The global user list, each user has these attributes:

    * roomId - The id of the room the client is in.

    * send() - A function to send data to the user's client.

## intervalPlugins

Interval plugins are called at specified intervals.

Here is an example of a minimal interval plugin:

```
function Plugin(server) {
    console.log("Loading janus-interval-example");
    log.info("Loading janus-interval-example");
    this._server = server;
}

Plugin.prototype.call = function() {
    var users = this._server._userList;

    for(u in users) {
        console.log(u + " is online");
    }
}

module.exports = Plugin;
```

To load the plugin, add it to 'config.js':

```
    /* intervalPlugins are called in intervals specified in seconds. */
    intervalPlugins: [
        { plugin: "janus-interval-example", interval: 5 }
    ],
```

```Plugin.prototype.call()``` will now be called every 5 seconds.

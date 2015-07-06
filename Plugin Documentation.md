# Plugins

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

```

'data' will have the following additional attributes:

* _userId - The userId of the calling client.

* _userList - The global user list, each user has these attributes:

    * roomId - The id of the room the client is in.

    * send() - A function to send data to the user's client.

To load the plugin, add it to 'config.js':

```json
    /* methodPlugins add new commands to the server */
    methodPlugins: {
        example: { plugin: "janus-method-example" }
    },
```

Now, when a client sends

```json
{ "method": "example" }
```

the server will reply

```json
{ "method": "okay" }
```

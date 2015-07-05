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
    data._session.send("okay");
}

```

'data' will contain a reference to the current session and allow you to communicate with the client.

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

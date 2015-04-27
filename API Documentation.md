### General Features

| Feature | Description |
| ---------------------- | ---- |
|**Default Listening Port**|5566|
|**Protocol**|Ordinairy socket, UTF-8 encoded|
|**Encoding**|UTF-8|
|**Message Format**|JSON objects formatted onto a single line|
|**Message Structure**|<ul><li>Every packet must contain a "method" field</li><li>Every packet can also optionally contain a "data" field</li></ul>|

### Example

You can test that the server is up by using telnet.

> telnet babylon.vrsites.com 5566

Copy and paste the examples below to see how it works

=================================
### 1. Client -> Server Methods:
=================================

-----------------------
#### 1.1 "logon" Method
-----------------------

You need to do this before anything else.

There are 3 Server Modes in this release and the way you login is affected by the Server Mode that has been set.

* Server Mode 1: Free for all, anybody can log on with any user ID as long as nobody online is using that ID
* Server Mode 2: Registered and not registered, anybody can log on with any user ID.  However, they will need to provide a matching password if the user ID has been registered with the current server
* Server Mode 3: Registered only.  You can only login with a registered ID and you must provide the correct matching password to login.

The current release defaults to **Server Mode 2**.  The Server Mode is configured in the config.js file, but **Server Mode 2** is the only implemented mode in this release.

Client -> Server Message Example:

In Server Mode 2, you can login without a password if the userId you are using has not been registered.  However, you will need to provide a password if your userId HAS been registered.

This is an example of a message to logon with if the userId "LL" has not been registered:

> {"method":"logon","data":{"userId":"LL", "version":"23.4","roomId":"345678354764987457"}}

This is an example of a message to logon with if the userId "LL" HAS been registered and therefore requires a password (recommend that this is not used until security tightened up in release):

> {"method":"logon","data":{"userId":"LL", "version":"23.4","roomId":"345678354764987457","password":"MyPassword"}}

roomId = the room you are starting in and you will be subscribed to that room's events.  
version = the client version
roomId = MD5 hash of the room's URL
password = password associated with userId

Server -> Client Response Example:

If everything is OK and you logged in then you will receive: 

> {"method":"okay"}

If no roomId was found in the logon request:

> {"method":"error", "data":{"message":"Missing roomId in data packet"}}

If no userId was found in the logon request:

> {"method":"error", "data":{"message": "Missing userId in data packet"}}

If the userId is already in use:

> {"method":"error", "data":{"message": "User name is already in use"}}

If the username or password you have provided is wrong:

> POTENTIAL BUG FOR THIS CASE AT THE MOMENT

If you call any other methods before calling logon successfully:

> POTENTIAL BUG FOR THIS CASE AT THE MOMENT

TODO: Add authentication - Mode 1 and 3 have not been implemented.  Mode 2 should probably be tightened up - password is currently in the clear - would recommend some kind of security if this is going to be used in live environment...
TODO: Reject incompatable clients  
TODO: Oculushut note - some potential bugs: Looks like "Missing or wrong password" will be shown if you forget to login before calling other methods - probably better to send back "Please login before calling other methods".  Looks like "passwordrequest" is sent back to the client if you fail password authentication - probably better to send back "Missing or wrong password" message.  Looks like you will not be able to login even if your username is free even in Server Mode 2.  Probably best only send "passwordrequest" if there was no password in payload.  Need to check all of these once installed...

----------------------------
#### 1.2 "enter_room" Method
----------------------------

When you pass through a portal:

> {"method":"enter_room", "data": { "roomId": "345678354764987457" }}

----------------------
#### 1.3 "move" Method
----------------------

When the user position has moved:

> {"method":"move", "data": [0,0,0,0,0,0,0] }

Data can be anything you like, it will be passed to observers without validation

-----------------------
#### 1.4 "chat" Method
-----------------------

When the user wants to send a text message:

> {"method":"chat", "data": "The message"}

You can pass anything through the data field and it will be sent to all clients subscribed to the current room.

----------------------------
#### 1.5 "subscribe" Method
----------------------------

When you wish to start receiving events about a room (you are in that room or looking through a portal)

> {"method":"subscribe", "data": { "roomId": "345678354764987457" }}

Will receive the following if everything is OK.

> {"method":"okay"}

------------------------------
#### 1.6 "unsubscribe" Method
------------------------------

When you no longer wish to receive messages from that room because none of its portals are visible

> {"method":"unsubscribe", "data": { "roomId": "345678354764987457" }}

Will receive the following if everything is OK.

> {"method":"okay"} 

-------------------------
#### 1.7 "portal" Method
-------------------------

When a user creates a new portal:

> {"method":"portal", "data":{"url":"http://...", "pos":[1,2,4], "fwd":[0,1,0]}}

Will receive the following if everything is OK.

Will receive: {"method":"okay"}

--------------------------------
#### 1.8 "getusersonline" Method
--------------------------------

Request how many users are connected to the server:

> {"method":"getusersonline"}

Will receive the following if everything is OK.

Will receive: {"data":2, method":"getusersonline"}

======================================
### 2. Server -> Client Notifications:
======================================

----------------------------------
#### 2.1 "user_moved" notification
----------------------------------

When a user moves in any room that you are subscribed too, will recive notification about your own movement.

> {"method":"user_moved","data":{"roomId":"fgdgd","userId":"LL","position":[0,0,0,0,0,0,0]}}

----------------------------------
#### 2.2 "user_chat" notification
----------------------------------

When a user says something in text chat.

> {"method":"user_chat", "data":{"message":"The message", "userId":"LL"}}

------------------------------------------------
#### 2.3 "user_leave"/"user_enter" notification
------------------------------------------------

When a user changes room:

> {"method":"user_leave", "data":{"userId":"LL","roomId":"oldRoomId"}}

> {"method":"user_enter", "data":{"userId":"LL","roomId":"newRoomId"}}

The followed up with a move "user_moved" event

-----------------------------------
#### 2.4 "user_portal" notification
-----------------------------------

When a user creates a portal

> {"method":"user_portal", "data":{"userId":"LL","roomId":"345678354764987457","url":"http://...", "pos":[0,0,0], "fwd":[0,1,0]}}

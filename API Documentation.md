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

Client -> Server Message Example:

> {"method":"logon","data":{"userId":"LL", "version":"23.4","roomId":"345678354764987457"}}

Server -> Client Response Example:

Will receive: 

> {"method":"okay"} if everything was okay or a {"method":"error", "data":{"message": "Some error string"}}

You need to do this before anything else.  roomId is the room you are starting in and you will be subscribed to that room's events.  Version is the client version and roomId is a MD5 hash of the room's URL. Logon will fail if a client is already using that name 

TODO: Add authentication
TODO: Reject incompatable clients  

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

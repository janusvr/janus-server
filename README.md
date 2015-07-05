# Janus VR Presence Server

This version is the one that VR Sites runs, which is the default server unless another is specified in your `<Room>` code. [Read here](http://www.dgp.toronto.edu/~mccrae/projects/firebox/notes.html#multiserver) to learn how your room can specify a different server.

## Introduction

The Janus VR Presence Server is an open source project started by [Lisa Croxford](https://github.com/lisa-lionheart) which allows one JanusVR client to share information with another client. It enables multiplayer.  The server software is what allows each of the JanusVR clients know where other avatars are geographically and who else is in the same virtual space.  It is also what enables things like chat.

If you need more information or would like to get involved, you will find most JanusVR enthusiasts on the [JanusVR subreddit](http://www.reddit.com/r/janusVR/). You can also read the `CONTRIBUTORS.md` file in the root of this repository.

If you want to understand how a client interacts with the Janus VR Presence Server then checkout the `API Documentation.md` in the root of this repository.

## Installation

1. Download and install node from [nodejs.org](http://nodejs.org)
1. Clone this repo or download the latest release via the [releases page on GitHub](https://github.com/janusvr/janus-server/releases).
1. `cd` into the root of the repository where `server.js` is located and run `npm install` to install all module dependencies listed in `package.json`. The modules will be placed into the `node_modules` folder and are required for the server to start.
1. Copy `config-example.js` to `config.js` and change any of the variables you require to run your server. It's fairly well commented to guide you.

### SSL
SSL is not required to run your server, but it is recommended. At the very least you should go through the self-signed SSL process outlined below.

---
#### Self-signed SSL
Run the `./generate_key` script in the root of the repository to generate a SSL certificate for the server.

* When asked to provide a Common Name for the server enter the domain name the server will be running on. I.e. `yourdomain.com`. If running a development version of the server on OSX you can also use your Bonjour name i.e. `yourcomputer.local`. On OSX you can see your computer's Bonjour name by going to System Preferences -> Sharing and looking under the Computer Name field.
* When asked to provide a challenge password while generating the SSL certificate press enter to skip setting a password.

#### Certified SSL
If you have a valid SSL certificate:

1. Save the key file as *cert/server-key.pem*
1. Save the certificate file as *cert/server-cert.pem*
1. Save your CA's intermediate certificates as *cert/cabundle.pem*

## Running the Server

1. `cd` to the root of the repository where `server.js` is located.
1. Run the following command to start the server: `node server.js`. If you want this to run continually, you may want to look into using `forever` or `pm2` which are node modules built specifically for running other node server applications.
1. Launch the JanusVR client with paramters to connect to your server.
 * **Windows** Create a shortcut to JanusVR and add the following arguments after the path to the JanusVR executable
    * `-server my.server.com -port 5566` where `my.server.com` is the IP address of your computer (`127.0.0.1` or `localhost` should also work here) and where `5566` is the port that the server is running on as defined in `config.js`.
 * **OSX** You can run the client from the command line by navigating to `janusvr.app/Contents/MacOS/` and running
    * `./janusvr -server my.server.com -port 5566` for non-ssl
    * `./janusvr -server my.server.com -port 5567` for ssl

Contributing
------------
We have a contributors guide in the CONTRIBUTORS.md file found in this directory.

Troubleshooting
------------------

> I cannot see other people when using JanusVR and I know others have the same server configured.

Press `/` once JanusVR has started. JanusVR will list all the servers you are trying to connect to or ARE connected to. You should see your server in this list. If your server is red then it means that JanusVR cannot connect to it. Check firewall settings on the server to make sure that port `5566` and `5567` (for SSL) are open and able to receive traffic. Check the `server.log` file on the server to see if there are any errors.

> I entered the wrong details in for my key after executing `./generate_key`.

`./generate_key` will generate 3 files based on your input:
* `/cert/server-key.pem`
* `/cert/server-cert.pem`
* `/cert/cabundle.pem`  
Just delete these and execute './generate_key' again.

> I have a general problem and need some troubleshooting info about the server application.

Check out the `server.log` file. Just tail it and you will see the log being written to as activities take place - e.g. logging on etc.

## License
This project is licensed under the MIT license. See the LICENSE.txt file in this directory for complete text.

Janus VR Presence Server
========================

This version is the one that VR Sites runs, which is the default server unless another is specified in your `<Room>` code. [Read here](http://www.dgp.toronto.edu/~mccrae/projects/firebox/notes.html#multiserver) to learn how your room can specifiy a different server.

Introduction
------------

The Janus VR Presence Server is an open source project started by LisaLionheart which allows one JanusVR client to share information another client.  It enables multiplayer.  The server software is what allows each of the JanusVR clients know where other avatars are geographically and who else is in the same virtual space.  It is also what enables thing like chat.

If you need more information or would like to get involved, you will find most JanusVR enthusiasts on the [JanusVR subreddit](http://www.reddit.com/r/janusVR/).

If you want to understand how a client interacts with the Janus VR Presence Server then checkout the Application Programming Interface documentation called README.md.

Installation
------------

1. Download and install node from [nodejs.org](http://nodejs.org)

2. `cd` into the root of the repository where `server.js` is located and run `npm install` to install all module
dependencies listed in `package.json`. Note that you may have to run this command with `sudo` depending on your system
configuration.

3. The modules will be placed into the `node_modules` folder and are required for the server to start.

4. a. For self-signed SSL, run the following script in the root of the repository: `./generate_key` to generate a SSL certificate for the server.

   OR

   b. If you have a valid SSL certificate: 

      Save the key file as *cert/server-key.pem*

      Save the certificate file as *cert/server-cert.pem*

      Save your CA's intermediate certificates as *cert/cabundle.pem*

5. When asked to provide a Common Name for the server enter the domain name the server will be running on. I.e.
`yourdomain.com`. If running a development version of the server on OSX you can also use your Bonjour name i.e.
`yourcomputer.local`. On OSX you can see your computer's Bonjour name by going to System Preferences -> Sharing and
looking under the Computer Name field.

6. When asked to provide a challenge password while generating the SSL certificate press enter to skip setting a password.


**Remember to configure the config.js file with your MySQL settings and server mode options.**

The MySQL database tables are provided in **janusvr.sql**

Running the Server
------------------

1. `cd` to the root of the repository where `server.js` is located.

2. Run the following command to start the server: `node server.js`.

3. Create a shortcut to JanusVR and add the following arguments after the path to the JanusVR executable:
`-server my.server.com -port 5566` where `my.server.com` is the IP address of your computer (`127.0.0.1` or `localhost`
should also work here) and where `5566` is the port that the server is running on as defined in `config.js`. If you are
on OSX and are running the JanusVR client inside a virtual machine (i.e.
[VMware Fusion](http://www.vmware.com/products/fusion)) you will need to use the network IP of your computer to connect
as `localhost` may not work from within the virtual machine.  

Troubleshooting
------------------

* I cannot see other people when using JanusVR and I know others have the same server configured.

Press / once JanusVR has started.  JanusVR will list all the servers you are trying to connect to or ARE connected to.  You should see your server in this list.  If your server is red then it means that JanusVR cannot connect to it.  Check firewall settings on the server to make sure the port 5566 is open and able to receive traffic.  Check the server.log file on the server to see if there are any errors.

* I entered the wrong details in for my key after executing './generate_key'.
 
'./generate_key' will generate 3 files based on your input: *cert/server-key.pem*, *cert/server-cert.pem*, *cert/cabundle.pem*.  Just delete these and execute './generate_key' again.

* I have a general problem and need some troubleshooting info about the server application.

No problem.  check out the server.log file.  Just tail it and you will see the log being written to as activities take place - e.g. logging on etc.

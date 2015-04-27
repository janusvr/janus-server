Janus VR Presence Server
========================


Installation
------------

1. Download and install node from [nodejs.org](http://nodejs.org)

2. `cd` into the root of the repository where `server.js` is located and run `npm install` to install all module
dependencies listed in `package.json`. Note that you may have to run this command with `sudo` depending on your system
configuration.

3. The modules will be placed into the `node_modules` folder and are required for the server to start.

4. Run the following script in the root of the repository: `./generate_key` to generate a SSL certificate for the server.

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

2. Run the following command to start the server: `node server.js`. Note that the server currently does not display a
confirmation that the server has started.

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
 
'./generate_key' will generate 2 files based on your input: *server-key.pem* and *server-cert.pem*.  Just delete these and execute './generate_key' again.

* I have a general problem and need some troubleshooting info about the server application.

No problem.  check out the server.log file.  Just tail it and you will see the log being written to as activities take place - e.g. logging on etc.

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
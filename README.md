Janus VR Presence Server
========================

Installation
------------

1) Download and install node from [nodejs.org](http://nodejs.org)

2) `cd` into the root of the repository where `server.js` is located and nstall the following module dependencies via the
command `sudo npm install MODULE_NAME` where `MODULE_NAME` is the name of the module to install:

    * sudo npm install optimist
    * sudo npm install express
    * sudo npm install simplesets
    * sudo npm install npmlog
    * sudo npm install finished
    * sudo npm install byline

3) The above modules will be placed into the `node_modules` folder and are required for the server to start. Alternately you can run the script `install.sh` to install the above dependencies.

4) Run the following script in the root of the repository: `./generate_key` to generate a SSL certificate for the server.

5) When asked to provide a Common Name for the server enter the domain name the server will be running on. I.e. `yourdomain.com`. If running a development version of the server on OSX you can also use your Bonjour name i.e. `yourcomputer.local`. On OSX you can see your computer's Bonjour name by going to System Preferences -> Sharing and looking under the Computer Name field.

6) When asked to provide a challenge password while generating the SSL certificate press enter to skip setting a password. 
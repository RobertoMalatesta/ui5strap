var nodeHttp = require('http'),
	nodeUrl = require('url'), nodeFs = require('fs'), nodePath = require('path'), nodeMime = require('mime');



/*
 * Server
 */

var errorListener = function(request, response) {
	response.writeHead(404);
	response.end('Not found');
};

var Server = function(pathToConfig){
	this._pathToConfig = pathToConfig;
},
ServerProto = Server.prototype;

ServerProto.start = function(){
	var _this = this;
	
	nodeFs.readFile(this._pathToConfig, 'utf8', function(err, file) {
		if (err) {
			console.error("Could not load server.json!", err);
			return;
		}

		var serverConfig = JSON.parse(file);
		
		_this.config = serverConfig;
		_this._pathToWWW = serverConfig.server.pathToPublic;
		_this._port = serverConfig.server.port;
		
		var apps = serverConfig.apps,
			cnr = apps.length;

		for(var i = 0; i < apps.length; i++){
			var config = nodePath.join(serverConfig.server.pathToPublic,
					apps[i].config);
			nodeFs.readFile(config, 'utf8', function(err, file) {
				if (err) {
					console.error("Could not load app.json!");
					return;
				}
				
				cnr --;
	
				var appConfig = JSON.parse(file);
	
				var controllers = {
					"Feed" : require("../../apps/demoapp/controllers/Feed.controller.js")
				};
	
				var Feed = new controllers.Feed(appConfig);
				Feed._install();
	
				if(cnr === 0){
					_this.startUp();
				}
			});
		}
	});
},

ServerProto.startUp = function(){
	var _this = this;
	// Create a server
	this._nodeHttpServer = nodeHttp.createServer(function handleRequest(request, response) {
		var requestUrl = request.url;

		if (requestUrl === "/") {
			requestUrl = "/index.html";
		}

		var url = nodeUrl.parse(requestUrl, true);

		if (RestController.handleRequest(url, request, response)) {
			return;
		}

		var filename = nodePath.join(_this._pathToWWW, url.pathname);

		nodeFs.readFile(filename, function(err, file) {
			if (err) {
				errorListener(request, response);
				return;
			}
			response.writeHeader(200, {
				"Content-Type" : nodeMime.lookup(filename)
			});
			response.write(file, 'binary');
			response.end();
		});
	});

	// Lets start our server
	this._nodeHttpServer.listen(this._port, function() {
		// Callback triggered when server is successfully listening. Hurray!
		console.log("Server listening on: http://localhost:%s", _this._port);
	});
};


/*
 * Utils
 */

var Utils = function(){
	
};

Utils.hyphenize = function(str){
	return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/*
 * RestController
 */

var RestController = function(){
	this.options = {
			methods : {}
	};
	
};

RestController.controllers = {
		
};

RestController.routing = {
		
};

RestController.handleRequest = function(url, request, response){
	var routing = this.routing[url.pathname];
		
		if(routing){
			response.writeHeader(200, {
				"Content-Type": "application/json"
			});
			
			//TODO beforeRequest handler
			
			response.end(JSON.stringify(routing.controller[routing.method]()));
			
			//TODO afterRequest handler
			
			return true;
		}
	
	
	return false;
};

/**
 * Configure
 */
RestController.prototype._configure = function(){
	
};



RestController.prototype._install = function(){
	this._configure();
	
	var methods = this.options.methods;
	var methodKeys = Object.keys(methods);
	
	for(var i = 0; i < methodKeys.length; i++){
		var methodName = methodKeys[i],
			method = methods[methodName],
			path = this.options.url + "/" + (method.path || Utils.hyphenize(methodName));
		
		RestController.routing[path] = {
				"controller" : this,
				"method" : methodName
		};
	}
	
	this._init();
};

RestController.prototype._init = function(){
};

module.exports = {
	"Server" : Server,
	"RestController" : RestController,
	"Utils" : Utils
};
/*!
 * 
 * UI5Strap
 *
 * ui5strap.App
 * 
 * @author Jan Philipp Knöller <info@pksoftware.de>
 * 
 * Homepage: http://ui5strap.com
 *
 * Copyright (c) 2013 Jan Philipp Knöller <info@pksoftware.de>
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * Released under Apache2 license: http://www.apache.org/licenses/LICENSE-2.0.txt
 * 
 */

sap.ui.define(['./library', 'sap/ui/base/Object', './Action', "./NavContainer"], function(uLib, ObjectBase, Action, NavContainer){
	
	"use strict";
	
	/**
	 * Constructor for a new App instance.
	 * 
	 * @param config {ui5strap.AppConfig} App configuration.
	 * @param viewser {ui5strap.ViewerBase} Viewer instance that loaded this app.
	 * 
	 * @class
	 * Base class for ui5strap Apps.
	 * @extends sap.ui.base.Object
	 * 
	 * @author Jan Philipp Knoeller
	 * @version 0.11.0
	 * 
	 * @constructor
	 * @protected
	 * @alias ui5strap.AppBase
	 * 
	 */
	var AppBase = ObjectBase.extend('ui5strap.AppBase', {
		"constructor" : function(config, viewer){
			sap.ui.base.Object.apply(this);
			
			this.config = config;
			
			//Init local vars
			this._runtimeData = {
				"css" : {},
				"js" : {}
			};
			
			this.components = {};
			
			this._rootComponent = this;
			this._rootControl = null;
			
			this._pageCache = {};
			this._events = {};
			
			this.isAttached = false;
			this.isRunning = false;
			this.isVisible = false;
			this.hasFirstShow = false;
			this.hasFirstShown = false;
			
			this.overlayControl = new NavContainer();
			
			this._initLog(viewer);

			this.sendMessage = function(appMessage){
				appMessage.sender = this.getId();

				viewer.sendMessage(appMessage);
			};
		}
	}),
	AppBaseProto = AppBase.prototype;

	/**
	* Init app specific logging
	* 
	* @param viewer {ui5strap.ViewerBase} The viewer that loaded this app.
	* @protected
	*/
	AppBaseProto._initLog = function(viewer){
		var _this = this;
		this.log = {

			debug : function (message) {
				viewer.log.debug(_this + " " + message, _this.getId());
			},

			warning : function (message) {
				viewer.log.warning(_this + " " + message, _this.getId());
			},

			error : function (message) {
				viewer.log.error(_this + " " + message, _this.getId());
			},

			info : function (message) {
				viewer.log.info(_this + " " + message, _this.getId());
			},

			fatal : function (message) {
				viewer.log.fatal(_this + " " + message, _this.getId());
			}

		};
	};
	
	/**
	 * Helper function to create the app root css class.
	 * 
	 * @param _this {ui5strap.AppBase} Instance of the app to apply this function to.
	 * @param appClasses {string} Existing classes.
	 * @private
	 */
	var _createAppClass = function(_this, appClasses){
		if(_this.config.data.app.styleClass){
			appClasses += " " + _this.config.data.app.styleClass;
		}
		return appClasses;
	};

	/*
	* ----------------------------------------------------------
	* --------------------- Events -----------------------------
	* ----------------------------------------------------------
	*/

	/**
	* Initializes the App. Usually triggered by the viewer.
	*/
	AppBaseProto.init = function(){
		this.onInit(new sap.ui.base.Event("ui5strap.app.init", this, {}));
	};

	/**
	* Preload JavaScript libraries defined in configuration.
	* 
	* @param _this {ui5strap.AppBase} Instance of the app to apply this function to.
	* @param callback {function} The callback function. 
	* @private
	*/
	var _preloadJavaScript = function(_this, callback){
		_this.log.info("AppBase::_preloadJavaScript");
		
		var scripts = _this.config.data.js;
		if(scripts.length === 0){
			callback && callback.call(_this);

			return;
		}

		var files = [];
		for(var i = 0; i < scripts.length; i++){
			var jsPath = _this.config.resolvePath(scripts[i], true);

			var jsKey = 'js---' + _this.getId() + '--' + jsPath;

			if(! ( jsKey in _this._runtimeData.js ) ){	
				_this._runtimeData.js[jsKey] = jsPath;

				files.push(jsPath);
			}
		}

		var scriptBlock = new ui5strap.ScriptBlock();

		scriptBlock.load(files, function(){
			scriptBlock.execute(true);

			callback && callback.call(_this);
		});
	};
	
	/**
	 * Preload models defined in configuration.
	 * 
	 * @param _this {ui5strap.AppBase} Instance of the app to apply this function to.
	 * @param callback {function} The callback function. 
	 * @private
	 */
	var _preloadModels = function(_this, callback){
		jQuery.sap.log.debug("AppBase::_preloadModels");

		//Models
		var models = _this.config.data.models,
			callI = models.length, 
			loaded = {},
			successCallback = function(oEvent, oData){
				callI --;
				
				if(callI >= 0){
					if(oData.oModel !== loaded[oData.modelName]){
						_this.log.debug("Loaded model '" + oData.modelName + "'");
						
						_this.setRootModel(oData.oModel, oData.modelName);
						loaded[oData.modelName] = oData.oModel;
					}
					else{
						jQuery.sap.log.warning("Model already loaded: " + oData.modelName);
					}
				}
				
				if(callI === 0){
					callback && callback();
				}
			},
			errorCallback = function(){
				throw new Error('Cannot load model!');
			};

		if(callI === 0){
			callback && callback();
		}

		for(var i = 0; i < models.length; i++){
			var model = models[i],
				oModel = null,
				modelType = model['type'],
				modelName = model['modelName'],
				modelSrc = _this.config.resolvePath(model, true);

			
			if(modelType === 'RESOURCE'){
				oModel = new sap.ui.model.resource.ResourceModel({
					bundleUrl : modelSrc,
					async : true
				});
				
				oModel.attachRequestCompleted(
					{ 
						modelName: modelName, 
						oModel : oModel
					}, 
					//TODO define somewhere which resource model is default.
					modelName === "i18n" ?
					function(oEvent, oData){
						_this._i18nModel = oData.oModel;
						var bundle = oData.oModel.getResourceBundle();
						bundle.then(function(theBundle){
							_this._i18nBundle = theBundle;
							successCallback(oEvent, oData);
						});
					}
					: successCallback
				);
				oModel.attachRequestFailed(
					{ 
						modelName: modelName, 
						modelSrc : modelSrc
					}, 
					errorCallback
				);
				
				
				/*
				successCallback(null, { 
					modelName: modelName, 
					oModel : oModel
				});
				*/
			}
			else if(modelType === 'JSON'){
				oModel = new sap.ui.model.json.JSONModel();
				oModel.attachRequestCompleted(
					{ 
						modelName: modelName, 
						oModel : oModel
					}, 
					successCallback, 
					oModel
				);
				oModel.attachRequestFailed(
					{
						modelName: modelName,
						modelSrc : modelSrc
					}, 
					errorCallback
				);
				oModel.loadData(modelSrc);
			}
			else{
				throw new Error('Invalid model type!');
			}
		}
	};
	
	/**
	 * Initializes an app component.
	 * 
	 * @param _this {ui5strap.AppBase} Instance of the app to apply this function to.
	 * @param compConfig {object} The component configuration object.
	 * @param oComp {object} The component instance.
	 * @private
	 */
	var _initComponent = function(_this, compConfig, oComp){
		var componentId = compConfig.id,
			compEvents = compConfig.events,
			methodName = 'get' + jQuery.sap.charToUpperCase(componentId);
		
		//Check if magic getter conflicts with existing method
		if(_this[methodName]){
			throw new Error("Name Conflict! Please choose a different ID for component " + componentId);
		}
	
		//Register Component in App
		_this.components[componentId] = oComp;
		
		//Create magic getter
		_this[methodName] = function(){
			return oComp;
		};
	
		//Register Component Events
		if(compEvents){
			//Array of strings of format "scope.event"
			for(var j = 0; j < compEvents.length; j++){
				var stringParts = compEvents[j].split('.');
				if(stringParts.length === 2){
					(function(){
						var eventScope = stringParts[0],
							eventName = stringParts[1],
							eventHandlerName = 'on' + jQuery.sap.charToUpperCase(eventName);
						
						_this.registerEventAction(eventScope, eventName, function on_event(oEvent){
							oComp[eventHandlerName] && oComp[eventHandlerName](oEvent);
						});
					}());
				}
				else{
					throw new Error("Invalid Component event: " + compEvents[j]);
				}
			}
		}
		
		//Init Component
		oComp.init();
	};
	
	/**
	 * Preloads the root component.
	 * 
	 * @param _this {ui5strap.AppBase} Instance of the app to apply this function to.
	 * @param callback {function} The callback function.
	 */
	var _preloadRootComponent = function(_this, callback){
		//TODO this must become standard
		if(_this.config.data.app.rootComponent){
			sap.ui.getCore().createComponent({
				//TODO Does the root component need a stable ID?
				//id : _this.config.getAppDomId("root"),
		        name: _this.config.data.app["package"],
		        async : true,
		        settings: {
		        	app : _this
		        }
		    }).then(function(rootComponent){
		    	_this._rootComponent = rootComponent;
		    	
		    	callback && callback();
		    });
		}
		else{
			callback && callback();
		}
	};
	
	/**
	 * Preloads components defined in configuration.
	 * 
	 * @param _this {ui5strap.AppBase} Instance of the app to apply this function to.
	 * @param callback {function} The callback function. 
	 * @private
	 */
	var _preloadComponents = function(_this, callback){
		jQuery.sap.log.debug("AppBase::_preloadComponents");
		
		//Components
		var components = _this.config.data.components,
			compCount = components.length,
			asyncHelper = compCount,
			then = function(){
				asyncHelper--;
				
				if(asyncHelper === 0){
					//Trigger Callback
					callback && callback();
				}
			};
		
		//Callback immediately if compCount is 0
		!compCount && callback && callback();	
			
		for(var i = 0; i < compCount; i++){
			(function(){
				var compConfig = components[i];
				if(false === compConfig.enabled){
					then();
					return;
				}
				
				if(!compConfig.id || 
					!(compConfig.module 
						|| (compConfig["package"] && compConfig["location"]) 
						|| compConfig["type"]
					)){
					throw new Error("Cannot load component #" + i + ": [module, type, or package & location] or id attribute missing!");
				}
				
				if(compConfig.module){
					//App Component
					//Deprecated soon!
					var moduleName = _this.config.resolvePackage(compConfig.module, "modules");
					
					//TODO Async!
					jQuery.sap.require(moduleName);
					
					var ComponentConstructor = jQuery.sap.getObject(moduleName);
					
					_initComponent(_this, compConfig, new ComponentConstructor(_this, compConfig));
					
					then();
				}
				else if(compConfig["package"]){
					jQuery.sap.registerModulePath(
							compConfig["package"], 
							_this.config.resolvePath(compConfig["location"], true)
					);
					
					var compSettings = { app : _this };
					jQuery.extend(compSettings, compConfig.settings);
					
					//UI5 Component
					sap.ui.getCore().createComponent({
				        name: compConfig["package"],
				        async : true,
				        settings: compSettings
				    }).then(function(oComp){
				    	_initComponent(_this, compConfig, oComp);
						
						then();
				    });
				}
				else if(compConfig["type"]){
					//General Class
					//Use settings as first Parameter
					sap.ui.require([_this.config.resolvePackage(compConfig["type"]).replace(/\./g, "/")], function(ComponentConstructor){
						var compSettings = { app : _this };
						
						jQuery.extend(compSettings, compConfig.settings);
						
						_initComponent(_this, compConfig, new ComponentConstructor(compSettings));
						
						then();
					});
				}
				
			}());
		}

		
	};
	
	/**
	 * Preload actions defined in configuration.
	 * 
	 * @param _this {ui5strap.AppBase} Instance of the app to apply this function to.
	 * @param callback {function} The callback function. 
	 * @private
	 */
	var _preloadActions = function(_this, callback){
		jQuery.sap.log.debug("AppBase::_preloadActions");
		
		var actions = _this.config.data.actions,
			callI = actions.length;
		
		if(callI === 0){
			callback && callback.call(_this);

			return;
		}
		
		var successCallback = function(data){
			callI--;
			if(callI === 0){
				callback && callback.call(_this);
			}
		};
		
		for(var i = 0; i < actions.length; i++){
			Action.loadFromFile(_this.config.resolvePackage(actions[i], "actions"), successCallback, true);
		}
	};
	
	/**
	 * Sets the UI5 language.
	 * 
	 * @param language {string} The language to set.
	 * TODO Since you cannot set the language per app, this function should be moved to the viewer.
	 */
	AppBaseProto.setLanguage = function(language){
		sap.ui.getCore().getConfiguration().setLanguage(language);
	};
	
	/**
	 * Preloads the models and resources needed by this app.
	 * 
	 * @param callback {function} The callback function.
	 */
	AppBaseProto.preload = function(callback){
		jQuery.sap.log.debug("AppBaseProto.preload");
		
		this.config.resolve();

		var _this = this;
		
		_preloadJavaScript(_this, function preloadJavaScriptComplete(){
			_preloadRootComponent(_this, function _preloadRootCompComplete(){
				_preloadComponents(_this, function _preloadComponentsComplete(){
					_this.createRootControl(function(){
						
					_preloadModels(_this, function _preloadModelsComplete(){
						_preloadActions(_this, callback);
					});
					
					});
				});
			});
		});
	};

	/**
	 * Loads the neccessary data for this app. Typically triggered by the viewer.
	 * 
	 * @param callback {function} The callback function.
	 */
	AppBaseProto.load = function(callback){
		jQuery.sap.log.debug("AppBaseProto.load");

		var _this = this;
		this.preload(function(){

			_this.onLoad(new sap.ui.base.Event("ui5strap.app.load", _this, {}));

			callback && callback();
		
		});
	};

	/**
	* Starts the app. Typically triggered by the viewer.
	* 
	* @param callback {function} The callback function.
	*/
	AppBaseProto.start = function(callback){
		jQuery.sap.log.debug("AppBaseProto.start");

		var _this = this;
		if(this.isRunning){
			throw new Error(this + " is already running.");
		}
		
		this.isRunning = true;

		window.addEventListener(
			"message", 
			function on_message(event){
				_this.onMessage(new sap.ui.base.Event("ui5strap.app.message", _this, event.data));
			}, 
			false
		);

		this.onStart(new sap.ui.base.Event("ui5strap.app.start", _this, {}));

		callback && callback();
	};

	/**
	* Marks the app as showing. Typically triggered by the viewer.
	* 
	* @param callback {function} The callback function.
	*/
	AppBaseProto.show = function(callback){
		jQuery.sap.log.debug("AppBaseProto.show");

		this.isVisible = true;
		this.onShow(new sap.ui.base.Event("ui5strap.app.show", this, {}));

		var isFirstTimeShow = !this.hasFirstShow;
		if(isFirstTimeShow){
			this.log.debug('FIRST SHOW');
		
			this.hasFirstShow = true;
			this.onFirstShow(new sap.ui.base.Event("ui5strap.app.firstShow", this, {}));
		}

		callback && callback(isFirstTimeShow);
	};

	/**
	* Marks the app as shown. Typically triggered by the viewer.
	* 
	* @param callback {function} The callback function.
	*/
	AppBaseProto.shown = function(callback){
		jQuery.sap.log.debug("AppBaseProto.shown");

		var _this = this;

		ui5strap.polyfill.requestAnimationFrame(function(){
			_this.domRef.className = _createAppClass(_this, 'ui5strap-app ui5strap-app-current');
			
			_this.onShown(new sap.ui.base.Event("ui5strap.app.shown", _this, {}));

			var isFirstTimeShown = !_this.hasFirstShown;
			if(isFirstTimeShown){
				_this.log.debug('FIRST SHOWN');
				_this.hasFirstShown = true;
				_this.onFirstShown(new sap.ui.base.Event("ui5strap.app.firstShown", _this, {}));
			}

			callback && callback(isFirstTimeShown);
		});
	};
	
	/**
	* Marks the app as hiding. Typically triggered by the viewer.
	* 
	* @param callback {function} The callback function.
	*/
	AppBaseProto.hide = function(callback){
		jQuery.sap.log.debug("AppBaseProto.hide");
		
		this.isVisible = false;
		
		this.onHide(new sap.ui.base.Event("ui5strap.app.hide", this, {}));

		callback && callback();
	};
	
	/**
	* Marks the app as hidden. Typically triggered by the viewer.
	* 
	* @param callback {function} The callback function.
	*/
	AppBaseProto.hidden = function(callback){
		jQuery.sap.log.debug("AppBaseProto.hidden");

		var _this = this;
		ui5strap.polyfill.requestAnimationFrame(function(){
			if(null === _this.domRef){
				jQuery.sap.log.warning("AppBaseProto.stop seemed to be executed before AppBaseProto.hidden. This seems to be a bug.");
			}
			else{
				_this.domRef.className = _createAppClass(_this, 'ui5strap-app ui5strap-app-inactive ui5strap-hidden');
			}	
			
			_this.onHidden(new sap.ui.base.Event("ui5strap.app.hidden", _this, {}));

			callback && ui5strap.polyfill.requestAnimationFrame(callback);
		})
	};

	/**
	* Marks the app as stopped. Typically triggered by the viewer.
	* 
	* @param callback {function} The callback function.
	*/
	AppBaseProto.stop = function(callback){
		jQuery.sap.log.debug("AppBaseProto.stop");

		if(!this.isRunning){
			throw new Error(this + " is not running.");
		}

		this.$().remove();
		this.domRef = null;
		this.isRunning = false;

		this.onStop(new sap.ui.base.Event("ui5strap.app.stop", this, {}));

		callback && callback();
	};

	/**
	* Marks the app as unloaded. Typically triggered by the viewer.
	* 
	* @param callback {function} The callback function.
	*/
	AppBaseProto.unload = function(callback){
		jQuery.sap.log.debug("AppBaseProto.unload");
		
		ui5strap.Layer.unregister(this.overlayId);
		ui5strap.Layer.unregister(this.config.createDomId('loader'));

		this.onUnload(new sap.ui.base.Event("ui5strap.app.unload", this, {}));

		this.destroy();

		callback && callback();
	};

	/**
	* Triggered when a message is sent to this app.
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onMessage = function(oEvent){
		//Fire the message event
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "message",
			"orgEvent" : oEvent
		});
	};
	
	/**
	* Triggered when the window is resized
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onResize = function(oEvent){
		//Fire the resize event
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "resize",
			"orgEvent" : oEvent
		});
	};
	
	/**
	* Triggered when the window is resized
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onHashChange = function(oEvent){
		//Fire the resize event
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "hashChange",
			"orgEvent" : oEvent
		});
	};

	/**
	* Triggered when the app has been initialized
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onInit = function(oEvent){
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "init",
			"orgEvent" : oEvent
		});
	};

	/**
	* Triggered when the app has been (pre-)loaded
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onLoad = function(oEvent){
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "load",
			"orgEvent" : oEvent
		});
	};

	/**
	* Triggered when the app has been unloaded
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onUnload = function(oEvent){
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "unload",
			"orgEvent" : oEvent
		});
	};

	/**
	* Triggered when the app has been started
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onStart = function(oEvent){
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "start",
			"orgEvent" : oEvent
		});
	};

	/**
	* Triggered when the app has been stopped
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onStop = function(oEvent){
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "stop",
			"orgEvent" : oEvent
		});
	};

	/**
	* Triggered when the app is going to show
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onShow = function(oEvent){
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "show",
			"orgEvent" : oEvent
		});
	};

	/**
	* Triggered when the app has been shown
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onShown = function(oEvent){
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "shown",
			"orgEvent" : oEvent
		});
	};

	/**
	* Triggered when the app is going to show for the first time
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onFirstShow = function(oEvent){
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "firstShow",
			"orgEvent" : oEvent
		});
	};

	/**
	* Triggered when the app has been shown for the first time
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onFirstShown = function(oEvent){
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "firstShown",
			"orgEvent" : oEvent
		});
	};

	/**
	* Triggered when the app is going to hide
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onHide = function(oEvent){
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "hide",
			"orgEvent" : oEvent
		});
	};

	/**
	* Triggered when the app has been hidden
	* 
	* @param oEvent {sap.ui.base.Event} The event object.
	*/
	AppBaseProto.onHidden = function(oEvent){
		this.fireEventAction({ 
			"scope" : "app",
			"eventName" : "hidden",
			"orgEvent" : oEvent
		});
	};

	/**
	* Run an action that is assiged to a certain event
	* 
	* @param eventParameters {object} Information about the event.
	* @param actionGroupId {string|object} The action name or action definition.
	*/
	AppBaseProto.runEventAction = function (eventParameters, actionGroupId, callback){
		this.log.debug("Executing event '" + eventParameters.scope + '/' + eventParameters.eventName + "' ...");
		var actionParameters = {
			"parameters" : actionGroupId,
			callback : callback
		};

		//OpenUI5 Controller
		if("controller" in eventParameters){
			actionParameters.controller = eventParameters.controller;
		}

		//Original Event
		if("orgEvent" in eventParameters){
			actionParameters.eventSource = eventParameters.orgEvent.getSource();
			actionParameters.eventParameters = eventParameters.orgEvent.getParameters();
			
		}

		this.runAction(actionParameters);
	};

	/**
	* Fires an app event. 
	* The event is either defined in the configuration, or attached to the app instance programatically.
	* 
	* @param eventParameters {object} Information about the event.
	*/
	AppBaseProto.fireEventAction = function(eventParameters){
		var _this = this;
		
		if(this.config.data.events){
			var appEvents = this.config.data.events;
			
			//Run the events that are defined in the config
			if(eventParameters.scope in appEvents){
				var events = appEvents[eventParameters.scope];

				if(eventParameters.eventName in events){
					var eventList = events[eventParameters.eventName],
						nextAction = function(j){
							if(j >= eventList.length){
								return;
							}
							
							_this.runEventAction(
								eventParameters, 
								eventList[j], 
								function(){
									nextAction(j+1);
								}
							);
						};
					
					nextAction(0);
				}

			}
		}

		//Runtime events
		if(this._events && this._events[eventParameters.scope]){
			var events = this._events[eventParameters.scope];
			if(eventParameters.eventName in events){
				var eventList = events[eventParameters.eventName],
					nextAction = function(j){
						if(j >= eventList.length){
							return;
						}
						
						var actionOrFunction = eventList[j];
						if(typeof actionOrFunction === 'function'){
							//Call the registered function with original event as parameter
							_this.log.debug("Executing event function '" + eventParameters.scope + '/' + eventParameters.eventName + "' ...");
							actionOrFunction.call(this, eventParameters.orgEvent);
							
							nextAction(j+1);
						}
						else{
							//chain via callback
							_this.runEventAction(
									eventParameters, 
									actionOrFunction,
									function(){
										nextAction(j+1);
									});
						}
					};
					
				nextAction(0);

			}
		}
	};

	/**
	* Registers an event action to this app instance
	* 
	* @param scope {string} The event scope.
	* @param eventName {string} The event name.
	* @param actionOrFunction {string|function} Either an action name or a callback function.
	*/ 
	AppBaseProto.registerEventAction = function(scope, eventName, actionOrFunction){
		if(!(scope in this._events)){
			this._events[scope] = {};
		}

		if(!(eventName in this._events[scope])){
			this._events[scope][eventName] = [];
		}
		
		this.log.debug("Registered event '" + eventName + "' for scope '" + scope + "'");
		this._events[scope][eventName].push(actionOrFunction);
	};

	/*
	* ----------------------------------------------------------------------
	* --------------------- App Overlay ------------------------------------
	* ----------------------------------------------------------------------
	*/
	
	/**
	* Shows or hides the loading screen.
	* 
	* @param visible {boolean} Whether the loading screen is visible.
	* @param callback {function} The callback function.
	*/
	AppBaseProto.setLoaderVisible = function(visible, callback){
		//ui5strap.Layer.setVisible('ui5strap-loader', visible, callback, option);
		ui5strap.Layer.setVisible(this.config.createDomId('loader'), visible, callback);
	};

	/**
	* Registers the overlay.
	*/
	AppBaseProto.registerOverlay = function(){
		var _this = this,
			overlayId = this.config.createDomId('overlay'),
			Layer = uLib.Layer;
		
		this.overlayId = overlayId;

		if(Layer.get(overlayId)){
			this._log.warning("Layer already registered: " + overlayId);
			return;
		}

		Layer.register(this.overlayId);

		//TODO
		//Check Model Propagation
		/*
		var oModels = this.getRootControl().oModels;
		for(var sName in oModels){
			overlayControl.setModel(oModels[sName], sName);
		};
		*/
		
		this.overlayControl.placeAt(overlayId + '-content');
		
		//jQuery('#' + this.overlayId + '-backdrop').on('tap', function onTap(event){
		//	_this.hideOverlay();
		//});
	};

	/**
	* Returns whether the overlay layer is visible
	* 
	* @returns {boolean} Whether the overlay is visible.
	*/
	AppBaseProto.isOverlayVisible = function(){
		return ui5strap.Layer.isVisible(this.overlayId);
	};

	/**
	* Shows a view or control inside the overlay.
	* 
	* @param viewDataOrControl {object|sap.ui.core.Control} Either a view definition or a control reference.
	* @param callback {function} The callback function.
	* @param transitionName {string} The transition name.
	*/
	AppBaseProto.showOverlay = function(viewDataOrControl, callback, transitionName){
		var _this = this;
		if(!(viewDataOrControl instanceof ui5strap.Control)){
			var viewParameters = viewDataOrControl.parameters;
			
			viewDataOrControl = this.createView(this.config.getViewConfig(viewDataOrControl));
		
			viewDataOrControl.loaded().then(function(){
				_this._showOverlay(viewDataOrControl, callback, transitionName, viewParameters);
			});
		}
		else{
			this._showOverlay(viewDataOrControl, callback, transitionName);
		}
	};
	
	/**
	 * Shows a control inside the overlay.
	 * 
	 * @param oPage {sap.ui.core.Control} The control to show.
	 * @param callback {function} The callback function.
	 * @param transitionName {string} The name of the transition.
	 * @param pageUpdateParameters {object} The parameters to pass to the pageUpdate event.
	 * @protected
	 */
	AppBaseProto._showOverlay = function(oPage, callback, transitionName, pageUpdateParameters){
		var navControl = this.overlayControl,
			target = navControl.defaultTarget;
		
		//Set target busy
		navControl.setTargetBusy(target, true);
		
		//Trigger onUpdate events
		navControl.updateTarget(target, oPage, pageUpdateParameters);
		
		ui5strap.Layer.setVisible(this.overlayId, true, function(){
			navControl.toPage(oPage, target, transitionName || "slide-ttb", function toPage_complete(){
				
				//Set target available
				navControl.setTargetBusy(target, false);
				
				//Trigger callback
				callback && callback();
			});
		});
	};

	/**
	* Hides the overlay.
	* 
	* @param callback {function} The callback function.
	* @param transitionName {string} The name of the transition.
	*/
	AppBaseProto.hideOverlay = function(callback, transitionName){
		if(!this.isOverlayVisible()){
			throw new Error('Overlay is not visible!');
		}

		var _this = this,
			overlayControl = this.overlayControl,
			transitionName = transitionName || 'slide-btt';
		
		overlayControl.toPage(null, 'content', transitionName, function toPage_complete(){
			ui5strap.Layer.setVisible(_this.overlayId, false, callback);
		});	
	};

	/*
	* ----------------------------------------------------------
	* --------------------- Views ------------------------------
	* ----------------------------------------------------------
	*/

	/**
	 * Create a new View based on configuration object.
	 * 
	 * @param viewDef {object} The view definition.
	 * @returns {sap.ui.core.mvc.View} The view reference.
	 */
	AppBaseProto.createView = function(viewDef){
		var _this = this,
			pageId = viewDef.id;

		//If id specified check for cache
		//Also create a new valid control id for the view
		if(pageId){
			var cachedPage = this._pageCache[pageId];
			if(viewDef.cache){
				if(cachedPage){
					_this.log.debug("Returning cached page '" + page + "'.");
					
					return cachedPage;
				}
			}
			else{
				//View is NOT cached
				if(cachedPage){
					//View already have been created before
					//Delete cache entry and destroy existing view
					delete this._pageCache[pageId];
					cachedPage.destroy();
				}
			}
		}
		
		var viewConfig = {
			async : true
		};
		jQuery.extend(viewConfig, viewDef);
		
		if(pageId){
			viewConfig.id = this.config.createControlId(pageId);
		}
		
		var viewSettings = {};
		jQuery.extend(viewSettings, viewConfig);

		//START Build ViewData
		//The View Data holds the app reference.
		//TODO This is bad practice. Once Root Component is mandatory, this will be replaced.
		if(!viewConfig.viewData){
			viewConfig.viewData = {};
		}

		if(!viewConfig.viewData.__ui5strap){
			viewConfig.viewData.__ui5strap = {};
		}

		viewConfig.viewData.__ui5strap.app = this;
		viewConfig.viewData.__ui5strap.settings = viewSettings;
		
		//END Build ViewData
		
		//Create View
		//Will crash if "viewName" or "type" attribute is missing!
		var page = new sap.ui.view(viewConfig);
		
		/*
		page.attachAfterInit(null, function(){
			jQuery.sap.log.info("Created page has been initialized.");
		});
		*/
		
		//Add css style class
		if(viewConfig.styleClass){
			page.addStyleClass(viewConfig.styleClass);
		}
		
		if(pageId){
			//Add to page cache
			this._pageCache[pageId] = page;
		}

		return page;
	};

	/*
	* --------------------------------------------------
	* --------------------- ACTIONS --------------------
	* --------------------------------------------------
	*/

	/**
	* Execute an Action.
	* 
	* @param action {object} The action definition.
	*/
	AppBaseProto.runAction = function(action){
		action.app = this;
		
		var actionName = action.parameters;
		if(typeof actionName === 'string'){
			actionName = this.config.resolvePackage(actionName, "actions");
			action.parameters = actionName;
		}
		Action.run(action);
	};

	/*
	* --------------------------------------------------
	* --------------------- STORAGE --------------------
	* --------------------------------------------------
	*/
	
	/**
	 * Sets a local storage item.
	 * 
	 * @param storageKey {string} The key.
	 * @param storageValue {object} The value as object.
	 * @deprecated
	 * TODO move to component
	 */
	AppBaseProto.setLocalStorageItem = function(storageKey, storageValue){
		if(typeof(Storage) === "undefined"){
			throw new Error('Storage is not supported by this device / browser.');
		}
		
		localStorage[this.getId() + '.localStorage.' + storageKey] = JSON.stringify(storageValue);
	};
	
	/**
	 * Gets a local storage item.
	 * 
	 * @param storageKey {string} The key.
	 * @returns {object} The value.
	 * @deprecated
	 * TODO move to component
	 */
	AppBaseProto.getLocalStorageItem = function(storageKey){
		if(typeof(Storage) === "undefined"){
			throw new Error('Storage is not supported by this device / browser.');
		}
		
		var storageId = this.getId() + '.localStorage.' + storageKey;
		
		return localStorage[storageId] ? JSON.parse(localStorage[storageId]) : null;
	};
	
	/**
	 * Sets a session storage item.
	 * 
	 * @param storageKey {string} The key.
	 * @param storageValue {object} The value.
	 * @deprecated
	 * TODO move to component
	 */
	AppBaseProto.setSessionStorageItem = function(storageKey, storageValue){
		if(typeof(Storage) === "undefined"){
			throw new Error('Storage is not supported by this device / browser.');
		}
		
		sessionStorage[this.getId() + '.sessionStorage.' + storageKey] = JSON.stringify(storageValue);
	};
	
	/**
	 * Gets a session storage item.
	 * 
	 * @param storageKey {string} The key.
	 * @returns {object} The value.
	 * @deprecated
	 * TODO move to component
	 */
	AppBaseProto.getSessionStorageItem = function(storageKey){
		if(typeof(Storage) === "undefined"){
			throw new Error('Storage is not supported by this device / browser.');
		}
		
		var storageId = this.getId() + '.sessionStorage.' + storageKey;
		
		return sessionStorage[storageId] ? JSON.parse(sessionStorage[storageId]) : null;
	};

	/*
	* --------------------------------------------------
	* --------------------- MODELS ---------------------
	* --------------------------------------------------
	*/

	/**
	 * Gets a locale string from the i18n files in the current language.
	 * The first argument is the key, any additional arguments are passed for replace variables within the string.
	 * TODO "i18n" should be configurable.
	 */
	AppBaseProto.getLocaleString = function(){
		var bundle = this._i18nBundle;
		return bundle.getText.apply(bundle, arguments);
	};

	/**
	* Returns a property of a model that is assigned to the root control.
	* 
	* @param dataPath {string} The data path.
	* @param modelName {string} The name of the model.
	* @returns {mixed} The property value.
	* FIXME
	*/
	AppBaseProto.getModelProperty = function(dataPath, modelName){
		var ressourceModel = this.getRootControl().getModel(modelName);
		if(!ressourceModel){
			return "MISSING: " + dataPath;
			//throw new Error('Invalid model name: "' + modelName + '"');
		}
		return ressourceModel.getProperty(dataPath);
	};

	/*
	* --------------------------------------------------
	* --------------------- Controls -------------------
	* --------------------------------------------------
	*/

	/**
	* Create an control id with app namespace. If viewId is given, the controlId must be local.
	* 
	* @param controlId {string} The ID of the control.
	* @param viewId {string} The ID of the view that contains the control.
	* @returns {string} The final control id.
	* @deprecated Use ui5strap.AppConfig.createControlId instead.
	*/ 
	AppBaseProto.createControlId = function(controlId, viewId){
		jQuery.sap.log.warning("ui5strap.AppBase.prototype.createControlId is deprecated! Use ui5strap.AppConfig.prototype.createControlId instead!");
		return this.config.createControlId(controlId, viewId);
	
	};
	
	/**
	 * Extracts the ID part of a Control ID without the app namespace.
	 * 
	 * @param controlId {string} The control ID.
	 * @param viewId {string} The view ID that contains the control.
	 * @returns {string} The relative control id.
	 */
	AppBaseProto.extractRelativeControlId = function(controlId, viewId){
		var prefix = this.config.getDomId() + '---';
		
		if(viewId){
			if(jQuery.sap.startsWith(controlId, prefix)){
				//View ID is given, but control ID is already absolute.
				throw new Error("Cannot extract relative control id: controlId is absolute but viewId is given!");
			}
			
			if(jQuery.sap.startsWith(viewId, prefix)){
				//View ID is absolute (has an app prefix)
				prefix = viewId;
			}
			else{	
				//View ID is relative
				prefix += viewId + "--";
			}
		}
		else if(!jQuery.sap.startsWith(controlId, prefix)){
			//View ID is given, but control ID is already absolute.
			throw new Error("Cannot extract relative control id: controlId is not absolute!");
		}
		
		return controlId.substring(prefix.length);
	};

	/**
	* Returns the Control with the given controlId. Depending if a viewId is specified, the controlId must be global or local.
	* 
	* @param controlId {string} The ID of the control.
	* @param viewId {string} The ID of the View.
	* @returns {sap.ui.core.Control} The control reference.
	*/
	AppBaseProto.getControl = function(controlId, viewId){
		return sap.ui.getCore().byId(this.config.createControlId(controlId, viewId));
	};

	/**
	 * Returns the Root Component.
	 * 
	 * @returns {object} The root component.
	 */
	AppBaseProto.getRootComponent = function(){
		return this._rootComponent;
	};
	
	/**
	 * Sets the Root Component.
	 * 
	 * @param rootComponent {object} The root component to set.
	 */
	AppBaseProto.setRootComponent = function(rootComponent){
		this._rootComponent = rootComponent;
	};
	
	/**
	 * Creates the Root Control asynchronously.
	 * 
	 * @param callback {function} The callback function.
	 */
	AppBaseProto.createRootControl = function(callback){
		if(this._rootControl){
			callback && callback();
			
			return;
		}
		
		var rootComponent = this._rootComponent,
			_this = this;
		
		//TODO Instead of just checking the existance of the methods,
		//it would be better to check whether the class implements the interface ui5strap.IRootComponent
		if(rootComponent._buildRootControl){
			this._rootControl = rootComponent._buildRootControl();
			callback && callback();
		}
		else if(rootComponent._createRootControl){
			rootComponent._createRootControl(function(rootControl){
				_this._rootControl = rootControl;
				
				callback && callback();
			});
		}
		else{
			//Load plain ui5 app in a Component Container
			sap.ui.require(["sap/ui/core/ComponentContainer", "sap/ui/core/UIComponent"], function(ComponentContainer, UIComponent){
				if(!rootComponent instanceof UIComponent){
					throw new Error("Could not create root control!");
				}
				
				_this._rootControl = new ComponentContainer({
	            	  component : rootComponent,
	            	  height : "100%"
		        });
				
				callback && callback();
			});
	  	}
		
	};
	
	/**
	 * Returns the Root Control.
	 * 
	 * @returns {sap.ui.core.Control} The root control.
	 */
	AppBaseProto.getRootControl = function(){
		return this._rootControl;
	};
	
	/**
	 * 
	 */
	AppBaseProto.setRootModel = function(oModel, modelName){
		this.getRootControl().setModel(oModel, modelName);
		this.overlayControl.setModel(oModel, modelName);
	};

	/*
	* --------------------------------------------------
	* --------------------- Object ---------------------
	* --------------------------------------------------
	*/
	
	/**
	 * Whether this app has a certain nature.
	 * TODO move to app config
	 * 
	 * @param nature {string} The ID of the nature.
	 * @returns {boolean} Whether the app has the nature.
	 */
	AppBaseProto.hasNature = function(nature){
		return -1 !== jQuery.inArray(nature, this.config.data.app.nature);
	};

	/**
	* Returns the ID of the App. The ID is in Java format and contains dots.
	* @deprecated
	* 
	* @returns {string} The app ID.
	*/
	AppBaseProto.getId = function(){
		return this.config.data.app.id;
	};
	
	/**
	 * Returns the JQuery reference to the app root element.
	 * 
	 * @returns {jQuery} The jQuery reference to the app's root element.
	 * @deprecated Will be removed!
	 */
	AppBaseProto.$ = function(){
		return jQuery(this.domRef);
	};

	/**
	* Get the URL of the app defined in the config
	* @deprecated
	* TODO delete
	*/
	AppBaseProto.getUrl = function(){
		return this.config.data.app.url;
	};

	/**
	* Returns the Dom ID of the App.
	* 
	* @deprecated
	* @param subElement {string} Name of the sub element.
	* @returns {string} The dom ID.
	*/
	AppBaseProto.getDomId = function(subElement){
		jQuery.sap.log.warning("ui5strap.App.prototype.getDomId is deprecated! Use ui5strap.AppConfig.prototype.getAppDomId instead!");
		return this.config.createDomId(subElement);
	};

	/**
	 * Updates the app container.
	 */
	AppBaseProto.updateContainer = function(){
		if(this.domRef){
			this.domRef.className = _createAppClass(this, 'ui5strap-app ui5strap-app-next ui5strap-hidden');
			return;
		}
		
		var _this = this,
			appContainer = document.createElement('div'),
			appContent = document.createElement('div'),
			appOverlay = document.createElement('div'),
			appOverlayContent = document.createElement('div'),
			appLoader = document.createElement('div'),
			appSplash = document.createElement('div');
			
			
		//App Container
		appContainer.className = _createAppClass(this, 'ui5strap-app ui5strap-app-prepared ui5strap-hidden');
		appContainer.id = this.config.getDomId();
		
		//App Content
		appContent.className = 'ui5strap-app-content';
		appContent.id = this.config.createDomId('content');
		appContainer.appendChild(appContent);

		//App Overlay
		appOverlay.className = 'ui5strap-app-overlay ui5strap-overlay ui5strap-layer ui5strap-hidden';
		appOverlay.id = this.config.createDomId('overlay');

		//var appOverlayBackdrop = document.createElement('div');
		//appOverlayBackdrop.className = 'ui5strap-overlay-backdrop';
		//appOverlayBackdrop.id = this.config.createDomId('overlay-backdrop');
		/*
		appOverlayBackdrop.onclick = function(){
			_this.hideOverlay();
		};
		*/
		//appOverlay.appendChild(appOverlayBackdrop);

		appOverlayContent.className = 'ui5strap-overlay-content';
		appOverlayContent.id = this.config.createDomId('overlay-content');
		appOverlay.appendChild(appOverlayContent);

		appContainer.appendChild(appOverlay);

		//App Loader
		
		appLoader.className = 'ui5strap-app-loader ui5strap-loader ui5strap-layer ui5strap-hidden';
		appLoader.id = this.config.createDomId('loader');
		appContainer.appendChild(appLoader);

		ui5strap.Layer.register(appLoader.id, jQuery(appLoader));

		//App Splash
		/*
		appSplash.className = 'ui5strap-app-splash ui5strap-layer ui5strap-hidden';
		appSplash.id = this.config.createDomId('splash');
		appContainer.appendChild(appSplash);
		*/

		//Cache DOM Ref
		this.domRef = appContainer;
		this.contentDomRef = appContent;
	};
	
	/**
	 * Appends the App to the DOM
	 * 
	 * @param containerEl {HTMLElement} The container dom element.
	 */
	AppBaseProto.attach = function(containerEl){
		if(!this.isAttached){
			jQuery.sap.log.debug("Attaching app '" + this.getId() + "' to DOM...");
			this.isAttached = true;
			containerEl.appendChild(this.domRef);
			
			//TODO
			this.registerOverlay();
			
			//Place the Root Control
			this.getRootControl().placeAt(this.contentDomRef);
		}
	};

	/**
	 * Returns the string representation of this app.
	* @override
	*/
	AppBaseProto.toString = function(){
		return '[' + this.getId() + ']';
	};

	/**
	* Destroys the App and all of its components
	* @override
	*/
	AppBaseProto.destroy = function(){
		this.log.debug("Destroying app...");
		
		var cacheKeys = Object.keys(this._pageCache);
		
		for(var i = 0; i < cacheKeys.length; i++){
			this.log.debug("Destroying view: " + cacheKeys[i]);
			this._pageCache[cacheKeys[i]].destroy(true);
			delete this._pageCache[cacheKeys[i]];
		}
		
		//Destroy the root control first
		var rootControl = this.getRootControl();
		if(rootControl){
			rootControl.destroy(true);
		}
		
		//Finally, destroy the app object
		sap.ui.base.Object.prototype.destroy.call(this);
	};
	
	/*
	* -------------------------------------------------
	* --------------------- STYLE ---------------------
	* -------------------------------------------------
	*/

	/**
	* Include the style that is neccessary for this app
	*
	* @param callback {function} The callback function.
	*/
	AppBaseProto.includeStyle = function(callback){
		var _this = this,
			configData = this.config.data,
			cssKeys = Object.keys(configData.css),
			callbackCount = cssKeys.length;

		var themeName = this.config.data.app.theme;
		if(themeName){ 
			this.setTheme(themeName);
		}
		
		if(callbackCount === 0){
			callback && callback.call(this);

			return;
		}

		var callbackI = 0,
			success = function(){
				callbackI++;
				if(callbackI === callbackCount){
					callback && callback.call(_this);
				}
			},
			error = function(e){
				alert('Could not load style!');
				throw e;
			};

		for(var i = 0; i < callbackCount; i++){
			var cssKey = cssKeys[i],
				cssPath = this.config.resolvePath(configData.css[cssKey], true);

			cssKey = 'css--' + this.getId() + '--' + cssKey;

			if(! ( cssKey in this._runtimeData.css ) ){	
				this.log.debug('LOADING CSS "' + cssPath + '"');
					
				this._runtimeData.css[cssKey] = cssPath;
				
				jQuery.sap.includeStyleSheet(
						cssPath, 
						cssKey, 
						success, 
						error
				);
			}
			
			else{
				this.log.debug("Css stylesheet '" + cssPath + "' already included.");
				success();
			}
		}
	};

	/**
	 * Removes the stylesheets added by this app.
	 */
	AppBaseProto.removeStyle = function(){
		for(var cssKey in this._runtimeData.css){
			jQuery('link#' + cssKey).remove();
			delete this._runtimeData.css[cssKey];
			this.log.info("Css stylesheet '" + cssKey + "' removed.");
		}
	};

	/**
	* Sets the theme of the app
	* @param themeName {string} The name of the new theme.
	*/
	AppBaseProto.setTheme = function(themeName){
		if(!themeName || "base" === themeName){
			sap.ui.getCore().applyTheme("base");
			return;
		}

		if(jQuery.sap.startsWith(themeName, "sap_")){
			sap.ui.getCore().applyTheme(themeName);
			return;
		}
		//sap.ui.getCore().setThemeRoot(themeName, );
		sap.ui.getCore().applyTheme(themeName, this.config.getEnvironment().pathToThemeRoot);

		this.log.debug("Theme '" + themeName + "' set.");
	};

	
	/*
	* --------------------------------------------------
	* --------------------- Controller -----------------
	* --------------------------------------------------
	*/

	/**
	 * Creates an action event handler for the given event.
	 * 
	 * @param controllerImpl {object} The controller implementation.
	 * @param eventName {string} The event name.
	 * 
	 * @private
	 * @static
	 */
	var _createActionEventHandler = function(controllerImpl, eventName){
		var eventFunctionName = 'on' + jQuery.sap.charToUpperCase(eventName, 0),
			oldOnPageShow = controllerImpl[eventFunctionName];

		controllerImpl[eventFunctionName] = function(oEvent){ 
			var app = this.getApp(),
						_this = this;
				
			if(app){
				var view = this.getView(),
					viewId = view.getId(),
					updateEvents = app.config.getEvents('controller', eventName, viewId),
					updateEventsLength = updateEvents.length;
				
				//TODO chain actions via callback
				
				var nextAction = function(j){
					if(j >= updateEventsLength){
						return;
					}
					
					var actionName = updateEvents[j];
					app.log.debug("Executing action '" + actionName + "' (view: '" + viewId + "', event: '" + eventName + "') ...");
					app.runAction({
						"parameters" : actionName, 
						"controller" : _this,
						"eventSource" : oEvent.getSource(),
						"eventParameters" : oEvent.getParameters(),
						callback : function(){
							nextAction(j+1);
						}
					});
				};
				
				nextAction(0);
			}
			
			//TODO this should be called before the actions?
			if(oldOnPageShow){
				oldOnPageShow.call(this, oEvent);
			}
		};
	};

	/**
	 * Adds action functionality to the controller.
	 * 
	* @param controllerImpl {object} The controller implementation.
	* @static
	*/
	AppBase.blessController = function(controllerImpl){
		
		if(!controllerImpl.actionEventHandler){
			controllerImpl.actionEventHandler = "__execute";
		}
		if(!controllerImpl.actionAttribute){
			controllerImpl.actionAttribute = "__action";
		}
		
		//Add getApp method if not already exists
		if(!controllerImpl.getApp){
			/*
			 * FIXME: Getting the app reference via view data is bad practice. Instead get it via the root component if available.
			 */
			
	          controllerImpl.getApp = function(){
	              var viewData = this.getView().getViewData();
	            
	              if(!viewData || !viewData.__ui5strap || !viewData.__ui5strap.app){
	                  return null;
	              }
	              
	              return viewData.__ui5strap.app;
	          }
      	}
		
		/*
		 * All available formatters
		 */
		if(!controllerImpl.formatters){
			controllerImpl.formatters = {};
		}
		
		/**
		 * Formatter that resolves a i18n string.
		 * @Public
		 */
		controllerImpl.formatters.localeString = function(localeString){
			//FIXME
			//If the language is changed dynamically, the methods still returns the value for previous language.
			//It seems to be a bug in OpenUI5
			//console.log(sap.ui.getCore().getConfiguration().getLanguage());
			return this.getApp().getLocaleString(localeString);
			//return this.getApp().getModelProperty(localeString, 'i18n');
		};
		
		controllerImpl.formatters.resolvePackage = function(packageName){
			if(!packageName){
				return packageName;
			}
			return this.getApp().config.resolvePackage(packageName);
		};
		
		/**
		 * Extracts the action names for the given event.
		 * @Private
		 * @Static
		 */
		var _getActionFromEvent = function(oEvent, customDataKey){
			var actionName = oEvent.getSource().data(customDataKey),
				actionNamesList = ui5strap.Utils.parseIContent(actionName);
			
			if(actionNamesList && typeof actionNamesList === 'object'){
				var eventId = oEvent.getId();
				
				//Different actions for each event
				if(!eventId || !actionNamesList[eventId]){
					jQuery.sap.log.warning('Cannot execute action: no action for eventId: ' + eventId);
					return null;
				}
				
				actionName = actionNamesList[eventId];
			}
			
			return actionName;
		};

		/*
		 * Action event handler
		 */
		controllerImpl[controllerImpl.actionEventHandler] = function(oEvent){
			//No callback needed
			this.getApp().runAction({
				"eventSource" : oEvent.getSource(),
				"eventParameters" : oEvent.getParameters(),
				"controller" : this,
				"parameters" : _getActionFromEvent(oEvent, this.actionAttribute)
			});
		};

		var oldOnInit = controllerImpl.onInit;

		controllerImpl.onInit = function(oEvent){ 
			var app = this.getApp(),
					_this = this;

			if(app){
				//if(!this.actions){
				//	this.actions = jQuery.sap.getObject(app.config.data.app["package"] + ".actions");
				//	console.log("AC", this.actions);
				//}
				
				//TODO find out if view.sViewName is reliable
				var view = this.getView(),
					viewId = view.getId(),
					initEvents = app.config.getEvents('controller', 'init', viewId),
					initEventsLength = initEvents.length,
					nextAction = function(j){
						if(j >= initEventsLength){
							return;
						}
						
						var actionName = initEvents[j];
						
						app.log.debug("Executing action '" + actionName + "' (view: '" + viewId + "', event: 'onInit') ...");
						
						app.runAction({
							"parameters" : actionName, 
							"eventSource" : oEvent.getSource(),
							"eventParameters" : oEvent.getParameters(),
							"controller" : _this,
							callback : function(){
								nextAction(j+1);
							}
						});
					};
				
				nextAction(0);
			}

			//Call old onInit function
			if(oldOnInit){
				oldOnInit.call(this, oEvent);
			}
		};
		
		//Update
		//TODO rename to pageUpdate
		_createActionEventHandler(controllerImpl, 'update');
		
		//Update
		_createActionEventHandler(controllerImpl, 'pageUpdateSingle');

		//PageHide
		_createActionEventHandler(controllerImpl, 'pageHide');
		
		//PageHidden
		_createActionEventHandler(controllerImpl, 'pageHidden');
		
		//PageShow
		_createActionEventHandler(controllerImpl, 'pageShow');
		
		//PageShown
		_createActionEventHandler(controllerImpl, 'pageShown');
		
	};

	//Return Module Constructor
	return AppBase;
});
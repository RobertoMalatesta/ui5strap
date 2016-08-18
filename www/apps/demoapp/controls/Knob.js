sap.ui.define(['ui5strap/ControlBase', './jquery.knob.min'], function(ControlBase){

    "use strict";
    
	//Define the Constructor
    var Knob = ControlBase.extend("com.ui5strap.apps.demoapp.controls.Knob", {
    
        metadata : {

            library : "com.ui5strap.apps.demoapp",
      
            properties : {
            	
            	value : {
            		type : "int",
            		defaultValue : 0
            	}
            	
            },
      
            aggregations : {},
            
            events : {}

        }
    }),
    KnobProto = Knob.prototype;

    KnobProto._getStyleClassPrefix = function(){
        //You should specifiy a really unique prefix here.
        return "knob";
    };
    
    KnobProto.onBeforeRendering = function(){
    	if(this._$knob){
	    	this._$knob.remove();
	    	this._$knob = null;
    	}
    };
    
    KnobProto.onAfterRendering = function(){
    	this._$knob = this.$().find("." + this._getStyleClassPart("knob")).knob();
    	
    	console.log("AR", this.$().data("rev"));
    };
    
    KnobProto.exit = function(){
    	this._$knob.remove();
    	this._$knob = null;
    };
    
    //return Constructor
    return Knob;

});
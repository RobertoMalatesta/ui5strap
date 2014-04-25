/*
 * 
 * UI5Strap
 *
 * NavItem Renderer
 * 
 * Author: Jan Philipp Knöller
 * 
 * Copyright (c) 2013 Jan Philipp Knöller
 * 
 * http://pksoftware.de
 *
 * Get the latest version: https://github.com/pks5/ui5strap
 * 
 * Released under Apache2 license: http://www.apache.org/licenses/LICENSE-2.0.txt
 * 
 */

(function(){

	jQuery.sap.declare("de_pksoftware.ui5strap.controls.NavItemRenderer");

	de_pksoftware.ui5strap.controls.NavItemRenderer = {
	};

	de_pksoftware.ui5strap.controls.NavItemRenderer.render = function(rm, oControl) {
		var content = oControl.getContent();

		rm.write("<li");
		rm.writeControlData(oControl);
		
		if(oControl.getActive()){
			rm.addClass("active");
		}
		
		if(oControl.getDisabled()){
			rm.addClass("disabled");
		}

		rm.writeClasses();
		rm.write(">");
		
		for(var i = 0; i < content.length; i++){ 
			rm.renderControl(content[i]);
		}

		rm.write("</li>");
	};

}());
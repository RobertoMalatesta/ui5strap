/*
 * 
 * UI5Strap
 *
 * Standard Nav Container with navbar and content
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

	jQuery.sap.declare("ui5strap.NavContainer");
	
	sap.ui.core.Control.extend("ui5strap.NavContainer", {
		metadata : {

			// ---- object ----
			defaultAggregation : "content",
			
			// ---- control specific ----
			library : "ui5strap",
			
			properties : { },
			
			aggregations : { 
				
				navBar : {
					singularName: "navBar",
					multiple : false
				}, 
				content : {
					singularName: "content"
				}
			}

		}
	});

	var NavContainer = ui5strap.NavContainer,
		NavContainerProto = NavContainer.prototype;

	NavContainerProto.init = function(){

	};

}());
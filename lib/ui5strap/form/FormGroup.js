/*
 * 
 * UI5Strap
 *
 * form.FormGroup
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

	jQuery.sap.declare("de_pksoftware.ui5strap.form.FormGroup");
	jQuery.sap.require("de_pksoftware.ui5strap.library");
	
	sap.ui.core.Control.extend("de_pksoftware.ui5strap.form.FormGroup", {
		metadata : {

			defaultAggregation : "controls",
			
			library : "de_pksoftware.ui5strap",

			properties : { 
				severity : {
					type:"de_pksoftware.ui5strap.FormSeverity", 
					defaultValue:"None"
				},
				label : {
					type:"string", 
					defaultValue:""
				},
				feedback : {
					type:"boolean",
					defaultValue : false
				},
				labelExtraSmall : {
					type:"int", defaultValue:0
				},
				labelSmall : {
					type:"int", defaultValue:0
				},
				labelMedium : {
					type:"int", defaultValue:0
				},
				labelLarge : {
					type:"int", defaultValue:0
				}
			},
			aggregations : { 
				controls : {
					multiple : true,
					singularName : "control"
				}
			}

		}
	});

}());
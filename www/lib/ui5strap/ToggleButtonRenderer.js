/*
 * 
 * UI5Strap
 *
 * ui5strap.ToggleButtonRenderer
 * 
 * @author Jan Philipp Knöller <info@pksoftware.de>
 * 
 * Homepage: http://ui5strap.com
 *
 * Copyright (c) 2013-2014 Jan Philipp Knöller <info@pksoftware.de>
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

sap.ui.define([], function(){

	var ToggleButtonRenderer = {};

	ToggleButtonRenderer.render = function(rm, oControl) {
		rm.write("<div");
		rm.writeControlData(oControl);
	    rm.addClass(oControl._getStyleClass());
	    rm.writeClasses();
		rm.write(">");
			
			//Text On
			if(oControl.getTextDeselected()){
				rm.write("<span");
				rm.addClass("ui5strapToggleButton-text ui5strapToggleButton-text-Deselected");
				rm.writeClasses();
				rm.write(">");
				rm.writeEscaped(oControl.getTextDeselected());
				rm.write("</span>");
			}
	
			rm.write("<span");
			rm.addClass("ui5strapToggleButton-hole");
			rm.writeClasses();
			rm.write(">");
				rm.write("<span");
				rm.addClass("ui5strapToggleButton-pin");
				rm.writeClasses();
				rm.write("></span>");
			rm.write("</span>");
		    
			//Text Off
			if(oControl.getTextSelected()){
				rm.write("<span");
				rm.addClass("ui5strapToggleButton-text ui5strapToggleButton-text-Selected");
				rm.writeClasses();
				rm.write(">");
				rm.writeEscaped(oControl.getTextSelected());
				rm.write("</span>");
			}
		rm.write("</div>");
	};
	
	return ToggleButtonRenderer;
	
}, true);
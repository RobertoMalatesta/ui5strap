/*
 * 
 * UI5Strap
 *
 * ui5strap.TextInputRenderer
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

sap.ui.define(['jquery.sap.global'], function(jQuery) {

	var TextInputRenderer = {};

	TextInputRenderer.render = function(rm, oControl) {
		var rows = oControl.getRows(),
			type = oControl.getType(),
			maxLength = oControl.getMaxLength();
		
		//TODO We need a option for Input VS Textare instead of using rows to decide.
		//If the new option is not specified, it could decide by rows.
		if(2 > rows){
			//Render Input Field
			
			rm.write("<input");
			
			rm.writeControlData(oControl);
			
			rm.writeAttribute('type', "text");

			rm.writeAttribute('placeholder', oControl.getPlaceholder());
			rm.writeAttribute('value', oControl.getValue());
			
			if(type === ui5strap.TextInputType.FormControl){
				rm.addClass('form-control');
			}
			
			if(!oControl.getEnabled()){
				rm.writeAttribute('disabled', 'disabled');
			}
			
			if(!oControl.getAutocomplete()){
				rm.writeAttribute('autocomplete', 'off');
			}
			
			if(maxLength > 0){
				rm.writeAttribute('maxlength', maxLength);
			}

			var size = oControl.getSize();
			if(ui5strap.Size.Default !== size){
				rm.addClass('input-' + ui5strap.BSSize[size]);
			}
			
			rm.writeClasses();
			rm.write("/>");

		}
		else{
			//Render Textarea
			rm.write("<textarea");
			
			rm.writeControlData(oControl);
			
			rm.writeAttribute('rows', rows);
			rm.writeAttribute('placeholder', oControl.getPlaceholder());
			
			if(type === ui5strap.TextInputType.FormControl){
				rm.addClass('form-control');
			}
			
			if(!oControl.getEnabled()){
				rm.writeAttribute('disabled', 'disabled');
			}
			
			if(!oControl.getAutocomplete()){
				rm.writeAttribute('autocomplete', 'off');
			}
			
			if(maxLength > 0){
				rm.writeAttribute('maxlength', maxLength);
			}

			rm.writeClasses();
			rm.write(">");
			
			rm.writeEscaped(oControl.getValue());
			
			rm.write("</textarea>");
		}

		ui5strap.RenderUtils.renderTrail(rm, oControl);
	};

	return TextInputRenderer;
}, true);

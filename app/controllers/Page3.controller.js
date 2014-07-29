jQuery.sap.require('ui5strap.Action');

sap.ui.controller("com_mycompany.my_app.controllers.Page3", {

	app : liberty.getViewer().getApp(),

	switchTheme : function(oEvent){
		var btn = oEvent.getSource();

		if(!this.activeButton){
			this.activeButton = this.getView().byId('defaultThemeButton');
		}

		if(btn !== this.activeButton){
			this.activeButton.setSelected(false);
			
			btn.setSelected(true);
			
			this.activeButton = btn;

			this.setTheme(btn.getCustomData()[0].getValue('theme'));
		}
		
	},

	setTheme : function(newTheme){
		var app = this.app;

		ui5strap.Action.run({
			"parameters" : {
				"a_modules" : "ui5strap.AMChangeTheme",
				"changeTheme" : {
					theme : newTheme
				}
			},
			"app" : this.getView().getViewData().app,
			"controller" : this
		});
	},

	submitThemeForm : function(oEvent){
		var app = this.app,
			_this = this;
		

		var newTheme = this.getView().byId('themeInput').getValue();

		if('' === newTheme){
			return false;
		}

		if(!this.isValidBootstrapTheme(newTheme)){
			//Todo Change to BS Modal

			alert(newTheme + ' is not a valid Bootstrap theme!');

			return false;
		}
		else{

			if(this.activeButton){
					this.activeButton.setSelected(false);
			}

			_this.setTheme(newTheme);

		}
	},

	isValidBootstrapTheme : function(themeUrl){
 		return /bootstrap(\.min)?\.css$/.test(themeUrl);
	}
	
});
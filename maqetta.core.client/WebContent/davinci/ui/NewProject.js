define(["dojo/_base/declare",
        "dijit/_Templated",
        "dijit/_Widget",
        "davinci/library",
        "system/resource",
        "davinci/workbench/Preferences",
        "davinci/Runtime",
        "davinci/Workbench",
        "dojo/i18n!davinci/ui/nls/ui",
        "dojo/i18n!dijit/nls/common",
        "dojo/text!./templates/NewProject.html",
        "dijit/form/Button",
        "dijit/form/RadioButton",
        "dijit/form/ValidationTextBox"
        
],function(declare, _Templated, _Widget,  Library, Resource, Preferences,  Runtime, Workbench, uiNLS, commonNLS, templateString){

	var noProjectTemplate = '_none_';

	return dojo.declare("davinci.ui.NewProject",   [_Widget,_Templated], {
		widgetsInTemplate: true,
		templateString: templateString,
		_okButton: null,
		_projectName: null,
		_eclipseSupport: null,
		_projectTemplate: noProjectTemplate,
		
		postMixInProperties: function() {
			var langObj = uiNLS;
			var dijitLangObj = commonNLS;
			dojo.mixin(this, langObj);
			dojo.mixin(this, dijitLangObj);
			Resource.listProjects(dojo.hitch(this,this.setProjects));
			this.inherited(arguments);
		},

		setProjects: function(projects){
			this._projects = {};

			projects.forEach(dojo.hitch(this, function(project) {
					if (project) {
						this._projects[project.name] = true;
					}
			}));
		},

		postCreate: function(){
			this.inherited(arguments);
			dojo.connect(this._projectName, "onKeyUp", this, '_checkValid');

			this._projectName.validator = dojo.hitch(this, function(value, constraints) {
					var isValid = true;
					
					if (!this._projects || !value) {
						isValid = false;
					} else if (this._projects[value]) {
						isValid = false;
						this._projectName.invalidMessage = uiNLS.newProjectNameExists;
					} else {
						this._projectName.invalidMessage = null;
					}
					
					return isValid;
			});
			var projectTemplates = Runtime.getSiteConfigData("projectTemplates");
			var opts = [{value:noProjectTemplate, label:uiNLS.newProjectNoTemplate}];
			if(projectTemplates && projectTemplates.templates && projectTemplates.templates.length > 0){
				opts.push({type:'separator'});
				for(var i=0; i<projectTemplates.templates.length; i++){
					var template = projectTemplates.templates[i];
					if(template.folder && template.name){
						var authorSpan = template.authorEmail ? 
								'<span class="NewProjectTemplateAuthor">&nbsp;&nbsp;(Author: '+template.authorEmail+')</span>' :
								'';
						var label = '<span class="NewProjectTemplateName">'+template.name+'</span>'+authorSpan;
						opts.push({value:template.folder, label:label});
					}
				}
			}
			this.projectTemplates.addOption(opts);
		},
		
		_checkValid: function(){
			// make sure the project name is OK.
			if(!this._projects) return false; // project data hasn't loaded

			var valid = this._projectName.isValid();

			this._okButton.set('disabled', !valid);
		},
		
		okButton: function() {
			var newProjectName = this._projectName.get("value");
			var isEclipse = dojo.attr(this._eclipseSupport, 'checked');
			var projectTemplateName = this._projectTemplate == noProjectTemplate ? '' : this._projectTemplate;

			Resource.createProject({
				newProjectName:newProjectName, projectTemplateName:projectTemplateName, isEclipse:isEclipse
			}).then(function() {
				if (isEclipse) {
					Preferences.savePreferences(
							'davinci.ui.ProjectPrefs',
							newProjectName,
							{
								webContentFolder:"WebContent",
								themeFolder: "WebContent/themes",
								widgetFolder: "WebContent/lib/custom"
							}
					);
				}

				Workbench.loadProject(newProjectName);
			});
		},
		
		_getEclipseProjectAttr: function(){
			 return dojo.attr(this._eclipseSupport, "checked");
		},
		
		_getValueAttr: function(){
			return this.value;
		},
		
		//FIXME: What parameters to change event?
		_onChangeTemplate: function(newValue){
			this._projectTemplate = newValue;
		},

		cancelButton: function(){
			this.cancel = true;
			this.onClose();
		},

		onClose: function(){}
	});
});


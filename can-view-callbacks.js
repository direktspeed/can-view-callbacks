var Observation = require('can-observation');

var dev = require('can-util/js/dev/dev');
var getGlobal = require('can-util/js/global/global');
var domMutate = require('can-util/dom/mutate/mutate');
var namespace = require('can-namespace');

//!steal-remove-start
var requestedAttributes = {};
//!steal-remove-end

var attr = function (attributeName, attrHandler) {
	if(attrHandler) {
		if (typeof attributeName === "string") {
			attributes[attributeName] = attrHandler;
			//!steal-remove-start
			if(requestedAttributes[attributeName]) {
				dev.warn("can-view-callbacks: " + attributeName+ " custom attribute behavior requested before it was defined.  Make sure "+attributeName+" is defined before it is needed.");
			}
			//!steal-remove-end
		} else {
			regExpAttributes.push({
				match: attributeName,
				handler: attrHandler
			});

			//!steal-remove-start
			Object.keys(requestedAttributes).forEach(function(requested){
				if(attributeName.test(requested)) {
					dev.warn("can-view-callbacks: " + requested+ " custom attribute behavior requested before it was defined.  Make sure "+attributeName+" is defined before it is needed.");
				}
			});
			//!steal-remove-end
		}
	} else {
		var cb = attributes[attributeName];
		if( !cb ) {

			for( var i = 0, len = regExpAttributes.length; i < len; i++) {
				var attrMatcher = regExpAttributes[i];
				if(attrMatcher.match.test(attributeName)) {
					return attrMatcher.handler;
				}
			}
		}
		//!steal-remove-start
		requestedAttributes[attributeName] = true;
		//!steal-remove-end
		
		return cb;
	}
};

var attributes = {},
	regExpAttributes = [],
	automaticCustomElementCharacters = /[-\:]/;
var defaultCallback = function () {};
var tagHandler = function(el, tagName, tagData){
		var helperTagCallback = tagData.options.get('tags.' + tagName,{proxyMethods: false}),
			tagCallback = helperTagCallback || tags[tagName];

		// If this was an element like <foo-bar> that doesn't have a component, just render its content
		var scope = tagData.scope,
			res;

		if(tagCallback) {
			res = Observation.ignore(tagCallback)(el, tagData);
		} else {
			res = scope;
		}

		//!steal-remove-start
		if (!tagCallback) {
			var GLOBAL = getGlobal();
			var ceConstructor = GLOBAL.document.createElement(tagName).constructor;
			// If not registered as a custom element, the browser will use default constructors
			if (ceConstructor === GLOBAL.HTMLElement || ceConstructor === GLOBAL.HTMLUnknownElement) {
				dev.warn('can-view-callbacks: No custom element found for ' + tagName);	
			}
		}
		//!steal-remove-end

		// If the tagCallback gave us something to render with, and there is content within that element
		// render it!
		if (res && tagData.subtemplate) {

			if (scope !== res) {
				scope = scope.add(res);
			}
			var result = tagData.subtemplate(scope, tagData.options);
			var frag = typeof result === "string" ? can.view.frag(result) : result;
			domMutate.appendChild.call(el, frag);
		}
	}

var tag = function (tagName, tagHandler) {
	if(tagHandler) {
		var GLOBAL = getGlobal();

		//!steal-remove-start
		if (typeof tags[tagName.toLowerCase()] !== 'undefined') {
			dev.warn("Custom tag: " + tagName.toLowerCase() + " is already defined");
		}
		if (!automaticCustomElementCharacters.test(tagName) && tagName !== "content") {
			dev.warn("Custom tag: " + tagName.toLowerCase() + " hyphen missed");
		}
		//!steal-remove-end
		// if we have html5shiv ... re-generate
		if (GLOBAL.html5) {
			GLOBAL.html5.elements += " " + tagName;
			GLOBAL.html5.shivDocument();
		}

		tags[tagName.toLowerCase()] = tagHandler;
	} else {
		var cb;

		// if null is passed as tagHandler, remove tag
		if (tagHandler === null) {
			delete tags[tagName.toLowerCase()];
		} else {
			cb = tags[tagName.toLowerCase()];
		}

		if(!cb && automaticCustomElementCharacters.test(tagName)) {
			// empty callback for things that look like special tags
			cb = defaultCallback;
		}
		return cb;
	}

};
var tags = {};

var callbacks = {
	_tags: tags,
	_attributes: attributes,
	_regExpAttributes: regExpAttributes,
	defaultCallback: defaultCallback,
	tag: tag,
	attr: attr,
	// handles calling back a tag callback
	tagHandler
};

namespace.view = namespace.view || {};

if (namespace.view.callbacks) {
	throw new Error("You can't have two versions of can-view-callbacks, check your dependencies");
} else {
	module.exports = namespace.view.callbacks = callbacks;
}

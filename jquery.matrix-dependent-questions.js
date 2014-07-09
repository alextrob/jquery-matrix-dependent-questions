/*!
 * Dependent questions jQuery plugin.
 *
 * Author: jsinclair@squiz.com.au
 *
 * Written using boilerplate code from
 * http://coding.smashingmagazine.com/2011/10/11/essential-jquery-plugin-patterns/
 *
 * © 2012 James Sinclair
 * MIT License. 
 */

/*jslint nomen:true, browser:true*/
/*globals jQuery*/
;
(function ($, window, document, undefined) {
    "use strict";
    // See http://bit.ly/rc0Nzl for reasoning on why window, document and undefined
    // are passed in here.


    // The some() method is not implemented in some browsers.
    // See https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/some
    // for the origin of this polyfill.
    if (!Array.prototype.some) {
        Array.prototype.some = function (fun, thisp) {
            var t, len, i;
            if (this === null) { throw new TypeError(); }

            t   = Object(this);
            len = t.length >>> 0;
            if (typeof fun !== "function") { throw new TypeError(); }

            for (i = 0; i < len; i += 1) {
                if (i in t && fun.call(thisp, t[i], i, t)) { return true; }
            }
            return false;
        };
    }

    // Return true if haystack contains needle 
    function contains(haystack, needle) {
        function equals(haystrand) {
            return haystrand === needle;
        }
        return haystack.some(equals);
    }


    // Configuration and defaults.
    var pluginName = "dependentQuestions",
        defaults = {
            "effect":   "slide", // Must be one of "slide" or "fade"
            "duration": "fast"
        },
        effectsMap = {
            "slide": {
                "show": "slideDown",
                "hide": "slideUp"
            },
            "fade": {
                "show": "fadeIn",
                "hide": "fadeOut"
            }
        };

    // The actual plugin constructor
    function QuestionToggler(element, options) {
        this.element = element;

        // Handle options.
        this.options   = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name     = pluginName;

        this.init();
    }

    // Initialisation. Parses all the "data-depends-on" attributes and sets event
    // listeners.
    QuestionToggler.prototype.init = function () {
        // Find all elements that have a "data-depends-on" attribute.
        var questions, dataRe, dependentsMap, effect, duration;

        effect        = this.options.effect;
        duration      = this.options.duration;
        dependentsMap = {};

        // Regular expression for parsing data attribute.
        dataRe = new RegExp("([^=]*)=(.*)");

        // Fetch all the elements with "data-depends-on" attributes.
        if (!this.element.find) { this.element = $(this.element); }
        questions = this.element.find("[data-depends-on], [data-depends-off]")
                        .parents(".sq-form-question");

        // Get the value of a form element by name, even if it is a radio button
        // or checkbox
        function getValueByName(inputName) {
            var multiInputs, el, elType, multi, checkVals;
            multiInputs = ["radio", "checkbox"];
            el = $("[name=\"" + inputName + "\"]");
            if (el.length === 0) { return undefined; }

            elType = el.attr("type");
            multi  = contains(multiInputs, elType);
            if (!multi) { return el.val(); }

            if (elType === "radio") { return el.filter(":checked").val(); }

            if (elType === "checkbox") {
                checkVals = $.map(el.filter(":checked"), function (checkbox) {
                    return $(checkbox).val();
                });
                return checkVals;
            }
        }

        // Event handler for when a toggling element changes value.
        function onTogglerChange(evt) {
            var toggler, toggleSpec;
            toggler    = $(evt.target);
            toggleSpec = toggler.data("toggle-spec") || [];
            $.each(toggleSpec, function(i, spec) {
                var dependents, showVal, val, show, effectFunc, action;
                dependents = spec.dependents;
                showVal    = spec.showVal;
                val        = getValueByName(toggler.attr("name"));
                show       = (typeof val === "object") ?
                                 contains(val, showVal) :
                                 (val === showVal);

                // 'on'
                action     = (show) ? "show" : "hide";
                effectFunc = effectsMap[effect][action];
                dependents.dependModeOn[effectFunc](duration);

                // reverse it for 'off'
                action     = (show) ? "hide" : "show";
                effectFunc = effectsMap[effect][action];
                dependents.dependModeOff[effectFunc](duration);
            });
        }

        // Create a map of things that need to be toggled.
        function addMapEntry(i, element) {
            var data, el, onOff;
            el    = $(element);
            data  = el.find("[data-depends-on]").data("depends-on");
            onOff = "dependModeOn";

            if (typeof data === 'undefined') {
                data  = el.find("[data-depends-off]").data("depends-off");
                onOff = "dependModeOff";
            }

            if (typeof dependentsMap[data] === 'undefined') {
                dependentsMap[data] = {};
            }

            if (!dependentsMap[data][onOff]) {
                dependentsMap[data][onOff] = el;
            } else {
                dependentsMap[data][onOff] = el.add(dependentsMap[data]);
            }
        }
        questions.each(addMapEntry);

        // Create event listeners
        function setListener(key, dependents) {
            var matches, name, showVal, toggler, toggleSpec;

            // Parse the key value
            matches = dataRe.exec(key);
            if (!matches) { return; }
            name      = matches[1];
            showVal   = matches[2];

            // Grab the relevant elements
            toggler    = $("[name=\"" + name + "\"]");
            toggleSpec = toggler.data("toggle-spec") || [];

            toggleSpec.push({
                dependents: dependents,
                showVal:    showVal
            });
            toggler.data("toggle-spec", toggleSpec);
            toggler.change(onTogglerChange);
        }
        $.each(dependentsMap, setListener);

        // Set the initial state of each dependent question to match form state.
        function showHideByValue(key, dependents) {
            var matches, name, showVal, toggler, val, func, hasMatch;

            if (typeof dependents.dependModeOn  === 'undefined') { dependents.dependModeOn  = $(); }
            if (typeof dependents.dependModeOff === 'undefined') { dependents.dependModeOff = $(); }

            // Parse the key value
            matches = dataRe.exec(key);
            if (!matches) { return; }
            name    = matches[1];
            showVal = matches[2];

            toggler = $("[name=\"" + name + "\"]");
            val     = getValueByName(name);
            if (typeof val === "object") {
                hasMatch = contains(val, showVal);
            } else {
                hasMatch = (val === showVal);
            }

            func = (hasMatch) ? "show" : "hide";
            dependents.dependModeOn[func]();

            // Switch it around for off
            func = (hasMatch) ? "hide" : "show";
            dependents.dependModeOff[func]();

        }
        $.each(dependentsMap, showHideByValue);
    };

    // A really lightweight plugin wrapper around the constructor, 
    // preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(
                    this,
                    "plugin_" + pluginName,
                    new QuestionToggler(this, options)
                );
            }
        });
    };

}(jQuery, window, document));
/**
 * A configurable widget for a string input field with suggest / autocomplete.
 * 
 * Compatibility only checked for OpenCms 9.
 * 
 * This file should reside at:
 * /system/modules/no.npolar.opencms.widgets/resources/string_suggest_widget.js
 * 
 * The widget fetches suggestions by querying a web service, which must respond 
 * in JSONP. The suggestions source can be easily changed, by changing the widget 
 * configuration - different sources can be "tailored" to fit each 
 * implementation of the widget.
 * 
 * For more info, see the widget's backing Java class (StringSuggestWidget).
 * 
 * Note also the special __CONTENT_LOCALE keyword. This can be used as a dynamic 
 * value to reference the current content locale.
 * 
 * Created with much help from the OpenCms community.
 * 
 * @author Paul-Inge Flakstad, Norwegian Polar Institute
 * @version 1.0
 */

// Log debug (info / warning / error) messages to console?
var consoleDebugging = true;

// Names tracker object, used to ensure unique names. Vital for the widget to 
// work properly with repeating elements.
var nameCounter = {};

/**
 * Creates the widget for the XML content (backend) editor and the inline 
 * (frontend) editor.
 *
 * @param configuration Configuration string from the Java class (see method getConfiguration).
 * @param element       If inline==true, then the DOM-Element from the preview, null otherwise.
 * @param inline        True if called from the inline (frontend) editor, false otherwise.
 *
 * @return The widget.
 */
function createStringSuggestWidget(/*String*/configuration, /*Element*/element, /*boolean*/inline) {
    var CONF_KEY_NAME = "name"; // Automatically added to the config by the backing Java class
    var CONF_KEY_MAXLENGTH = "maxlength";
    var CONF_KEY_TEMPLATE_INFO = "tpl_info";

    if (consoleDebugging) console.log('createStringSuggestWidget called, configuration: ' + configuration);

    // Get configuration object
    var conf = getConfigObject(configuration);
    
    if (nameCounter[ conf[CONF_KEY_NAME] ] >= 0) { // If true, there is a naming conflict, so ...
        nameCounter[ conf[CONF_KEY_NAME] ]++; // ... increment the counter for that name ...
        conf[CONF_KEY_NAME] = conf[CONF_KEY_NAME] + "_" + nameCounter[ conf[CONF_KEY_NAME] ]; // ... and update the name, making sure to include "_1", "_2", "_3" etc. at the end
    }
    nameCounter[ conf[CONF_KEY_NAME] ] = 0; // Because of the above (potentially name-changing) routine, it is safe to set the counter to zero now

    if (consoleDebugging) console.log('StringSuggestWidget - configured name: ' + conf[CONF_KEY_NAME]);

    /*
     * The widget object.
     */
    var widget = {
        // The widget value
        _value: "",
        // The root element, contains the entire widget
        _element: element,
        // The input field
        _input: null,
        // The info wrapper
        _info: null,
        // The "is active" flag
        _active: true,

        /**
         * [NATIVE]
         * Returns the widget root element.
         */
        getElement: function () {
            if (consoleDebugging) console.log('StringSuggestWidget: getElement called for ' + conf[CONF_KEY_NAME]);

            if (!inline) {
                // The widget's root element
                this._element = document.createElement("div");

                // The wrapper element
                this._suggestWrapper = document.createElement("div");
                this._suggestWrapper.setAttribute("class", "suggest org-opencms-ade-contenteditor-client-css-I_CmsLayoutBundle-I_CmsWidgetCss-textBox");

                // Create the input element
                this._input = document.createElement("input");
                this._input.type = "text";
                this._input.name = conf[CONF_KEY_NAME];
                // Set an ID (we will use it as a hook for the suggest feature)
                var id = conf[CONF_KEY_NAME].replace(':','_'); // The name should already be unique, but replace any colon (":") with underscore ("_")
                this._input.setAttribute("id", id);
                // Hook up some custom event handlers for the input field
                this._input.onkeyup = this.onValueChange;
                this._input.onblur = this.onValueChange;
                this._input.onkeypress = this.onValueChange;

                // Append the input to the wrapper, and then the wrapper to the root
                this._suggestWrapper.appendChild(this._input);
                this._element.appendChild(this._suggestWrapper);

                if (typeof conf[CONF_KEY_TEMPLATE_INFO] !== 'undefined') {
                    // Create a display-only element to hold extra info.
                    // E.g.: The suggest list might be item names, while we're 
                    // actually storing an item's ID. In that case, it's nice
                    // to actually display both the item name and ID.
                    this._info = document.createElement("div");
                    this._info.setAttribute("class", "stringsuggest-info");
                    this._info.setAttribute("id", id+"_info");
                    //this._info.setAttribute("style", "color:#777; padding:0.4em;");

                    // Append the display-only info element to the root element
                    this._element.appendChild(this._info);
                }
            }
            // !!! IMPORTANT !!!
            // This widget is NOT inline-edit enabled!
            else {
                this._element.name = conf[CONF_KEY_NAME];
                this._element.setAttribute("contentEditable", "true");
                this.setValue(this._element.innerHTML, false);
            }
            
            // All done - return the root element
            return this._element;
        },

        /**
         * [NATIVE]
         * Will be called once the widget element is attached to the DOM.
         */
        onAttachWidget: function () {
            if (consoleDebugging) console.log('StringSuggestWidget: onAttachWidget called for ' + conf[CONF_KEY_NAME]);
            // Set up suggest feature
            setupSuggest(configuration, this._input, this._value);
        },

        /**
         * [NATIVE]
         * Returns if the widget is active.
         */
        isActive: function () {
            if (consoleDebugging) console.log('StringSuggestWidget: isActive called for ' + conf[CONF_KEY_NAME]);
            return this._active;
        },

        /**
         * [NATIVE]
         * Activates or deactivates the widget.
         */
        setActive: function (/*boolean*/ active) {
            if (consoleDebugging) console.log('StringSuggestWidget: setActive called for ' + conf[CONF_KEY_NAME]);
            this._active = active;
        },

        /**
         * [NATIVE]
         * Returns the widget value.
         */
        getValue: function () {
            return this._value;
        },

        /**
         * [NATIVE]
         * Sets the widget value and fires the change event if required.
         * 
         * @param value The new value.
         * @param fireEvent If true, the onChangeCommand is fired.
         */
        setValue: function (/*String*/ value, /*boolean*/ fireEvent) {
            if (consoleDebugging) console.log('StringSuggestWidget: setValue called for ' + conf[CONF_KEY_NAME] + '. Value: ' + value);

            if (!inline) {
                this._input.value = value;
            }
            
            this._value = value;
            
            if (fireEvent && typeof this.onChangeCommand === 'function') {
                this.onChangeCommand();
            }
        },

        /**
         * [NATIVE]
         * Delegates the value change event to the editor.
         * This function will be attached to the widget by the editor.
         *
         * It is required to call this function every time the widget value 
         * changes. Changes that are propagated through this function won't 
         * be saved.
         */
        onChangeCommand: null,

        /**
         * [NATIVE]
         * Delegates the focus event to the editor.
         * 
         * This function will be attached to the widget by the editor.
         *
         * It is required to call this function on widget focus, so the 
         * editor highlighting can be updated.
         */
        onFocusCommand: null,

        /**
         * [EXTRA]
         * Handles value change events: Updates the widget value, firing the 
         * onChangeCommand. (This is vital, it tells the editor that the content
         * has changed.)
         */
        onValueChange: function () {
            // Do something with the value on change, maybe? (Validate, modify, etc.)
            var value = inline ? widget._element.innerHTML : widget._input.value;
            widget.setValue(value, true);
        }
    };
    return widget;
}

/**
 * Initialization function: Creates a new StringSuggestWidget widget. The name of 
 * this function must be the one returned by the method "getInitCall" in the 
 * backing Java class.
 */
function initStringSuggestWidget() {
    
    if (consoleDebugging) console.log('StringSuggestWidget: initStringSuggestWidget called.');
    
    registerWidgetFactory({
        /**
         * The widget name / identifier. The name must be identical to the fully 
         * qualified name of the backing Java class.
         */
        widgetName: "no.npolar.opencms.widgets.StringSuggestWidget", // LIKE THIS
        //widgetName: "StringSuggestWidget", // NOT LIKE THIS!!!
        
        createWidget: function (/*String*/ configuration) {
            if (consoleDebugging) console.log('Creating a new StringSuggestWidget ...');
            return createStringSuggestWidget(configuration, null, false);
        },

        /**
         * Creates a new widget using the given configuration, for backend editing.
         */
        createNativeWidget: function (/*String*/ configuration) {
            if (consoleDebugging) console.log('Creating a new StringSuggestWidget (backend editing) ...');
            return createStringSuggestWidget(configuration, null, false);
        },

        /**
         * Creates a new widget using the given configuration, for frontend editing.
         * 
         * !!! FRONTEND EDITING IS NOT YET TESTED !!!
         * 
         * Note that the spelling error ("wraped") in the method name is "on 
         * purpose" - the method signature is dictated by OpenCms.
         */
        createNativeWrapedElement: function (/*String*/ configuration, /*Element*/ element) {
            if (consoleDebugging) console.log('Creating a new StringSuggestWidget (frontend editing) ...');
            return createStringSuggestWidget(configuration, element, true);
        }
    });
}

/**
 * Sets up the suggest feature.
 * 
 * The configuration string should contain: 
 *  - a URI to a service that will accept a query string and return matching results, responding in JSONP.
 *  - the identifier for what to place in the input field when a suggestion is selected
 *  - the name of the query parameter (as dictated by the service)
 *  - a template for rendering suggestions - either stored in a separate file (recommended), or defined inline (must be XML-escaped!)
 * 
 * As a basis for the example widget configurations below, consider this service: 
 * (NOTE the parameters.)
 * http://api.npolar.no/person/?q=foo&fields=last_name,first_name,id,email&format=json&limit=30&callback=xyz&facets=false&variant=array
 * 
 * 
 * Example 1 - bare minimum: 
 * (NOTE: Queries the service using "q" as the query parameter name. Suggestions are read from a field "id" - a direct child of the response root. This will also be the extracted value.)
 * {
 *      uri:"http://api.npolar.no/person/?fields=last_name,first_name,id,email&format=json&limit=30&facets=false&variant=array"
 * }
 * 
 * Example 2 - recommended minimum:
 * (NOTE: tpl_suggestion must be XML-escaped - not done here for readability purposes.)
 * {
 *      uri:"http://api.npolar.no/person/?fields=last_name,first_name,id,email&format=json&limit=30&facets=false&variant=array"
 *      ,extract:"%(email)"
 *      ,pname_query:"q"
 *      ,tpl_suggestion:"<a>%(id)<br>%(first_name) %(last_name)</a>"
 * }
 * 
 * Example 3 - full: 
 * (NOTE the different format in the service response: matching results are not in the root here.)
 * {
 *      uri:"http://api.npolar.no/person/?fields=last_name,first_name,id,email&format=json&limit=50&facets=false" 
 *      ,results:"%(feed.entries)"
 *      ,extract:"%(email)" 
 *      ,letters:3
 *      ,pname_query:"q"
 *      ,pname_unique:"q-id"
 *      ,pname_callback:"callback"
 *      ,tpl_suggestion:{ uri:"/system/modules/some.module/some-folder/suggestions.tpl" } // path is root path
 *      ,tpl_info: { uri:"tpl/info.tpl" } // path is relative to this module's "resources" folder.
 * }
 * 
 * @param configuration The configuration string.
 * @param suggestElement The suggest element that should get a suggest feature.
 * @param value String The current widget value (if any).
 * @return Nothing.
 */ 
function setupSuggest(/*String*/configuration, /*Element*/ suggestElement, /*String*/ value) {
    
    // Configuration keywords, used in configuration string inside the XSD where the widget is employed. (See also the backing Java class.)
    var CONF_KEY_SERVICE_URI        = "uri"; // The service URI
    var CONF_KEY_SERVICE_URI_UNIQUE = "uri_unique"; // The service URI used to fetch a single unique entry
    var CONF_KEY_SERVICE_RESULTS    = "results"; // The identifier for the results array (if not the root element)
    var CONF_KEY_EXTRACT_FIELD      = "extract"; // The identifier for "what to place in the input field" when a suggestion is selected
    var CONF_KEY_LETTERS            = "letters"; // How many letters should exist before the widget starts suggesting
    var CONF_KEY_QUERY_PARAM_NAME   = "pname_query"; // The name of the query parameter (as dictated by the service at the given URI)
    var CONF_KEY_CALLBACK_PARAM_NAME= "pname_callback"; // The name of the callback parameter (as dictated by the service at the given URI)
    var CONF_KEY_UNIQUE_PARAM_NAME  = "pname_unique"; // The name of the parameter to use when querying the service for previously stored values (used when re-creating the "info" container for previously stored values)
    var CONF_KEY_TEMPLATE_SUGGEST   = "tpl_suggestion"; // How to render suggestions
    var CONF_KEY_TEMPLATE_INFO      = "tpl_info"; // How to render the "info" container
    
    var CONF_KEY_EVENTS             = "events"; // An object containing names of functions (strings) to call for specific events, like ...
    var CONF_KEY_EVENT_SELECT       = "select"; // ... the select event - which is currently the only event implemented.
    
    // Keys for locale and name, automatically added to the config by the backing Java class
    var CONF_KEY_LOCALE             = "locale"; // Key used to get the current content locale
    var CONF_KEY_NAME               = "name"; // Key used to get the element name

    // Configuration default values
    var DEFAULT_LETTERS             = 2;
    var DEFAULT_QUERY_PARAM_NAME    = "q";
    var DEFAULT_EXTRACT_FIELD       = "%(id)";
    var DEFAULT_CALLBACK_PARAM_NAME = "callback";
    //var DEFAULT_TEMPLATE_INFO       = "<p>%(title)<br><i>%(description)</i></p>";
    var DEFAULT_TEMPLATE_SUGGEST    = "<a>%(title)<br><i>%(description)</i></a>";
    
    var EXISTING_VALUE_SELECTOR     = "%(value)";
    
    //var CALLBACK_FUNCTION_NAME      = "createSuggestions";
    
    var id = suggestElement.getAttribute("id");
    if (consoleDebugging) console.log('Setting up StringSuggestWidget for #' + id + ' ...');
    
    // Parse and initialize the configuration
    var conf = initConf( getConfigObject(configuration) );
    
    /**
     * Try to set info details for existing values (when editing files).
     */
    if (typeof conf[CONF_KEY_TEMPLATE_INFO] !== 'undefined') { // Require the "tpl_info" configuration option
        
        if (typeof value !== 'undefined' 
            && value.length > 1 
            && (conf[CONF_KEY_UNIQUE_PARAM_NAME] !== null || conf[CONF_KEY_SERVICE_URI_UNIQUE] !== null)
        ) {
            
            if (consoleDebugging) console.log('Found existing value, querying service for "' + value + '" ...');
            //if (consoleDebugging) console.log('Found existing value, querying service for ' + conf[CONF_KEY_UNIQUE_PARAM_NAME] + '="' + value + '" ...');
            
            try {
                var singleEntryUrl = conf[CONF_KEY_SERVICE_URI_UNIQUE] === null ? conf[CONF_KEY_SERVICE_URI] : replaceAll(conf[CONF_KEY_SERVICE_URI_UNIQUE], EXISTING_VALUE_SELECTOR, value);
                // Construct the data object; the property name(s) of this object must be set dynamically (because they are configurable)
                var dataObj = {};
                if (conf[CONF_KEY_UNIQUE_PARAM_NAME] !== null) {
                    // If we're using a unique *query*, set the appropriate request parameter
                    dataObj[ conf[CONF_KEY_UNIQUE_PARAM_NAME] ] = value;
                }
                //dataObj[ conf[CONF_KEY_CALLBACK_PARAM_NAME] ] = DEFAULT_CALLBACK_PARAM_NAME;

                $.ajax({
                    // The URL, defined in the the config
                    url: singleEntryUrl,//conf[CONF_KEY_SERVICE_URI],
                    // The name of the callback parameter - this is dictated by the service and defined in the config (default: see DEFAULT_CALLBACK_PARAM_NAME)
                    jsonp: conf[CONF_KEY_CALLBACK_PARAM_NAME], 
                    // Tell the service that we want a function named CALLBACK_FUNCTION_NAME in the response
                    // (If nothing is specified, jQuery will request a random function name. This is the recommended usage, according to the jQuery docs.)
                    //jsonpCallback: CALLBACK_FUNCTION_NAME, 
                    // Tell jQuery we're expecting JSONP
                    dataType: "jsonp",
                    // Additional parameters to send to the service are stored in the data object
                    data : dataObj,
                    beforeSend: function(request, settings) {
                        if (consoleDebugging) console.log('Querying service at: ' + settings.url);
                    },
                    // Work with the response (JSON data)
                    success: function( responseData ) {
                        if (consoleDebugging) console.log('Service responded, processing ...');
                        //if (consoleDebugging) console.log("Service response: " + JSON.stringify(responseData) ); // server response

                        // If the CONF_KEY_SERVICE_RESULTS was set in the config, this means the suggestions are not objects in the root object,
                        // so modify the "data" JSON object accordingly. ("Step down" into the sub-object that contains suggestions.)
                        if (conf[CONF_KEY_SERVICE_RESULTS]) {
                            if (consoleDebugging)  console.log('Found "' + CONF_KEY_SERVICE_RESULTS + '" configuration setting, stepping down into "' + conf[CONF_KEY_SERVICE_RESULTS] + '" (but only if it exists) ...');
                            responseData = setServiceResults(responseData, conf[CONF_KEY_SERVICE_RESULTS]);
                        }

                        try {
                            var infoHtml = null;
                            var infoObject = null;
                            
                            if (typeof responseData === 'object') {
                                //if (consoleDebugging) console.log('Updating info box #' + id + '_info with data from: ' + JSON.stringify(responseData));
                                //infoHtml = applyTemplate( reponseData, conf[CONF_KEY_TEMPLATE_INFO]);
                                infoObject = responseData;
                            } else if (typeof responseData === 'array') { 
                                if (responseData.length === 1) { // Require single entry (= unique match)
                                    //if (consoleDebugging) console.log('Updating info box #' + id + '_info with data from: ' + JSON.stringify(responseData[0]));
                                    infoObject = responseData[0]; // Use the first result
                                    //infoHtml = applyTemplate ( responseData[0], conf[CONF_KEY_TEMPLATE_INFO] ); // Apply the first result (responseData[0])
                                } else {
                                    if (consoleDebugging) console.log('ERROR: Updating info box #' + id + '_info failed: Multiple entries in service response (or none at all).');
                                    infoHtml = '<p><i>Failed to identify a single entry. (Service returned multiple matches, or none at all.)</i></p>'; // Provide some info on what happened
                                }
                            }
                            if (infoHtml === null && infoObject !== null) {
                                if (consoleDebugging) console.log('Updating info box #' + id + '_info with data from: ' + JSON.stringify(responseData[0]));
                                infoHtml = applyTemplate( infoObject, conf[CONF_KEY_TEMPLATE_INFO] );
                            }
                            // Populate the widget's "info" container with content.
                            $("#"+id+"_info").html(infoHtml);
                        } catch(err) {
                            if (consoleDebugging) console.log('ERROR: Updating info box #' + id + '_info failed: ' + err);
                        }
                    },
                    error: function( request, status, error ) {
                        console.log('Querying service failed (' + status + '). Error was: ' + error);
                    }
                });
            } catch (err) {
                if (consoleDebugging) console.log( 'JSON error: ' + err );
            }
        }
    }
	
	
    $(function() {
	if (consoleDebugging) console.log( 'Initializing ...');
        
        /**
         * Initialize suggestions 
         * @see jQuery UI Autocomplete: http://api.jqueryui.com/autocomplete/
         */ 
        $("#"+id).autocomplete({
            /**
            * Define how many letters the user must input before the widget starts suggsting.
            * @see http://api.jqueryui.com/autocomplete/#option-minLength
            */
            minLength: conf[CONF_KEY_LETTERS]
            
            /**
            * Define the source; or: where to extract suggestions from.
            * @see http://api.jqueryui.com/autocomplete/#option-source
            */
            ,source: function(/*Object*/ request, /*Function*/ response) {
                if (consoleDebugging) console.log('Preparing request for "' + request.term + '" ...');
                // Construct the data object; set the property name(s) of this object dynamically (because they are configurable)
                var dataObj = {};
                dataObj[ conf[CONF_KEY_QUERY_PARAM_NAME] ] = request.term;
                
                // Add an element that can be used to indicate "loading suggestions ..."
                $("#"+id).after("<span class=\"loader suggest-widget-loading\" id=\"" + id + "-loader\"></span>");
                
                if (consoleDebugging) console.log('Querying service for "' + request.term + '" at ' + unescapeXML(conf[CONF_KEY_SERVICE_URI]) + ' ...');
                $.ajax({
                    url: unescapeXML(conf[CONF_KEY_SERVICE_URI]),
                    dataType: "jsonp",
                    data: dataObj,
                    success: function( data ) {
                        if (consoleDebugging) console.log('Service responded (JSONP): ' + JSON.stringify(data));

                        if (conf[CONF_KEY_SERVICE_RESULTS]) {
                            if (consoleDebugging)  console.log('Found "' + CONF_KEY_SERVICE_RESULTS + '" configuration setting, applying (Results fetched from "' + conf[CONF_KEY_SERVICE_RESULTS] + '") ...');
                            data = setServiceResults(data, conf[CONF_KEY_SERVICE_RESULTS]);
                            if (consoleDebugging)  console.log('Configured "' + CONF_KEY_SERVICE_RESULTS + '", service matches is now: ' + JSON.stringify(data));
                        }
                        response( data );
                    },
                    error: function( request, status, error ) {
                        console.log('Querying service failed (' + status + '). Error was: ' + error);
                    },
                    complete: function( request, status ) {
                        // Remove the "loading suggestions ..." element
                        setTimeout( function() {
                                        try { $("#" + id + "-loader").remove(); } catch (err) {}
                                    }, 
                                    200);
                    }
                });
            }
            
            /**
            * Define "on focus" callback; what to do when a suggestion is focused.
            * @see http://api.jqueryui.com/autocomplete/#event-focus
            */
            ,focus: function(/*Event*/ event, /*Object*/ ui) {
                //$("#"+id).val( getObjectPropertyAccessor( ui.item, conf[CONF_KEY_EXTRACT_FIELD] ) );
                return false;
            }
            
            /**
            * Define "on select" callback; what to do when a suggestion is selected.
            * @see http://api.jqueryui.com/autocomplete/#event-select
            */
            ,select: function(/*Event*/ event, /*Object*/ ui) {
                $("#"+id).val( getObjectPropertyAccessor( ui.item, conf[CONF_KEY_EXTRACT_FIELD] ) );
                if (typeof conf[CONF_KEY_TEMPLATE_INFO] !== 'undefined') {
                    $("#"+id+"_info").html( applyTemplate( ui.item, conf[CONF_KEY_TEMPLATE_INFO] ) );
                }
                
                // Any events configured?
                if (typeof conf[CONF_KEY_EVENTS] !== 'undefined') {
                    var confEvents = conf[CONF_KEY_EVENTS];
                    // Select event configured?
                    if (typeof confEvents[CONF_KEY_EVENT_SELECT] !== 'undefined') {
                        if (consoleDebugging) console.log('Select event configured, calling function ' + confEvents[CONF_KEY_EVENT_SELECT] + ' ...');
                        var selectFunction = window[confEvents[CONF_KEY_EVENT_SELECT]];
                        if (typeof selectFunction === 'function') {
                            selectFunction(event, ui); // Call the configured select event function
                        }
                    }
                }
                
                return false;
            }
        });
        
        /** 
         * Define suggestions rendering.
         * @see http://api.jqueryui.com/autocomplete/#method-_renderItem
         */
        if ( $("#"+id).data() ) {
            var ac = $("#"+id).data("ui-autocomplete"); /* IMPORTANT: Sometimes this is "autocomplete", sometimes "ui-autocomplete" (depends on version of jQueryUI) */
            if (consoleDebugging) console.log('Configuring suggestions renderer for #' + id + ' using suggestion template "' + conf[CONF_KEY_TEMPLATE_SUGGEST] + '" ...');
            if (ac) {
                ac._renderItem = function(/*jQuery*/ ul, /*Object*/ item) {
                    return $( "<li>" )
                        .data( "item.ui-autocomplete", item )
                        //.append( "<a>" + item.label + "<br /><em>" + item.description + "</em></a>" )
                        .append( applyTemplate( item, conf[CONF_KEY_TEMPLATE_SUGGEST] ) )
                        .appendTo( ul );
                };
		if (consoleDebugging) console.log('Suggestions renderer function ready - Good to go!');
            } else {
		console.log('Cannot configure suggestions renderer, element #' + id + ' has no autocomplete data.');
            }
        }
    });
    
    /**
     * Initializes the configuration object:
     * - Checks for mandatory values.
     * - Sets default values where values are missing.
     * - Removes XML escaped characters in values where neccessary.
     * 
     * @param o A configuration object, representing the configuration string, as provided by the getConfiguration method in the backing Java class.
     * @return The configuration object, ready to use.
     * @see getConfig(configuration)
     */
    function initConf(/*Object*/ o) {
        if (typeof o[ CONF_KEY_SERVICE_URI ] === 'undefined') {
            alert('ERROR: Critical configuration error: The suggest widget is missing required "uri" parameter in the configuration string.');
            return new Object();
        }
        if (typeof o[ CONF_KEY_SERVICE_URI_UNIQUE ] === 'undefined') {
            if (consoleDebugging) console.log('Missing unique entry URI, skipping.');
            o[CONF_KEY_SERVICE_URI_UNIQUE] = null;
        } else if (o[ CONF_KEY_SERVICE_URI_UNIQUE ].indexOf(EXISTING_VALUE_SELECTOR) === -1) {
            if (consoleDebugging) console.log('Missing existing value selector "' + EXISTING_VALUE_SELECTOR + '" in the unique entry URI "' + o[CONF_KEY_SERVICE_URI_UNIQUE] + '", aborting.');
            o[CONF_KEY_SERVICE_URI_UNIQUE] = null;
        }
        // Name of field to store in OpenCms
        if (typeof o[ CONF_KEY_EXTRACT_FIELD ] === 'undefined') {
            if (consoleDebugging) console.log('WARNING: Missing extraction field, fallback to default ("' + DEFAULT_EXTRACT_FIELD + '").');
            o[ CONF_KEY_EXTRACT_FIELD ] = DEFAULT_EXTRACT_FIELD;
        }
        // How many letters should exist before the widget starts suggesting
        if (typeof o[ CONF_KEY_LETTERS ] === 'undefined' // Missing value
                || (getLettersVal(o[ CONF_KEY_LETTERS ])) < 0) { // Illegal value
            if (consoleDebugging) console.log('Missing or illegal minLength value, fallback to default ("' + DEFAULT_LETTERS + '").');
            o[ CONF_KEY_LETTERS ] = DEFAULT_LETTERS;
        }
        
        // Search term parameter name (as dictated by the service)
        if (typeof o[ CONF_KEY_QUERY_PARAM_NAME ] === 'undefined') {
            if (consoleDebugging) console.log('Missing query parameter name, fallback to default ("' + DEFAULT_QUERY_PARAM_NAME + '").');
            o[ CONF_KEY_QUERY_PARAM_NAME ] = DEFAULT_QUERY_PARAM_NAME;
        }
        
        // Callback parameter name (as dictated by the service)
        if (typeof o[ CONF_KEY_CALLBACK_PARAM_NAME ] === 'undefined') {
            if (consoleDebugging) console.log('Missing callback parameter name, fallback to default ("' + DEFAULT_CALLBACK_PARAM_NAME + '").');
            o[ CONF_KEY_CALLBACK_PARAM_NAME ] = DEFAULT_CALLBACK_PARAM_NAME;
        }
        
        // "Unique query" parameter name (as dictated by the service)
        if (typeof o[ CONF_KEY_UNIQUE_PARAM_NAME ] === 'undefined') {
            if (consoleDebugging) console.log('Missing unique query parameter name, skipping.');
            o[ CONF_KEY_UNIQUE_PARAM_NAME ] = null;
        }
        
        // Template for rendering suggestions
        if (typeof o[ CONF_KEY_TEMPLATE_SUGGEST ] !== 'undefined') {
            o[ CONF_KEY_TEMPLATE_SUGGEST ] = unescapeXML(o[ CONF_KEY_TEMPLATE_SUGGEST ]);
        } else {
            if (consoleDebugging) console.log('WARNING: Template for suggestions missing, fallback to default ("' + DEFAULT_TEMPLATE_SUGGEST + '").');
            o[ CONF_KEY_TEMPLATE_SUGGEST ] = DEFAULT_TEMPLATE_SUGGEST;
        }
        
        // Template for rendering info box
        if (typeof o[ CONF_KEY_TEMPLATE_INFO ] !== 'undefined') {
            o[ CONF_KEY_TEMPLATE_INFO ] = unescapeXML(o[ CONF_KEY_TEMPLATE_INFO ]);
        } else {
            if (consoleDebugging) console.log('No info box template found, skipping.');
            o[ CONF_KEY_TEMPLATE_INFO ] = null;//DEFAULT_TEMPLATE_INFO;
        }
        
        return o;
    }
}
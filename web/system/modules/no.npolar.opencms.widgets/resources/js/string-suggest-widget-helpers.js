/**
 * Helper methods for the string suggest widget (string-suggest-widget.js).
 * 
 * This file should typically reside at:
 * /system/modules/no.npolar.opencms.widgets/resources/string-suggest-widget-helpers.js
 * 
 * For more info, see the documentation: 
 * https://github.com/paulflakstad/opencms-module-customwidgets/
 * 
 * License: 
 * This work is free. You can redistribute it and/or modify it, under the terms 
 * of the WTFPL license version 2. http://www.wtfpl.net/
 * 
 * @author Paul-Inge Flakstad, Norwegian Polar Institute
 * @version 1.0
 */

/*##############################################################################
 *
 * Helper methods
 *
 *##############################################################################
 */
// Log debug (info / warning / error) messages to console?
var consoleDebugging = true;
/**
 * Gets the configuration in a more convenient form, by converting the given 
 * configuration string into an object. This allows configuration values to be 
 * accessed by their keys, e.g.: myValue = myConf["myKey"].
 * 
 * @param configurationString The configuration string, as provided by the getConfiguration method in the backing Java class.
 * @return Object The configuration, as an object.
 */
function getConfigObject(/*String*/ configurationString) {
    // Blank object
    var config = {}; 
    
    if (configurationString == undefined)
        return config;
    if (configurationString.length <= 0)
        return config;
    
    // Parse configuration string
    if (configurationString.lastIndexOf("{", 0) === 0) {
        try {
            config = JSON.parse(configurationString);
        } catch (err) {
            if (consoleDebugging)
                console.log('Error parsing configuration as JSON. Spelling error? Configuration string was: [' + configurationString + ']');
        }
    }
    
    if (consoleDebugging)
        console.log('Configuration object created: ' + JSON.stringify(config));
    
    return config;
}

/**
 * Unescapes XML-escaped characters.
 * 
 * @param s The string (possibly) containing XML-escaped characters.
 * @return The given string, with any and all XML-escaped characters unescaped.
 */
function unescapeXML(/*String*/ s) {
    s = replaceAll(s, "&quot;", "\"");
    s = replaceAll(s, "&apos;", "'");
    s = replaceAll(s, "&lt;", "<");
    s = replaceAll(s, "&gt;", ">");
    s = replaceAll(s, "&amp;", "&");
    return s;
}

/**
 * XML-escapes the given string.
 * 
 * @param s The string to escape.
 * @return The given string, with any and all XML-reserved characters escaped.
 */
function escapeXML(/*String*/ s) {
    s = replaceAll(s, "\"", "&quot;");
    s = replaceAll(s, "'", "&apos;");
    s = replaceAll(s, "<", "&lt;");
    s = replaceAll(s, ">", "&gt;");
    s = replaceAll(s, "&", "&amp;");
    return s;
}

/**
 * Tag-escapes the given string.
 * 
 * @param s The string to escape.
 * @return The given string, with tag start/open characters escaped.
 */
function escapeTags(/*String*/ s) {
    s = replaceAll(s, "<", "&lt;");
    s = replaceAll(s, ">", "&gt;");
    return s;
}

/**
 * Returns the integer representation of the given value.
 * 
 * @param configuredValue A number or string which should translate to a positive int.
 * @return The int value of the given number or string. A negative return value indicates an error.
 */
function getLettersVal(/*Number or String*/ configuredValue) {
    return isNaN( parseInt(configuredValue) ) ? -1 : parseInt(configuredValue);
}

/**
 * Replaces all occurences of a needle in a haystack.
 *
 * @param haystack The string which may contain the needle.
 * @param needle The string to replace.
 * @param replacement The replacement string.
 * @return The given haystack string, with any and all occurences of the needle substituted with the replacement.
 * @see http://stackoverflow.com/a/1144788
 */
function replaceAll(/*String*/ haystack, /*String*/ needle, /*String*/ replacement) {
    return haystack.replace(new RegExp(escapeRegexPattern(needle), 'g'), replacement);
}

/**
 * Escapes the given string for regex reserved characters.
 *
 * @param str The (unescaped) regex pattern string.
 * @return The given regex pattern string, escaped and ready to use in regex.
 * @see http://stackoverflow.com/a/6969486
 */
function escapeRegexPattern(/*String*/ str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
	
/**
 * Gets an object property accessor, as defined by the given accessor 
 * definition. 
 * 
 * The definition must use a special syntax; Some examples (and the resulting 
 * return object):
 * 	 %(name)                        --> returns obj["name"]
 *	 %(type.id)                     --> returns ojb["type"]["id"]
 *	 %(item.image.uri)              --> returns obj["item"]["image"]["uri"]
 *	 %(item.names:name[lang=en])    --> see separate explanation further down
 *	 %(__function:foo)              --> returns the return value of foo(obj) (the function foo should be implemented in this file)
 *	 
 * Explained in an example JSON:
 * {
 *      id:1,
 *      name:"Coffee", --> %(name)
 *      type: {
 *          id:"345", --> %(type.id)
 *          name:"Beverages"
 *      },
 *      image: {
 *          uri:"/my/images/coffee.jpg", <-- %(item.image.uri)
 *          alt:"A cup of coffee.",
 *          mime:"image/jpeg"
 *      }
 * },
 * {
 *      id:2,
 *      name:"Tea", --> %(name)
 *      type: {
 *          id:"345", --> %(type.id)
 *          name:"Beverages"
 *      },
 *      image: {
 *          uri:"/my/images/tea.jpg", --> %(item.image.uri)
 *          alt:"A cup of tea.",
 *          mime:"image/jpeg"
 *      }
 * }
 *
 * Definitions like %(item.names:name[lang=en]), where "names" is an array of 
 * objects rather than a string, are handled separately.
 * 
 * The example notation would be interpreted as: Select "name" from a "names" 
 * object in "item" where the object's "lang" property is "en". 
 * 
 * Another one: %(links:href[rel=stylesheet]) => Select "href" from a "links" 
 * object where the object's "rel" property is "stylesheet".
 * 
 * Additional logic is applied (using underscore.js) for these rules.
 *
 * JSON examples:
 * {
 *      item : {
 *          names: [
 *          	{
 *                  name:"United Nations", --> %(item.names:name[lang=en]), because the object has lang:"en" (ref. next line)
 *                  lang:"en"
 *		},
 *		{
 *                  name:"Forente Nasjoner", --> NOT %(item.names:name[lang=en]), because the object does NOT have lang:"en" (ref. next line)
 *                  lang:"no"
 *		}
 *          ],
 *          id: 89efew89f-8f9df9-df89adf,
 *          type: 'org'
 *	},
 *	item: {
 *          ...
 *	}
 * }
 * ---------------------------------
 * {
 *	links: [
 *          {
 *              href:"http://www.site.com/mystyle.css", --> %(links:href[rel=stylesheet])
 *              rel:"stylesheet"
 *          },
 *          {
 *              href:"http://www.site.com/foo.html", --> NOT %(links:href[rel=stylesheet]) - but %(links:href[rel=self]) would match
 *              rel:"self"
 *          },
 *          {
 *              href:"http://www.site.com/bar.html", --> NOT %(links:href[rel=stylesheet]) - but %(links:href[rel=parent]) would match
 *              rel:"parent"
 *          }
 *	]
 * }
 *
 * @param obj The object to access.
 * @param accessorDefinition A string referencing a single property of the given object, e.g. "%(type.id)". If the referenced property is an array, conditional rules must be provided, e.g. "%(links:href[lang=en&rel=profile])".
 * @return Object The property accessor for the given object.
 */
function getObjectPropertyAccessor(/*Object*/ obj, /*String*/ accessorDefinition) {
	
    // Initialize an object as a copy of the given object
    var /*Object*/ tmp = obj;

    if (consoleDebugging) console.log('getObjectPropertyAccessor: Getting decoder for ' + accessorDefinition + ' ...');

    // Decode the given accessor definition into a "decoder" object. Example decoder object: { "%(type.id)" : ["type","id"] }
    var /*Object*/ decoder = getAccessorDefinitionDecoder(accessorDefinition);

    //if (consoleDebugging) console.log('getObjectPropertyAccessor: decoder is ' + JSON.stringify(decoder));

    // Get the decoder key:
    var /*Array*/ decoderKeys = Object.keys(decoder);
    if (decoderKeys.length > 1) {
            // Multiple keys implies more than one accessor definition in the accessorDefinition argument. (Bad usage of this method.)
            console.log('WARNING: Bad usage of getObjectPropertyAccessor(): Expected a single property accessor definition, but found multiple. Using the one first encountered.');
    }
    var /*String*/ decoderKey = decoderKeys[0]; // decoderKey will be e.g. %(label) or %(type.id)

    if (consoleDebugging) console.log('getObjectPropertyAccessor: Decoder key is "' + decoderKey + '".');

    if (decoderKey != undefined) {
        try {
            // Get the "property accessor tree" given in the definition; e.g. ["type", "id"] => corresponds to obj["type"]["id"]
            var /*Array*/ accessorTree = decoder[decoderKey];
            for (var i = 0; i < accessorTree.length; i++) {
                var accessor = accessorTree[i];
                var conditional = false;
                if (accessor.indexOf(':') > -1) {
                    
                    if (accessor.indexOf('__function:') === 0) {
                        // Function reference - call the function
                        var func = accessor.split(':')[1]; 
                        if (func.indexOf('[') === -1) {
                            return window[func](obj, null); // Call the function without the "extra parameters" string
                        }
                        else {
                            var funcName = func.substring(0, func.indexOf('['));
                            funcParamStr = func.substring(func.indexOf('[') + 1);
                            funcParamStr = funcParamStr.substring(0, funcParamStr.length - 1);
                            return window[funcName](obj, funcParamStr);
                        }
                    } else {
                        // Conditional accessor, e.g. 'links:href[rel=profile&lang=en]'
                        accessor = accessor.split(':')[0];
                        conditional = true;
                    }
                }

                var isArray = Array.isArray(tmp[accessor]); // Arrays need additional handling, and should always come with a conditional filter which will identify a SINGLE entry in the array

                //if (consoleDebugging) console.log('getObjectPropertyAccessor: tmpObj[' + accessor + '] is type "' + (typeof tmp[accessor]) + '" (array? ' + isArray + ') -- ' + JSON.stringify(tmp[accessor]));

                if (!isArray) {
                    // Update the object: 
                    // Assign it the "next" property accessor in the property accessor tree, thereby making the object equal to its own property.
                    // Example: Assuming accessorDefinition was "%(type.id)", the iterations of the for-loop will do this:
                    // 0: tmp = obj
                    // 1: tmp = obj["type"]
                    // 2: tmp = obj["type"]["id"]
                    tmp = tmp[ accessor ];

                } else {
                    // The current tmp "object" is in fact an array: 
                    // We're should now be handling a case of an 'advanced' key like '%(links:href)' '%(links:href[rel=profile&lang=en])', which is a prerequisite for extracting anything from an array
                    if (!conditional) {
                        console.log('ERROR: getObjectPropertyAccessor: Required conditional filter missing!');
                    } else {
                        if (consoleDebugging) console.log('getObjectPropertyAccessor: Applying conditional filter ...');
                    }
                    tmp = filter(tmp[accessor], accessorTree[i]); // Apply filter for conditional definition
                }


                //if (consoleDebugging) console.log("tmp[" + accessorTree[i] + "]: " + tmp);
            }
        } catch (err) {
        }
    }
    return tmp;
}

/**
 * Filters the given array of objects down to a single object, based on information in the 
 * given accessor definition, and returns the specified property of that single object.
 * 
 * NOTE: This method uses methods in underscore.js
 *
 * @param objArr The array of objects
 * @param accessorDefinition The accessor definition string. It should look something like f.ex.: 'links:href[rel=profile&hreflang=en]' or 'links:href'
 */
function filter(/*Array*/objArr, /*String*/accessorDefinition) {
    if (consoleDebugging) console.log('filter: Filtering invoked with accessor definition "' + accessorDefinition + '" ...');

    try {
        if (!Array.isArray(objArr)) {
            // Well that's no good - we only want an array of objects in here
            console.log('ERROR: filter: Cannot filter non-array object "' + JSON.stringify(objArr) + '".');
            return objArr;
        }

        var accessorDefParts = accessorDefinition.split(":");
        if (accessorDefParts.length <= 1) {
            // No colon (":") found in the definition (or nothing after it) - can't do anything, so just return the given array
            console.log('ERROR: filter: Giving up, required filtering rules not present in "' + accessorDefinition + '".');
            return objArr; 
        }

        var propertyIdentifierAndConditionals = accessorDefParts[1]; // propertyIdentifierAndConditionals = 'href[rel=profile&hreflang=en]'
        var parts = propertyIdentifierAndConditionals.split("["); // parts = ['href']['rel=profile&hreflang=en]']
        var propertyIdentifier = parts[0]; // propertyIdentifier = 'href'

        if (parts.length == 1) { 
            // No conditionals part - can't do anything if there are multiple objects in the array, so just return the first
            var firstMatch = _.find(objArr, function(obj) {
                return !(!(obj[propertyIdentifier]));
            });
            if (!firstMatch) { 
                if (consoleDebugging) console.log('WARNING: filter: Filtering with no conditionals in rule "' + accessorDefinition + '" returned no matches.');
                // nothing matched (firstMatch is 'undefined') - just return the given array of objects
                return objArr;
            } else {
                if (consoleDebugging) console.log('WARNING: filter: Filtering with no conditionals in rule"' + accessorDefinition + '", returning best guess "' + firstMatch[propertyIdentifier] + '".');
                return firstMatch[propertyIdentifier];
            }
        }

        // Separate conditionals in an array, e.g. conditionals = ['rel=profile']['hreflang=en']
        var conditionals = parts[1].substring(0, parts[1].length-1).split('&'); 

        if (consoleDebugging) console.log('filter: Applying filter using conditions "' + conditionals + '" ...');

        // Get filter for the conditionals, e.g. conditionalsMatcher: {"rel":"profile","hreflang":"en"}
        var conditionalsMatcher = getFilter(conditionals);

        // Filter out matches
        var matches = _.where(objArr, conditionalsMatcher);

        // Handle the resulting match object(s)
        if (matches.length > 0) {
            if (matches.length > 1) {
                // Multiple matches - not exactly what we want here ...
                console.log('WARNING: filter: Ambiguous filter conditionals resulted in multiple matches. Returning first match "' + matches[0][propertyIdentifier] + '" in ' + JSON.stringify(matches));
            } else {
                // Single match - that's what we want!
                if (consoleDebugging) console.log('filter: Returning unique match "' + matches[0][propertyIdentifier] + '" from ' + JSON.stringify(matches[0]));
            }
            return matches[0][propertyIdentifier];
        } else {
            // No matches at all - can't do anything, so just return the given array
            console.log('ERROR: filter: No matches for filter "' + accessorDefinition + '".');
            return objArr;
        }
    } catch (err) {
        console.log('ERROR: filter: An unexpected error occured when attempting to apply filter "' + accessorDefinition + '": ' + err);
        return objArr;
    }
}

/**
 * Gets a JSON object instance that holds information used for filtering.
 * 
 * Or, more generally: Converts the given array of strings (key/value pairs) 
 * into a JSON object.
 * 
 * @param conditionals An array of strings, each one a key/value pair like "key=value".
 * @return A "filter"; a JSONObject representation of the given string, e.g. { "key":"value" }
 */
function getFilter(/*String[]*/conditionals) {
    var filterMatcher = {};
    for (var i = 0; i < conditionals.length; i++) {
        var conditional = conditionals[i]; // conditional = "key=value"
        var keyval = conditional.split('='); // keyval[0] = "key", keyval[1] = "value"
        filterMatcher[keyval[0]] = keyval[1]; // filterMatcher = { "key":"value" }
    }
    if (consoleDebugging) console.log('getFilter: Returning filter object ' + JSON.stringify(filterMatcher));
    return filterMatcher;
}

/**
 * Gets a decoder object which maps accessor definitions (e.g. "%(type.id)") to an accessor 
 * array (e.g. ["type", "id"]). 
 *
 * The returned decoder can be used to translate accessor definitions to actual object 
 * accessors. (See getObjectPropertyAccessor(obj, accessorDefinition))
 * 
 * @param accessorDefinition The accessor definition string. May contain 0-n accessor definitions.
 * @return A "decoder" object, which maps accessor definitions - e.g. "%(type.id)" - to a property accessor array - e.g. ["type", "id"].
 */
function getAccessorDefinitionDecoder(/*String*/ accessorDefinition) {
    var /*Object*/ decoder = {};
    if (!accessorDefinition) // Undefined accessor definition
        return decoder

    var /*Array*/ defs = accessorDefinition.match(/%\([\w\.\:\[\]=&]+\)/g); // Find definitions; e.g. find "%(label)" and "%(type.id)" in "%(label) %(type.id)"

    if (defs != null) {
        for (var i = 0; i < defs.length; i++) {
            var /*String*/ def = defs[i].substring(2,defs[i].length-1); // E.g. extract the string "label" from the string "%(label)"
            // Split on dot (may not exist)
            var /*Array*/ defArr = def.split(".");
            // The key is the "accessor definition", e.g. "%(type.id)", the value is an accessor array, e.g. ["type", "id"]
            decoder[ defs[i] ] = defArr;
        }
    }
    if (consoleDebugging) console.log('getAccessorDefinitionDecoder: Returning new decoder ' + JSON.stringify(decoder));
    return decoder;
}

/**
 * Applies a widget template to an ojbect, returning a ready-to-use rendering 
 * of the object (as HTML).
 * 
 * @param obj The object holding all data for a single suggestion / info element, e.g. { id:'8f980sadf089df', title:'My title' }.
 * @param template The widget template for rendering the object, e.g. "<a>%(id)</a>".
 * @return The rendering of the given object, as HTML.
 */
function applyTemplate(/*Object*/ obj, /*String*/ template) {
    var /*Object*/ decoder = getAccessorDefinitionDecoder(template);
    var /*String*/ suggestion = template;

    var /*String[]*/ decoderKeys = Object.keys(decoder);
    if (consoleDebugging) console.log('applyTemplate: Object is ' + JSON.stringify(obj) + ', applying template "' + template + '" (' + decoderKeys.length + ' accessor definitions) ...');

    for (var i = 0; i < decoderKeys.length; i++) {
        var /*String*/ decoderKey = decoderKeys[i]; // decoderKey will be '%(jobtitle.no)',  '%(id)', or similar
        var decoderReplacement = getObjectPropertyAccessor(obj, decoderKey);
        suggestion = replaceAll(suggestion, decoderKey, decoderReplacement);
    }

    if (consoleDebugging) console.log('applyTemplate: Template applied! Returning html "' + suggestion + '".');

    return suggestion;
}

/**
 * Dedicated function for setting the service results object.
 * This function is vital if the array of results/matches is not the root of the service response.
 * Example of results array in the root: 
 * [
 *  {
 *      fname : "jack",
 *      lname:"black"
 *  },
 *  {
 *      fname : "john",
 *      lname:"brown"
 *  },
 *  {
 *      fname : "jane",
 *      lname:"white"
 *  }
 * ]
 *
 * Example of results array NOT in the root, but in the 'hits' property, which we'd define as '%(hits)': 
 *
 * {
 *	num_hits:3,
 *	query_time:0.004,
 *	hits :[
 *          {
 *              fname : "jack",
 *		lname:"black"
 *          },
 *          {
 *              fname : "john",
 *              lname:"brown"
 *          },
 *          {
 *              fname : "jane",
 *              lname:"white"
 *          }
 * 	]
 * }
 *
 * @param data The service response object.
 * @param serviceResultsIdentifier The identifier for the results inside the response object, e.g. %(hits) or %(feed.entries). Can be null / empty / undefined
 */
function setServiceResults(/*Object*/data, /*String*/serviceResultsIdentifier) {
    if (!serviceResultsIdentifier || serviceResultsIdentifier.length == 0)
        return data;

    try {
        var /*Object*/ tmp = data;
        var /*Object*/ decoder = getAccessorDefinitionDecoder(serviceResultsIdentifier);
        // Get the "property accessor tree" given in the definition; e.g. ["type", "id"] => corresponds to obj["type"]["id"]
        var /*Array*/ accessorTree = decoder[serviceResultsIdentifier];
        for (var i = 0; i < accessorTree.length; i++) {
            var /*String*/ accessor = accessorTree[i];
            if (consoleDebugging) console.log('setServiceResults: stepping down into "' + accessor + '" property of object.');
            tmp = tmp[accessor]; // Convert the object into a property of itself ("reduce" the object by "stepping down" into itself) - for more details, see getObjectPropertyAccessor() which is similar
        }	
        return tmp;
    } catch (err) {
        console.log('ERROR: setServiceResults: Unable to set the service results object: ' + err);
    }
    return data;
}


////////////////////////////////////////////////////////////////////////////////
//
//                          BELOW: Custom function example
//                          
////////////////////////////////////////////////////////////////////////////////

/**
 * Example function: Try applying %(__function:myAwesomeFunction) in a template. 
 * This will make the template call this function, and you should see the 
 * returned value in your widget area.
 * 
 * Have a look at your console (e.g. using Firebug or equivalent) while the 
 * widget is active.
 * 
 * In the real world, you would do something with the info provided by the given
 * object and possibly also the params string. For example, you could do an ajax 
 * request, fetching info related to the given object, using its ID. (Note that 
 * if using an ajax call, you should first create a container with a unique ID, 
 * and then update the contents of that container once the ajax call completes.)
 */
function myAwesomeFunction(/*Object*/obj, /*String*/params) {
    console.log('myAwesomeFunction: Current object is: ' + JSON.stringify(obj));
    console.log('myAwesomeFunction: params string is: "' + params + '"'); 
    return 'Awesome!'; // Will be injected anywhere %(__function:myAwesomeFunction) is used
}
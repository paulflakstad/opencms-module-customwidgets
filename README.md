# OpenCms module: Custom widgets

This module currently contains 1 custom widget; The **string suggest widget** – an OpenCms input widget that adds a suggest/autocomplete feature for backend string input fields. (Intended for structured content elements of type OpenCmsString.)

The widget is an abstraction layer on top of [jQuery UI's Autocomplete widget](http://jqueryui.com/autocomplete/). It leverages a little bit of [underscore.js](http://underscorejs.org/).

**(C) Paul-Inge Flakstad / Norwegian Polar Institute. This work is free. You can redistribute it and/or modify it, under the terms of the [WTFPL license version 2](http://www.wtfpl.net/).**

## On this page
- [How it works](#works-like-this)
- [Standalone mode](#standalone-mode-example)
- [Demo](#demo)
- [Installation](#installation)
- [Start using the widget](#start-using-the-widget)
- [Configuration / settings](#configuration)
  - [Basic selectors](#basic-selectors)
  - [Conditional selectors - picking from arrays](#conditional-selectors--picking-from-arrays)
  - [Dynamic values](#dynamic-values)
  - [Function-provided values](#function-provided-values)
- [Syntax and format](#syntax-and-format)
- [Author's notes](#authors-notes)

## Works like this

As the user types, the widget provides on-the-fly suggestions. Suggestions are fetched from an external source; a web service that accepts queries and responds in JSONP.

*If you need to use a data source that doesn't fit these requirements, consider writing a proxy. (An example proxy that wraps OpenCms site search should be included in the OpenCms module.) With a proxy for your CMS content, you can make your source as specific as you want to. This way, you can use the widget as an alternative tool to select images, files of a specific type, files with a specific property setting, etc. This can be useful especially when choosing resources from a large and/or unorganized set – like f.ex. if you have hundreds of images in one folder – and the default OpenCms tools are cumbersome to use.*

**Wanna kick the tyres?** Great! After installing, all you need to do is attach the widget to an OpenCmsString input field, and define the configuration, so that it knows where to retrieve and display suggestions. *Tip: You can use a publicly available service like the [iTunes search API](https://itunes.apple.com/search?term=metallica) or the included site search proxy as your data source.*

The data source, or “suggestions source”, is defined in the XSD where the widget is employed, as part of the widget’s configuration string. This makes the widget pluggable and interchangeable, and you can use it with a variety of data sources - only the configuration needs to change.

## Standalone mode (example)

The widget is not strongly tied to the OpenCms backend; it works just as well on any page that includes the required scripts and styles:
- jQuery UI styles `//ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/themes/smoothness/jquery-ui.css`
- jQuery `//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js`
- jQuery UI `//ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min.js`
- underscore.js `underscore-min.js`
- String suggest widget helpers `string-suggest-widget-helpers.js`
- String suggest widget `string-suggest-widget.js`

To enable suggestions on your input field, do this:
```javascript
setupSuggest(/*JSONObject*/ widgetSettings, /*Element*/ inputField, '');
```
### Example:
```javascript
$(document).ready(function() {
    // Append css and js files
	$('head').append('<link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/themes/smoothness/jquery-ui.min.css" type="text/css" />');
	$.getScript('//ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min.js', function() {
		$.getScript('/system/modules/no.npolar.opencms.widgets/resources/js/underscore.min.js', function() {
		    $.getScript('/system/modules/no.npolar.opencms.widgets/resources/js/string-suggest-widget-helpers.js', function() {
		        $.getScript('/system/modules/no.npolar.opencms.widgets/resources/js/string-suggest-widget.js', function() {
		        	var settings = {
						uri:"https://itunes.apple.com/search"
						,results:"%(results)"
						,extract:"%(trackId)"
						,pname_query:"term"
						,tpl_suggestion:"<a>%(trackName)<br><em>%(artistName) - %(collectionName)</em></a>"
						,tpl_info:"<div><img src=\"%(artworkUrl60)\" style=\"float:left; margin-right:1em;\" /> <p style=\"margin:0; padding:0 1em;\">%(trackName) (ID: %(trackId))<br><em>%(artistName) - %(collectionName)</em></p></div>"
						,letters:2
					};
		        	setupSuggest(JSON.stringify(settings), document.getElementById('input-search-itunes'), '');
	        	});
	    	});
    	});
	});
});
```

## Demo
A live-in-the-wild frontend example can be viewed at [Environmental Monitoring of Svalbard and Jan Mayen](http://www.mosj.no/en/). The data source here is the site search, which has been made "compliant" via a simple proxy.

## Installation

1. Install the OpenCms module `no.npolar.opencms.widgets`.
2. Update your OpenCms system by adding the following line in the `<widgets>` node in opencms-vfs.xml:
  
  ```xml
  <widget class="no.npolar.opencms.widgets.StringSuggestWidget" alias="StringSuggestWidget" />
  ```
3. Restart Tomcat. (Or redeploy the OpenCms webapp, or restart your non-Tomcat servlet container.)
4. Good to go!

### Module structure

Installing this module will create a folder `/system/modules/no.npolar.opencms.widgets/` containing all the module’s resources:
- `/lib` is for a .jar file with the necessary Java classes.
- `/resources` is for javascript and CSS files, inside the respective subfolders.
- `/tpl` is for widget templates. A sample template should be included.
- `/conf` is for widget configuration files. A sample configuration should be included.
- `/classes` is currently empty.

## Start using the widget

Business as usual – in the XSD, employ the widget to an element:

```xml
...
<xsd:element name=”MyElement” type=”OpenCmsString” />
...
<layout element=”MyElement” widget=”StringSuggestWidget” configuration=”...” />
...
```

## Configuration

When employing the widget in an XSD, configuration is always required.

*Note: All folder-relative URIs given in configuration settings are considered relative to the widget module’s `resources` folder: The path `folder/myfile.ext` is equivalent to `/system/modules/no.npolar.opencms.widgets/resources/folder/myfile.ext`.*

## Settings overview:

- `uri`

  Required. The service URI, not including query and callback parameters.
  
- `uri_unique`

  Optional. The URI to use for requesting a single unique entry from the service. This can be used to re-create the info box when re-editing a file that already has a previously stored value in the widget’s input field. The URI defined here needs to consist partially of that previously stored value. Use `%(value)` as a placeholder, indicating where to inject the stored value. E.g.: https://itunes.apple.com/search?term=%(value)
  
  *Do not use this setting in combination with `pname_unique`. (They are mutually exclusive.)*

- `extract`

  Required. The service response field that should be injected into the widget’s associated input field when the user selects a suggestion.
  
- `results`

  Required sometimes. The field in the service response that contains the query matches (the suggestions). Should be omitted if the array containing objects that are matches is at root level in the response. (Like the example response in “Syntax and format” below.)
  
- `pname_query`

  Required sometimes. The parameter name for the query. Defaults to “q”.
  
- `pname_unique`

  Optional. The parameter name for “unique queries” – that is, queries that should return only a single match. This can be used to populate the info box whenever a user edits a file containing a previously stored value in the widget’s input field. 
  
  *Don’t use this setting in combination with uri_unique. They are mutually exclusive.*
  
- `pname_callback`

  Optional. The parameter name used for adding the callback function name. Defaults to “callback”.
  
- `tpl_suggestion`

  Required. Template for rendering suggestions. (Described later.)
  
- `tpl_info`

  Optional. Template for rendering info boxes. (Described later.)
  
- `letters`

  Optional. How many letters to require before offering suggestions. Defaults to 3. 
  
- `events`

  Optional. Names of functions to bind to certain events. For now, supports only the “select” event, triggered when a suggestion is selected. **A function `foo` named here must in its implementation accept 2 arguments; `foo(/*Object*/event, /*Object*/suggestion)`**.

### Example 1: Widget configuration settings.
```
{
  uri: ‘http://api.service.com/person/?limit=30’,
  results: ‘%(feed.entries)’,
  extract: ‘%(email)’,
  pname_query: ‘q’,
  pname_unique: ‘q-email’,
  pname_callback: ‘callback’,
  tpl_suggestion: ‘<a>%(name)<br><em>%(jobtitle)</em></a>’,
  tpl_info: ‘<p><strong>%(name)</strong><br><em>%(jobtitle)</em></p>’,
  letters: 4
}
```

The configuration should be a JSON string. 

There are two approaches when adding configuration:

1. Define the settings inline, within the JSON string in the XSD.
2. Define the settings in a separate file, and reference this config file in the XSD.

Option 1 has some drawbacks; mainly the very length of the JSON string and the fact that the content must be XML-escaped.

### Example 2: Widget configuration in the XSD, using inline settings:
```xml
<layout element=”MyInput” widget=”StringSuggestWidget” configuration=”{ uri:‘http://api.service.com/person/?limit=30’,results:‘%(feed.entries)’,extract:‘%(email)’,tpl_suggestion:‘&lt;a&gt;%(name)&lt;br&gt;&lt;em&gt;%(jobtitle) &lt;/em&gt;&lt;/a&gt;’}” />
```

As you can see, this isn’t very readable. Option 2, using a separate config file, is clearly a better approach. 

### Example 3: Widget configuration in the XSD, using a settings file (recommended):

```xml
<layout element=”MyInput” widget=”StringSuggestWidget” configuration=”{conf_uri:‘conf/my-settings.conf’}” />
```

Here, we’ve simply provided a URI to a file containing all the widget settings. This makes for much easier management of both the XSD and the settings themselves, and this is the recommended way to insert settings.

The content of the settings file should look like the JSON in Example 1. (No XML-escaping needed.) 

Widget templates can also be defined using file references, like this:

```
tpl_suggestion: { uri:’wtpl/my-suggestions.tpl’ }
```

## Syntax and format
In this explanation, let’s assume the service responds with this JSON:
```
[
{
		“name”:”Jack Black”,
		“email”:”jack.black@site.com”,
		“jobtitle”:”Director”,
		“image”: {
			“uri”:”http://site.com/img/jack.jpg”
			“alt”:”Jack Black, Director of Company Inc.”
		},
		“links”: [{
			“lang”:”en”,
			“rel”:”profile”,
			“href”:”http://site.com/people/jack.black/”
		},
		{
			“lang”:”de”,
			“rel”:”profile”,
			“href”:”http://site.com/de/leute/jack.black/”
		}]
}, 
{
		“name”:”Jaclyn White”,
		“email”:”jaclyn.white@site.com”,
		“jobtitle”:”Manager”,
		“image”: {
			“uri”:”http://site.com/img/jaclyn.jpg”
			“alt”:”Jaclyn White, Manager of Company Inc.”
		},
		“links”: [{
			“lang”:”en”,
			“rel”:”profile”,
			“href”:”http://site.com/people/jaclyn.white/”
		},
		{
			“lang”:”de”,
			“rel”:”profile”,
			“href”:”http://site.com/de/leute/jaclyn.white/”
		}]
},
	...
]
```

This array of objects –  each object being a suggestion – is the result of a query. (Here, we can imagine e.g. that the user entered “jac” in the input field. The widget queried the service at http://api.service.com/?q=jac, and it replied with this JSON.)

To use the widget, we must be able to reference the data in this JSON. We need some selectors.

### Basic selectors

Identifies single fields, or object properties, in a non-ambiguous manner. 

For example, `%(email)` is a basic selector. It targets the field describing the e-mail address. Similarly, `%(image.uri)` targets the field describing the image URI.

Basic selectors are the most common ones, and the most reliable ones, but they cannot be used to identify stuff in arrays, like the profile URI. E.g.: The `%(links.href)` selector matches 2 properties (= ambiguous) in each object. So, for arrays, we need a way to be more specific. That’s where conditional selectors come into play. 

### Conditional selectors – picking from arrays

A conditional selector can be used to target a property of a specific object in an array of objects. 

The idea is that if we can safely assume that no objects are identical in *all of their properties*, we can single out one object by requiring certain values on its *set of properties*.

Let’s take the selector `%(links:href[lang=en&rel=profile])` and break it down. From left to right, it translates to: 

1. From the `links` array
2. select the `href` property from the object
  1. whose `lang` property is “en”, AND
  2. whose `rel` property is “profile”

2.1 and 2.2 are the "conditional statements". (2.2 could have been omitted here – 2.1 alone would have been sufficient – but is included to show the syntax whenever multiple conditional statements are needed.) They allow us to target single objects in the array.

Without conditional statements, we cannot target something in an array and expect anything good to come out of it. However, if the conditional statement is omitted, e.g. `%(links:href)`, then the selector will target the `href` property of the first object in the `links` array.

Lastly, conditional selectors should be used only as the last part of a selector. E.g.: `%(links:href[lang=en])` will work, but `%(links:href[lang=en].someproperty)` won’t work.

### Dynamic values

Dynamic values are used to create flexible selectors that uses information available in (or determined via) the resource being edited. Or by other means, like reading system information.

All dynamic value notations begin with a double underscore, followed by an uppercase identifier, followed (sometimes) by a parameter string wrapped in square braces.

Supported dynamic values:
- `__PROP[property-name]`
  Notation for a property value, as read from the resource being edited (possibly inherited).

  - `__PROP[locale]` => E.g.: “en”
  - `__PROP[collector.date]` => E.g.: “1415975400000”

- `__NOW[date-format]`

  Notation for a “current time” value, formatted using the given pattern (see java.text.SimpleDateFormat). “numeric” will produce a long representation.
  
  - `__NOW[yyyy]` => Current year, e.g. “2014”
  - `__NOW[numeric]` => Current time as numeric value (the long representation)

- `__SELF`
  Notation for the path to the resource being edited, e.g.: `/sites/mysite/my/file.html`.

- `__CONTENT_LOCALE`
  
  Shortcut for `__PROP[locale]` (described above).

#### Example usage:
- `%(links:href[lang=__PROP[locale])` will produce the selector:
  - `%(links:href[lang=en])` when editing resources with locale=en
  - `%(links:href[lang=de])` when editing resources with locale=de


### Function-provided values

A value can be provided by a custom javascript function, typically using the suggestion / info box object currently being processed to produce something useful.

Your custom function should take an object and a string as arguments, and return a string:

```javascript
function myFunction(/*Object*/currentObj, /*String*/params) {
    // do stuff
    return [a string];
}
```

Your function should always be added to the `custom-functions.js` file, located in the `js` folder, to avoid losing stuff in future module updates. (Updates will not affect this file.)

In your template, apply the function value: `%(__function:myFunction)`.

You can also pass an optional parameter string to the function, e.g.: `%(function:myFunction[lang=__PROP[locale]&foo=bar])`

#### Totally confused?

Included with the widget should be an example function that does some console logging before returning an arbitrary string. See bottom of `string-suggest-widget-helpers.js` and read the comments.
  
## Author's notes

I am no expert neither on javascript or custom widgets in OpenCms. **Expect the widget to be rough around the edges.**

Most notable potential issues:
- ADE (front-end editing) is not supported
- Localization is not supported
- Error handling and code optimization is lacking / incomplete

This widget was created for a specific use-case, but I have tried to make it flexible enough to be used elsewhere as well. Its flexibility remains untested in the wild though, and I'm sure the widget is lacking in options.

If you have suggestions for improvement, please let me know. :)

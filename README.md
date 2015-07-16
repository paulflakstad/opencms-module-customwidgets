# opencms-module-customwidgets

OpenCms module containing a custom widget: The **string suggest widget**, or StringSuggestWidget, a configurable autocomplete widget.

The StringSuggestWidget is a 3rd-party OpenCms widget that offers an autocomplete feature for input fields. Intended used on structured content elements of type OpenCmsString.

The widget was developed for the Norwegian Polar Institute.

## It works like this

As the user types, the widget provides on-the-fly suggestions, fetched from an external data source.

The external source should be a web service that accepts queries and responds in JSONP. If your data source does not provide this, consider writing a proxy. (See the example proxy included with the widget proxy - it wraps OpenCms search.) You can also test the widget using the [iTunes search API](https://itunes.apple.com/search?term=metallica).

The data source, or “suggestions source”, is defined in the XSD where the widget is employed, as part of the widget’s configuration string. This makes the widget pluggable and interchangeable, and you can use it with a variety of data sources – only the configuration needs to change.

## Installation

1. Install the OpenCms module no.npolar.opencms.widgets.
2. Update your OpenCms system by adding the following line in the `<widgets>` node in opencms-vfs.xml:
`<widget class="no.npolar.opencms.widgets.StringSuggestWidget" alias="StringSuggestWidget" />`
3. Restart Tomcat. (Or redeploy the OpenCms webapp, or restart your non-Tomcat servlet container.)
4. Good to go!

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

  Optional. The URI to use for requesting a single unique entry from the service. This can be used to re-create the info box when re-editing a file that already has a previously stored value in the widget’s input field. The URI defined here needs to consist partially of that previously stored value. Use %(value) as a placeholder, indicating where to inject the stored value. E.g.: https://itunes.apple.com/search?term=%(value)
  
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

1.	Define the settings inline, within the JSON string in the XSD.
2.	Define the settings in a separate file, and reference this config file in the XSD.

Option 1 has some drawbacks; mainly the very length of the JSON string and the fact that the content must be XML-escaped.

### Example 2: Widget configuration in the XSD, using inline settings:
```xml
<layout element=”MyInput” widget=”StringSuggestWidget” configuration=”{ uri:‘http://api.service.com/person/?limit=30’,results:‘%(feed.entries)’,extract:‘%(email)’,tpl_suggestion:‘&lt;a&gt;%(name)&lt;br&gt;&lt;em&gt;%(jobtitle) &lt;/em&gt;&lt;/a&gt;’}” />
```

As you can see, this isn’t very readable. Option 2, using a separate config file, is clearly a better approach. 

### Example 3: Widget configuration in the XSD, using a settings file:

```xml
<layout element=”MyInput” widget=”StringSuggestWidget” configuration=”{conf_uri:‘conf/my-settings.conf’}” />
```

Here, we’ve simply provided a URI to a file containing all the widget settings. This makes for much easier management of both the XSD and the settings themselves, and this is the recommended way to insert settings.

The content of the settings file should look like the JSON in Example 1. (No XML-escaping needed.) 

Widget templates can also be defined using file references, like this:
```
tpl_suggestion: { uri:’wtpl/my-suggestions.tpl’ }
```

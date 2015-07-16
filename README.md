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

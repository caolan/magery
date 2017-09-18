# Magery

Easy-to-use JavaScript templates that can work with server-side
rendering in any language.

Magery uses HTML5 templates and JSON data to patch the DOM and update
the page. On the server, these templates are simple enough to be
rendered without a JavaScript runtime. On the client, they can be used
to dynamically update the page in response to JavaScript events.

* [Aims](#aims)
* [Download](#download)
* Documentation
  - [Getting started](#getting-started)
  - [Attributes](#attributes)
  - [Tags](#tags)
  - [JavaScript API](#javascript-api)
  - [Server-side rendering](#server-side-rendering)
* [Examples](https://github.com/caolan/magery/tree/master/examples)
* [Test suite](https://caolan.github.io/magery/test/)
* [Benchmarks](https://caolan.github.io/magery/bench/)
* [Live editor](https://caolan.github.io/magery/editor/)

## Aims

* To make it easier to enhance your _multi-page_ website with JavaScript
* To work with your choice of back end language
* To use the latest DOM patching and state management techniques
* To be [relatively small](#file-size) so you can use it for little
  (or large) enhancements

I wrote this library to prove that you don't need a 'single page app'
to build great dynamic websites. If you're interested in the
motivations behind this framework, you might like to read
the [blog post][blog-post] that started it (Magery's syntax has since
been updated).

## Download

* [magery.js][magery-js] (development)
* [magery.min.js][magery-min-js] (production)

Include one of the above in your HTML:

```html
<script src="magery.min.js"></script>
```

### File size

While there are no doubt smaller libraries out there, Magery aims to
sit on the more lightweight end of the file size range. This is to
encourage its use for relatively small improvements to
server-generated pages.

A comparison with some popular minified production builds:

```
Angular v1.6.4:              ########################################  163 kb
React + React DOM v15.6.1:   #####################################     150 kb
jQuery v3.2.1:               #####################                      85 kb
jQuery (slim build) v3.2.1:  #################                          68 kb
Magery (2017-08-28):         ###                                        12 kb
```

## Getting started

Magery uses HTML5 templates to update the page:

```html
<h1 data-template="greeting">
  Hello, world!
</h1>
```

Each template is identified by its `data-template` attribute. The
template above is named `greeting`.

### Updating the page

To display the `greeting` template we need a HTML page to display it on:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>My App</title>
  </head>
  <body>
    <!-- target element -->
    <h1 id="hello"></h1>
    
    <!-- template -->
    <template class="magery-templates">
      <h1 data-template="greeting" id="hello">
        Hello, world!
      </h1>
    </template>

    <!-- patch the target using the template -->
    <script src="magery.min.js"></script>
    <script>
      var templates = Magery.compileTemplates('.magery-templates');
      var element = document.getElementById('hello');
      
      templates['greeting'].patch(element);
    </script>
  </body>
</html>
```

This page includes the `greeting` template, a target `<h1>` element
that gets patched using the template, and a script block which
compiles the template and calls `.patch()` on the target `<h1>`.

Open [this page][hello-world] in the browser and you should see
"Hello, world!" displayed in the `<h1>` tag.

### Providing data

You can pass JSON data into your templates to change what is
displayed. Properties of the data object can be rendered using `{{`
curly braces `}}`:

```html
<template class="magery-templates">
  <h1 data-template="greeting" id="hello">
    Hello, {{ name }}!
  </h1>
</template>
```

Your initial data can be provided as the second argument to `patch()`:

```javascript
templates['greeting'].patch(element, {name: 'galaxy'});
```

This will display "Hello, galaxy!". [View page][hello-galaxy].

### Attaching event handlers

After compiling a template, event handlers can be attached to the
template using `bind()`. Let's add a 'name' input to update our
greeting:

```html
<!-- target element -->
<div id="container"></div>

<!-- template -->
<template class="magery-templates">

  <div data-template="app" id="container">
    <h1>Hello, {{ name }}!</h1>
    <input type="text" value="{{ name }}" oninput="updateName(event)" />
  </div>
  
</template>
```

The value of the textbox is set to the current `name` (from the `data`
object), and when an `input` event occurs on the textbox, we're going
to call the `updateName()` handler with the event.

The `updateName()` function is attached to the template using `bind()`:

```javascript
var templates = document.compileTemplates(.'magery-templates');
var container = document.getElementById('container');
var data = {name: 'galaxy'};

templates['app'].bind({
  updateName: function (event) {
    // update the data object, then patch the page
    data.name = event.target.value;
    templates['app'].patch(container, data);
  }
});

// initial patch sets up event handlers
templates['app'].patch(container, data);
```

By calling `patch()`, the `updateName()` function causes the page to
dynamically update to match the new data. You can now type "universe"
into the textbox and see the welcome message update to "Hello,
universe!" as you type. [View page][hello-universe].

You now know how to use `compileTemplates()`, `bind()` and `patch()` -
which is the entirety of the Magery [JavaScript API](#javascript-api)!

Once you've had a look at the available
template [attributes](#attributes) and [tags](#tags), you should be
ready to try [server-side rendering](#server-side-rendering).

## Attributes

* [data-template](#data-template)
* [data-each](#data-each)
* [data-key](#data-key)
* [data-if](#data-if)
* [data-unless](#data-unless)
* [data-managed](#data-managed)
* [data-embed](#data-embed)

### `data-template`

This is how you define a template. A template name must consist only
of the lower-case letters `a-z` and `-`, so they can be used
as [component tags](#component-tags).

Once rendered, the name provided in the `data-template` attribute will
be added to the rendered element's `data-bind` attribute (for use
with [bindAll()](#binding-to-embedded-templates)).

#### Example use

Template:
``` html
<h1 data-template="hello">
  Hello, {{name}}!
</h1>
```

Data:
``` javascript
{name: "world"}
```

Result:
``` html
<h1 data-bind="hello">
  Hello, world!
</h1>
```

### `data-each`

Loop over an array, rendering the child elements with each item bound
to the given name. The value should be in the form `"item in array"`
where `item` is the name to use for the current item, and `array` is
the context property to iterate over.

#### Example use

Template:
```html
<ol>
  <li data-each="user in highscores">
    {{user.name}}: {{user.score}} points
  </li>
</ol>
```

Data:
```javascript
{
  highscores: [
    {name: 'popchop', score: 100},
    {name: 'fuzzable', score: 98},
    {name: 'deathmop', score: 72}
  ]
}
```

Result:
```html
<ol>
  <li>popchop: 100 points</li>
  <li>fuzzable: 98 points</li>
  <li>deathmop: 72 points</li>
</ol>
```

If possible, combine with a `data-key` property to uniquely idenfify
each item in a loop. This enables some optimisations when Magery
updates the DOM.

Template:
```html
<ul>
  <li data-each="item in basket" data-key="{{item.id}}">
    {{item.title}}
  </li>
</ul>
```

Data:
```javascript
{
  basket: [
    {id: 1000, title: 'jelly'},
    {id: 1001, title: 'custard'},
    {id: 1002, title: 'cake'}
  ]
}
```

Result:
```html
<ul>
  <li>jelly</li>
  <li>custard</li>
  <li>cake</li>
</ul>
```

### `data-key`

Helps Magery match up tags between page updates for improved
preformance. The value can use the normal property `{{` expansion `}}`
syntax and __must__ be unique within its parent element.

This attribute is particularly useful when combined with the
`data-each` attribute but it can be used elsewhere too. See the
[data-each](#data-each) examples for more information.

### `data-if`

Conditionally expands the element if a context property evaluates to
true. Note that an empty Array in Magery is considered `false`.

#### Example use

Template:
```html
<span data-if="article.published">
  Published: {{ article.pubDate }}
</span>
```

Data:
```javascript
{
  article: {
    published: true,
    pubDate: 'today'
  }
}
```

Result:
```html
<span>Published: today</span>
```

### `data-unless`

This is the compliment to [`data-if`](#data-if), and will display if
the property evaluates to false. Note that an empty Array in Magery is
considered `false`.

#### Example use

Template:
```html
<span data-unless="article.published">
  Draft
</span>
```

Data:
```javascript
{
  article: {
    published: false,
    pubDate: null
  }
}
```

Result:
```html
<span>Draft</span>
```

### `data-managed`

This attribute is for use with HTML form elements, and will force the
state of the element to match the template data.

By default, the value of text inputs, checkboxes, and other form
elements can be modified and cached by the browser (and so may not
match the rendered `value` attribute on the HTML element). By setting
`data-managed="true"` you can ensure the state of the form element
always matches your template data.

This is particularly useful for 'live' validation of inputs, or
clearing text boxes by setting the value attribute to empty.

__NOTE:__ If you use `data-managed` you *must* update the associated
data property for an input using the `oninput` event handler if you
want the user's input to be displayed.

#### Example

This input will only allow the user to enter digits (0-9).

Template:
```html
<form data-template="number-form">
  <input type="text" value="{{number}}" oninput="updateNumber(event)">
</form>
```

JavaScript:
``` javascript
templates['number-form'].bindAll({
  updateNumber: function (event) {
    if (/^[0-9]*$/.test(event.target.value) {
      this.data.number = event.target.value;
    }
  }
});
```

For a complete example,
see [examples/managed-text-input.html][managed-text-input].

### `data-embed`

This is only used for server-side rendering. Adding
`data-embed="true"` to an element will include the current context
data and template definition in the final output. A `data-context`
attribute will be added to the rendered element to contain the current
JSON context data. For more information see
the [server-side rendering](#server-side-rendering) section.

### Attribute processing order

It's possible to add multiple template attributes to a single element.
The attributes will be processed in the following order:

- `data-each`
- `data-if`
- `data-unless`
- `data-template`
- `data-key`

## Tags

* [template](#template)
* [template-children](#template-children)
* [component tags](#component-tags)

### `<template>`

This is just a standard HTML5 `<template>` element, but you may
encounter it while using Magery. When embedding templates, Magery will
include the definitions inside `<template class="magery-templates">`
tags so they can be easily found by `magery.compileTemplates()` later.

#### Example use

```html
<template class="magery-templates">
  <h1 data-template="greeting">Hello, world!</h1>
</template>
```

### `<template-children>`

Expands child nodes from the calling template, if any. Note: any child
nodes of this tag will be ignored.

#### Attributes

No attributes.

#### Example use

Template:
```html
<template class="magery-templates">

  <div data-template="article">
    <h1>{{ title }}</h1>
    <div class="main-content">
      <template-children />
    </div>
  </div>

  <div data-template="page">
    <article title="article.title">
      <p>{{ article.text }}</p>
    </article>
  </div>
  
</template>
```

Data:
```javascript
{
  article: {
    title: 'Guinea Pig Names',
    text: 'Popchop, Fuzzable, Deathmop'
  }
}
```

Result:
```html
<div data-bind="page">
  <div data-bind="article">
    <h1>Guinea Pig Names</h1>
    <div class="main-content">
      <p>Popchop, Fuzzable, Deathmop</p>
    </div>
  </div>
</div>
```

### Component tags

Templates can be rendered by other templates, using the template name
as a custom tag. For example, the following template:

``` html
<h1 data-template="hello">
  Hello, {{name}}!
</h1>
```

Could be rendered in another template by using the tag `<hello>`:

``` html
<hello name="user.name"></hello>
```

By adding attributes to your custom tag, you can include data from the
current context in the rendering context of the sub-template. In the
above example the data property `user.name` is set to `name` inside
the `hello` template.

## JavaScript API

### `Magery.compileTemplates(selector)`

Find and compile Magery templates in the current HTML document.

#### Arguments

* __selector__ - the CSS selector for a parent element which contains zero or more templates

#### Return value

Returns an object containing `Template` objects, keyed by template
name (taken from their `data-template` attributes).

#### Example

``` javascript
var templates = Magery.compileTemplates('.magery-templates');
var templates = Magery.compileTemplates('#myTemplates');
var templates = Magery.compileTemplates('template');

// access the returned Template() objects using template[name]
```

### `Template.bind(handlers)`

Attach event handlers to a template. The event handlers will not be
bound to existing DOM elements until `Template.patch()` is called.

#### Arguments

* __handlers__ - an object containing event handler functions keyed by name

#### Return value

Undefined.

#### Example

``` javascript
var data = {items: []};

templates[name].bind({
    updateCounter: function () {
        data.counter++;
    },
    removeItem: function (event, id) {
        data.items = items.filter(function (item) {
            return item.id !== id;
        });
    }
});
```

The arguments passed to event handler functions are dictated by the
`on*` attribute which triggers it:

``` html
<button onclick="updateCounter()">
  Add one
</button>

<ul data-each="item in items">
  <li id="{{ item.id }}">
    {{ item.name }}
    <button onclick="removeItem(event, item.id)">
      Remove
    </button>
  </li>
</ul>
```

The `event` argument (used with `removeItem()` above) is special, and
refers to the event which triggered the handler (which is how `on*`
attributes normally work in browsers).

### `Template.patch(element, next_data, [prev_data])`

Updates `element` to match the output of running the template with
`next_data` as it's context.

#### Arguments

* __element__ - The DOM element to be patched
* __next_data__ - The data to render the template with
* __prev_data__ - _(optional)_ - The data used for the last render,
  which can be used to optimise the patching process by skipping
  unchanged properties. Useful in conjunction with immutable data
  structures.
  
#### Return value

Undefined.

#### Example

``` javascript
var element = document.querySelector('#target');
var data = {name: 'test'};

templates['example'].patch(element, data);
```

## Server-side rendering

Magery has been designed to work with server-side rendering in any
language. If you'd like to create a new server-side library then you
can use the cross-platform [Magery test suite][testsuite] to get you
started. If it passes the tests, you can send a pull request to
include your library here.

### Languages

- Python - [python-magery](https://github.com/caolan/python-magery)

[magery-js]: https://raw.githubusercontent.com/caolan/magery/master/build/magery.js
[magery-min-js]: https://raw.githubusercontent.com/caolan/magery/master/build/magery.min.js
[hello-world]: https://caolan.github.io/magery/examples/hello-world.html
[hello-galaxy]: https://caolan.github.io/magery/examples/hello-galaxy.html
[hello-universe]: https://caolan.github.io/magery/examples/hello-universe.html
[managed-text-input]: https://caolan.github.io/magery/examples/managed-text-input.html
[blog-post]: https://caolan.org/posts/progressive_enhancement_and_modern_javascript.html
[python-example]: https://github.com/caolan/python-magery/tree/master/example
[testsuite]: https://github.com/caolan/magery-tests
[ci]: https://travis-ci.org/caolan/magery

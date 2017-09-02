# Magery

An easy-to-use JavaScript framework that can work with server-side
rendering in any language.

Magery uses HTML5 templates and JSON data to render the page. On the
server, these templates are simple enough to be rendered without a
JavaScript runtime. On the client, they can be used to dynamically
update the page simply by changing the JSON data.

* [Aims](#aims)
* [Download](#download)
* Documentation
  - [Getting started](#getting-started)
  - [Attributes](#attributes)
  - [Tags](#tags)
* [Examples](https://github.com/caolan/magery/tree/master/examples)
* [Test suite](https://caolan.github.io/magery/test/)
* [Benchmarks](https://caolan.github.io/magery/bench/)
* [Live editor](https://caolan.github.io/magery/editor/)

## Aims

* To make it easier to enhance your multi-page website with JavaScript
* To work with your choice of back end language
* To provide clean separation between your data and markup
* To be [relatively lightweight](#file-size) so you can use it for small
  (or large) enhancements without the commitment of a big dependency

I wrote this library to prove that you don't _need_ a 'single page
app' to build large dynamic websites. If you're interested in the
motivations behind this framework, you might like to read the [blog
post][blog-post] that started it (Magery's syntax has since been
updated).

## Download

* [magery.js][magery-js] (development)
* [magery.min.js][magery-min-js] (production)

Include one of the above in your HTML:

```html
<script src="magery.min.js"></script>
```

### File size

While there are smaller frameworks out there, Magery aims to sit on
the more lightweight end of the file size range. This is to encourage
it's use for relatively small improvements to server-generated pages.

A comparison of some minified production builds:

```
Angular v1.6.4:              ########################################  163 kb
React + React DOM v15.6.1:   #####################################     150 kb
jQuery v3.2.1:               #####################                      85 kb
jQuery (slim build) v3.2.1:  #################                          68 kb
Magery (2017-08-28):         ###                                        12 kb
```

## Getting started

Magery uses `<template>` tags containing HTML to update the page:

```html
<template>
  <h1 data-template="app">Hello, world!</h1>
</template>
```

Each template is identified by its `data-template` attribute. The
template above is "app".

### Render a template

To display the "app" template we need a HTML page:

```html
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="container"></div>

    <template>
      <h1 data-template="app">Hello, world!</h1>
    </template>

    <script src="magery.min.js"></script>
    <script>
      var templates = Magery.compileTemplates();
      templates['app'].bind('container', {}, {});
    </script>
  </body>
</html>
```

This page includes the template "app", a `<div>` container element
to render the template into, and a script block which binds the
"app" template to the container. Open [this page][hello-world] in
the browser and you should see "Hello, world!".

### Provide data

You can pass JSON data into your templates to change what is
displayed. Properties of the data object can then be rendered using
`{{` curly braces `}}`:

```html
<template>
  <h1 data-template="app">Hello, {{name}}!</h1>
</template>
```

Your initial data is the third parameter of `bind()`:

```javascript
var data = {name: "galaxy"};

templates['app'].bind('container', data, {});
```

This will display "Hello, galaxy!". [View page][hello-galaxy].

### Attach event handlers

Once bound using `bind()`, a template's data can be changed on the fly
by listening for events. Let's make our greeting message universal by
using a textbox to change the name:

```html
<template>
  <div data-template="app">
    <h1>Hello, {{name}}!</h1>
  
    <input type="text"
           value="{{name}}"
           oninput="updateName(event)" />
  </div>
</template>
```

The value of the textbox is set to the current `name`, and when an
`input` event occurs, we're going to call the `updateName()` function.
The 'updateName()' function goes in the final parameter to `bind()`:

```javascript
var data = {name: 'galaxy'};

templates['app'].bind('container', data, {
  updateName: function (event) {
    this.context.name = event.target.value;
  }
});
```

By modifying `this.context`, the `updateName()` function will cause
the page to update and display the new template data. You can now type
"universe" into the textbox and see the message update to "Hello,
universe!" as you type. [View page][hello-universe].

__You now know all the arguments to `bind()`__. Once you've had a look
at the available template [attributes](#attributes) and [tags](#tags),
you should be ready to get started.

## Attributes

* [data-each](#data-each)
* [data-key](#data-key)
* [data-if](#data-if)
* [data-unless](#data-unless)

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
syntax and __must__ be unique within it's parent element.

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

### Attribute processing order

It's possible to add multiple template attributes to a single element.
The attributes will be processed in the following order:

- `data-each`
- `data-if`
- `data-unless`
- `data-key`

## Tags

* [template](#template)
* [template-call](#template-call)
* [template-children](#template-children)
* template-embed

### `<template>`

This defines a new template. Each template **must** have an `id`
attribute to uniquely identify it. All other template tags can only be
used inside a `<template>` tag.

#### Attributes

* __id__ - uniquely identifies the template (required)

#### Example use

```html
<h1 data-template="greeting">Hello, world!</h1>
```

### `<template-call>`

Renders another named template in this position. Can also be used to
dynamically render a template based on context data (see 'dynamic'
example).

#### Attributes

* __template__ - the ID of the template to expand (required)
* ___(any other argument)___ - used to set context data for the new template

#### Example use

##### Static example

Template:
```html
<li data-template="score">{{ user.name }} - {{ user.score }}</li>

<ol data-template="highscores">
  <score data-each="user in users" user="user" />
</ol>
```

Data:
```javascript
{
  users: [
    {name: 'fuzzable', score: 100},
    {name: 'popchop', score: 99}
  ]
}
```

Result:
```html
<ol>
  <li>fuzzable - 100</li>
  <li>popchop - 100</li>
</ol>
```

### `<template-children>`

Expands child nodes from the calling `<template-call>` tag, if any.
Note: any child nodes of this tag will be ignored.

#### Attributes

No attributes.

#### Example use

Template:
```html
<template id="article">
  <h1>{{ title }}</h1>
  <div class="main-content">
    <template-children />
  </div>
</template>

<template id="page">
  <template-call template="article" title="article.title">
    <p>{{ article.text }}</p>
  </template-call>
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
<h1>Guinea Pig Names</h1>
<div class="main-content">
  <p>Popchop, Fuzzable, Deathmop</p>
</div>
```


[magery-js]: https://raw.githubusercontent.com/caolan/magery/master/build/magery.js
[magery-min-js]: https://raw.githubusercontent.com/caolan/magery/master/build/magery.min.js
[hello-world]: https://caolan.github.io/magery/examples/hello-world.html
[hello-galaxy]: https://caolan.github.io/magery/examples/hello-galaxy.html
[hello-universe]: https://caolan.github.io/magery/examples/hello-universe.html
[blog-post]: https://caolan.org/posts/progressive_enhancement_and_modern_javascript.html
[ci]: https://travis-ci.org/caolan/magery

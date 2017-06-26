# Magery

[![Build Status](https://travis-ci.org/caolan/magery.svg?branch=master)][ci]

I want to improve JavaScript development for 'traditional' multi-page
websites. This is the easiest JavaScript framework I can think of that
/could/ work with server-side rendering in any language.

## Download

* [magery.js][magery-js] (development)
* [magery.min.js][magery-min-js] (production)

Include one of the above in your HTML:

```html
<script src="magery.min.js"></script>
```

## Getting started

Magery uses `<template>` tags containing HTML to update the page:

```html
<template id="myApp">
  <h1>Hello, world!</h1>
</template>
```

Each template is identified by it's `id` attribute, the template above is "myApp".

### Render a template

To display the "myApp" template we need a HTML page:

```html
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="container"></div>

    <template id="myApp">
      <h1>Hello, world!</h1>
    </template>

    <script src="magery.min.js"></script>
    <script>
      Magery.bind('container', 'myApp', {}, {});
    </script>
  </body>
</html>
```

This page includes the template "myApp", a `<div>` container element to
render the template into, and a script block which binds the "myApp"
template to the container. Open this page in the browser and you
should see "Hello, world!".

### Using data

You can pass JSON data into your templates to change what is
displayed. Properties of the data object can be rendered using `{{`
curly braces `}}`:

```html
<template id="myApp">
  <h1>Hello, {{name}}!</h1>
</template>
```

```javascript
var data = {name: "galaxy"};
Magery.bind('container', 'myApp', data, {});
```

This will display "Hello, galaxy!".

### Live page updates

Once bound using `Magery.bind`, a template's data can be changed on
the fly by listening for events. Let's make our greeting universal
using a textbox to change the name:

```html
<template id="myApp">
  <h1>Hello, {{name}}!</h1>
  <input type="text" value="{{name}}" oninput="updateName(event)" />
</template>
```

The value of the textbox is set to the current value of `name`, and
when an `input` event occurs, we're going to call the `updateName`
function. This function goes in the final parameter to `Magery.bind`:

```javascript
var data = {name: 'galaxy'};

Magery.bind('container', 'myApp', data, {
  updateName: function (event) {
    this.context.name = event.target.value;
  }
});
```

You should now be able to type "universe" into the textbox and see the
displayed message update to "Hello, universe!".

Well done, you know now all the necessary JavaScript. Now you just
need to learn the remaining template tags.

## Template tags

### <template-each>


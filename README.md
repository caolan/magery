# Magery

[![Build Status](https://travis-ci.org/caolan/magery.svg?branch=master)][ci]

I want to improve JavaScript development for 'traditional' multi-page
websites. This is the easiest JavaScript framework I can think of that
_could_ work with server-side rendering in any language.

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

Each template is identified by it's `id` attribute. The template above
is "myApp".

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

This page includes the template "myApp", a `<div>` container element
to render the template into, and a script block which binds the
"myApp" template to the container. Open [this page][hello-world] in
the browser and you should see "Hello, world!".

### Provide data

You can pass JSON data into your templates to change what is
displayed. Properties of the data object can then be rendered using
`{{` curly braces `}}`:

```html
<template id="myApp">
  <h1>Hello, {{name}}!</h1>
</template>
```

Your initial data is the third parameter of `Magery.bind()`:

```javascript
var data = {name: "galaxy"};

Magery.bind('container', 'myApp', data, {});
```

This will display "Hello, galaxy!". [View page][hello-galaxy].

### Attach event handlers

Once bound using `Magery.bind()`, a template's data can be changed on
the fly by listening for events. Let's make our greeting message
universal by using a textbox to change the name:

```html
<template id="myApp">
  <h1>Hello, {{name}}!</h1>
  
  <input type="text"
         value="{{name}}"
         oninput="updateName(event)" />
</template>
```

The value of the textbox is set to the current `name`, and when an
`input` event occurs, we're going to call the `updateName()` function.
The 'updateName()' function goes in the final parameter to
`Magery.bind()`:

```javascript
var data = {name: 'galaxy'};

Magery.bind('container', 'myApp', data, {
  updateName: function (event) {
    this.context.name = event.target.value;
  }
});
```

By modifying `this.context`, the `updateName()` function will cause
the page to update and display the new template data. You can now type
"universe" into the textbox and see the message update to "Hello,
universe!" as you type. [View page][hello-universe].

__You now know all the arguments to `Magery.bind()`__ Next, take a look
at the other template tags.

## Template tags

* [template](#template)
* [template-each](#template-each)
* [template-if](#template-if)
* [template-unless](#template-unless)
* [template-call](#template-call)
* [template-children](#template-children)

### `<template>`

This defines a new template. Each template **must** have an `id`
attribute to uniquely identify it. All other template tags can only be
used inside a `<template>` tag.

#### Attributes

* __id__ - uniquely identifies the template (required)

#### Example use

```html
<template id="greeting">
  <h1>Hello, world!</h1>
</template>
```


### `<template-each>`

Loop over an array, rendering the child elements with each item bound
to the given name.

#### Attributes

* __name__ - the name to use for the current item (required)
* __in__ - the array to iterate over (required)
* __key__ - a property to identify the current item, *must* be unique (optional)

#### Example use

Template:
```html
<ol>
  <template-each name="user" in="highscores">
    <li>{{user.name}}: {{user.score}} points</li>
  </template-each>
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

If possible, use a `key` property to uniquely idenfify each item, it
enables some optimisations when Magery updates the DOM:

Template:
```html
<ul>
  <template-each name="item" in="basket" key="id">
    <li>{{item.title}}</li>
  </template-each>
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

[magery-js]: https://raw.githubusercontent.com/caolan/magery/master/build/magery.js
[magery-min-js]: https://raw.githubusercontent.com/caolan/magery/master/build/magery.min.js
[hello-world]: https://caolan.github.io/magery/examples/hello-world.html
[hello-galaxy]: https://caolan.github.io/magery/examples/hello-galaxy.html
[hello-universe]: https://caolan.github.io/magery/examples/hello-universe.html
[ci]: https://travis-ci.org/caolan/magery
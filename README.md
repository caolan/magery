# Magery

[![Build Status](https://travis-ci.org/caolan/magery.svg?branch=master)](https://travis-ci.org/caolan/magery)

Easy-to-use JavaScript templates that can work with server-side
rendering in any language.

- [Aims](#aims)
- [Download](#download)
- [Example](#example)
- [Template syntax](#template-syntax)
  - [Variables](#variables)
  - [Booleans](#booleans)
  - [Attributes](#attributes)
    - [data-template](#data-template)
    - [data-each](#data-each)
    - [data-key](#data-key)
    - [data-if](#data-if)
    - [data-unless](#data-unless)
    - [data-embed](#data-embed)
    - [Processing order](#processing-order)
  - [Tags](#tags)
    - [template-children](#template-children)
    - [Components](#components)
  - [Events](#events)
- [API](#api)
  - [Magery.compile](#magerycompiletarget)
  - [Magery.patch](#magerypatch)
  - [Template.bind](#templatebindhandlers)
- [State management](#state-management)
- [Server-side rendering](#server-side-rendering)
- [Tests](#tests)
- [Benchmarks](#benchmarks)
- [Live editor](#live-editor)

## Aims

- To make enhancing your *multi-page* website with JavaScript easier
- To work with your choice of back end language
- To integrate with existing components when necessary
- To be [relatively small](#file-size) so you can use it for little
  (and large) enhancements

I wrote this library to prove that you don't need a 'single page app'
to build great dynamic websites. Often the best user experience is a
multi-page website with thoughtful JavaScript enhancements. Today,
these enhancements come with a cost: the almost-inevitable tangle of
jQuery that accompanies them. Magery is an attempt to fix this using
shared templates to dynamically update the page.

## Download

- [magery.js](https://raw.githubusercontent.com/caolan/magery/master/build/magery.js) (development)
- [magery.min.js](https://raw.githubusercontent.com/caolan/magery/master/build/magery.min.js) (production)

### File size

While there are no doubt smaller libraries out there, Magery is
positioned on the more lightweight end of the spectrum. This is to
encourage its use for relatively small improvements to
server-generated pages.

A comparison with some popular minified production builds:

    Angular v1.6.4:              ########################################  163 kb
    React + React DOM v15.6.1:   #####################################     150 kb
    jQuery v3.2.1:               #####################                      85 kb
    jQuery (slim build) v3.2.1:  #################                          68 kb
    Magery (2017-08-28):         ###                                        12 kb

## Example

Components in Magery use custom HTML5 tags defined by templates:

``` html
<template data-tagname="my-greeting">
  Hello, {{ name }}!
</template>
```

These templates can be rendered by your server, or compiled with JavaScript and used to dynamically update the page:

``` javascript
var components = Magery.compile('template');

components['my-greeting](target, {
    name: 'world'
});
```

Here's a full example:

``` html
<!DOCTYPE html>
<html>
  <head>
    <title>Example</title>
    <meta charset="utf-8">
  </head>
  <body>
    <!-- target -->
    <my-greeting></my-greeting>

    <!-- templates -->
    <template data-tagname="my-greeting">
      Hello, {{ name }}!
    </template>

    <!-- javascript -->
    <script src="../build/magery.min.js"></script>
    <script>
    
      var components = Magery.compile('template');
      console.log(components);
      var target = document.getElementsByTagName('my-greeting')[0];
      var data = {"name": "world"};

      components['my-greeting'](target, data);
      
    </script>
  </body>
</html>
```

You also can [view this example in the browser](https://caolan.github.io/magery/examples/example.html), or see the [other
examples](examples).

## Template syntax

### Variables

You can pass JSON data
to [Magery.patch()](#magerypatchtemplates-name-data-target) as a
context for your templates. Properties of the context object can be
inserted into the page using `{{` double curly braces `}}`:

``` html
<h1 data-template="greeting">
  Hello, {{ name }}!
  <img src="{{ avatar_url }}" alt="{{ name }}'s avatar">
</h1>
```

Variables can be expanded in both attributes and text. The inserted
values are escaped so it is not possible to insert raw HTML into the
page.

### Booleans

Some attributes do not hold values and are either on/off depending on
their presence. The `checked` attribute is a good example:

``` html
<input type="checkbox" checked>
```

For convenience, Magery allows you to use a variable, and will only
insert the attribute if the variable is *truthy* (i.e. not `0`,
`false`, `null`, `undefined` or `[]`).

``` html
<input type="checkbox" checked="{{ recurring_order }}">
```

### Attributes

#### data-template

This is how you define a template. A template name must consist only
of the lower-case letters `a-z` and `-`, so they can be used as
[component tags](#components).
    
Once rendered, the name provided in the `data-template` attribute will
be added to the rendered element's `data-bind` attribute (this is
useful when trying to match components rendered on the server).
    
##### Example use
    
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

#### data-each

Loop over an array, rendering the current element for each item in the
array. This attribute's value should be in the form `"item in array"`
where `item` is the name to use for the current item being rendered,
and `array` is the context property to iterate over.
    
##### Example use
    
Template:
``` html
<ol>
  <li data-each="user in highscores">
    {{ user.name }}: {{ user.score }} points
  </li>
</ol>
```
        
Data:
``` javascript
{
  highscores: [
    {name: 'popchop', score: 100},
    {name: 'fuzzable', score: 98},
    {name: 'deathmop', score: 72}
  ]
}
```
        
Result:

``` html
<ol>
  <li>popchop: 100 points</li>
  <li>fuzzable: 98 points</li>
  <li>deathmop: 72 points</li>
</ol>
```
        
If possible, combine `data-each` with a `data-key` attribute to
uniquely identify each element in the loop. This enables Magery to
more efficiently patch the DOM.
        
Template:

``` html
<ul>
  <li data-each="item in basket" data-key="{{ item.id }}">
    {{ item.title }}
  </li>
</ul>
```

Data:

``` javascript
{
  basket: [
    {id: 1000, title: 'jelly'},
    {id: 1001, title: 'custard'},
    {id: 1002, title: 'cake'}
  ]
}
```
        
Result:

``` html
<ul>
  <li>jelly</li>
  <li>custard</li>
  <li>cake</li>
</ul>
```

#### data-key

Helps Magery match up elements between page updates for improved
performance. The attribute can use the normal variable `{{` expansion
`}}` syntax and its value <span class="underline">must</span> be
unique within the parent element.
    
This attribute is particularly useful when combined with the
`data-each` attribute but it can be used elsewhere too. See
the [data-each](#data-each) examples for more information.

#### data-if

Conditionally expands the element if a context property evaluates to
true. Note that an empty Array in Magery is considered false.
    
##### Example use
    
Template:
``` html
<span data-if="article.published">
  Published: {{ article.pubDate }}
</span>
```
        
Data:
``` javascript
{
  article: {
    published: true,
    pubDate: 'today'
  }
}
```
        
Result:

``` html
<span>Published: today</span>
```

#### data-unless

This is the compliment to [data-if](#data-if), and will display the
element only if the property evaluates to false. Note that an empty
Array in Magery is considered false.
    
##### Example use
    
Template:

``` html
<span data-unless="article.published">
  Draft
</span>
```

Data:

``` javascript
{
  article: {
    published: false,
    pubDate: null
  }
}
```
        
Result:

``` html
<span>Draft</span>
```

#### data-embed

This is only used during server-side rendering. Adding a `data-embed`
property to an element will include data from the current context in
the output. A `data-context` attribute is added to the element
containing JSON encoded context data.

See [server-side rendering](#server-side-rendering).

#### Processing order

It is possible to add multiple template attributes to a single
element, though not all combinations make sense. The attributes will
be processed in the following order:
    
- `data-each`
- `data-if`
- `data-unless`
- `data-key`

That means you can use the _current_ item in a `data-each` loop inside
the value of a `data-if`, `data-unless` or `data-key` attribute.

You can also use these attributes when calling another template:

``` html
<div data-template="top-articles">
  <my-article data-each="article in articles"></my-article>
</div>
```

And you can use these attributes on the template definition itself:

``` html
<div data-template="my-article" data-if="article.published">
  <h1>{{ article.title }}</h1>
</div>
```

### Tags

#### template-children

Expands child nodes from the calling template, if any were provided.
Note: any child nodes or attributes on this tag will be ignored.
    
##### Example use
    
Template:

``` html
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

``` javascript
{
  article: {
    title: 'Guinea Pig Names',
    text: 'Popchop, Fuzzable, Deathmop'
  }
}
```
        
Result:

``` html
<div data-bind="page">
  <div data-bind="article">
    <h1>Guinea Pig Names</h1>
    <div class="main-content">
      <p>Popchop, Fuzzable, Deathmop</p>
    </div>
  </div>
</div>
```

#### template-embed

Only used during server-side rendering, ignored
during [Magery.patch()](#magerypatchtemplates-name-data-target).
Embeds a template definition in the output. By default it wraps the
definition in a `<template>` tag.

##### Example use

Template:

``` html
<ul data-template="tags">
  <li data-each="tag in tags">{{ tag }}</li>
</ul>

<div data-template="page">
  <h1>{{ title }}</h1>
  <template-embed name="tags"></template-embed>
</div>
```

Data:

``` javascript
{
  "title": "Example, 
  "tags": ["foo", "bar"]
}
```

Result:

``` html
<div data-bind="page">
  <h1>Example</h1>
  <template class="magery-templates">
    <ul data-template="tags">
      <li data-each="tag in tags">{{ tag }}</li>
    </ul>
  </template>
</div>
```

#### Components

Templates can be rendered by other templates as components. To do
this, simply use the template name as a custom tag. For example, the
following template:

``` html
<h1 data-template="hello">
  Hello, {{name}}!
</h1>
```

Could be rendered elsewhere using the tag \`<hello>\`:

``` html
<hello name="{{ user.name }}"></hello>
```

By adding attributes to your custom tag, you can pass data to the
sub-template. In the above example the context property `user.name` is
bound to `name` inside the `hello` template.
    
It is also possible to provide literal string values as context data:

``` html
<hello name="world"></hello>
```

    
These literals can also be useful for configuring generic event
handlers (e.g. by providing a target URL to POST data to).

### Events

Listeners can be attached to elements using the `on*` attributes (e.g.
`onclick`). Although the templates use the attribute syntax, the event
handlers will in reality be attached using `addEventListener()`:

``` html
<div data-template="example">
  <p>{{ counter.name }}: {{ counter.value }}</p>
  <button onclick="incrementCounter(counter)">
    Increment
  </button>
</div>
```

You can pass values in the current template context to the event
handler as arguments. You can also pass the event object itself by
using the special `event` argument:

``` html
<input type="text" oninput="updateField(name, event)">
```

The handler name (e.g. `updateField` above) is matched against the
current template's bound event handlers. These functions can be bound
to a template using [Template.bind()](#templatebindhandlers).

#### Example

``` html
<!DOCTYPE html>
<html>
  <head>
    <title>Events</title>
    <meta charset="utf-8">
  </head>
  <body>
    <template class="magery-templates">

      <div data-template="hello">
        <button onclick="sayHello(name)">click me</button>
      </div>
        
    </template>
        
    <div id="example"></div>

    <script src="../build/magery.min.js"></script>
    <script>

      var templates = Magery.compile('.magery-templates');
      var element = document.getElementById('example');

      var data = {
        name: 'testing'
      };

      // add handlers to template
      templates['hello'].bind({
        sayHello: function (name) {
          alert('Hello, ' + name + '!');
        }
      });

      // events are bound on first patch
      Magery.patch(templates, 'hello', data, element);

    </script>
  </body>
</html>
```

[View this in your browser](https://caolan.github.io/magery/examples/events.html),
or see the [examples](examples) directory for other ways to use
events.

## API

### Magery.compile(target)

Find and compile Magery templates in the current HTML document.

#### Arguments

- **target** - a DOM element, or the CSS selector for elements,
  containing zero or more templates

#### Return value

Returns an object containing `Template` objects, keyed by template
name (taken from their `data-template` attributes).

#### Example

``` javascript
var templates = Magery.compile('.magery-templates');
var templates = Magery.compile('#myTemplates');
var templates = Magery.compile('template');

var node = document.getElementById('#myTemplates'));
var templates = Magery.compile(node);
        
// access the returned Template() objects using template[name]
```

### Magery.patch(templates, name, data, target)

Updates a `target` element to match the output of running the template
with `name` from `templates` using `data` as it's context data.

#### Arguments

- **templates** - An object containing Magery.Template() objects keyed
  by template name
- **name** - The name of the template in `templates` to render
- **data** - The data to pass to the template
- **target** - The DOM element to update

#### Return value

Undefined.

#### Example

``` javascript
var element = document.querySelector('#target');
var data = {name: 'test'};
        
Magery.patch(templates, 'example', data, element);
```

### Template.bind(handlers)

Attach event handlers to a template. The event handlers will not be
bound to existing DOM elements
until [Magery.patch()](#magerypatchtemplates-name-data-target) is
called.

#### Arguments

- **handlers** - an object containing event handler functions keyed by
  name

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
`on*` attribute which triggers it. See the [Events](#events) section
for more details.

## State management

Magery only handles updating the DOM and binding event handlers.
Deciding when to update the page and managing your application's state
is up to you. Thankfully, Magery works well with many popular state
management libraries available from the React ecosystem.

Here's an example using [Redux.js](http://redux.js.org/):

``` html
<!DOCTYPE html>
<html>
  <head>
      <title>Redux example</title>
      <meta charset="utf-8">
  </head>
  <body>
      <!-- target element -->
      <div id="counter"></div>
      
      <!-- our templates -->
      <template class="magery-templates">
          <div data-template="counter">
              <p>
                  Clicked: <span id="value">{{ count }}</span> times
                  <button onclick="increment()">+</button>
                  <button onclick="decrement()">-</button>
              </p>
          </div>
      </template>

      <!-- dependencies -->
      <script src="./redux.min.js"></script>
      <script src="../build/magery.js"></script>
      
      <!-- application code -->
      <script>
       var templates = Magery.compile('.magery-templates');
       
       // create a store
       var store = Redux.createStore(function (state, action) {
           if (typeof state === 'undefined') {
               return {count: 0};
           }
           switch (action.type) {
               case 'INCREMENT':
                   return {count: state.count + 1};
               case 'DECREMENT':
                   return {count: state.count - 1};
               default:
                   return state;
           }
       });
       
       var target = document.getElementById('counter');
       
       function render() {
           Magery.patch(templates, 'counter', store.getState(), target);
       }
       
       // add event handlers using Magery
       templates['counter'].bind({
           increment: function () {
               store.dispatch({type: 'INCREMENT'});
           },
           decrement: function () {
               store.dispatch({type: 'DECREMENT'});
           }
       });
       
       // update the page when the store changes
       store.subscribe(render);
       
       // initial render
       render();
      </script>
  </body>
</html>
```

Now, you can benefit from the extensive [ecosystem](http://redux.js.org/docs/introduction/Ecosystem.html) and [dev tools](https://github.com/zalmoxisus/redux-devtools-extension) built around Redux.

## Server-side rendering

Magery has been designed to work with server-side rendering in any
language. If you'd like to create a new server-side library then you
can use the cross-platform [Magery test suite](https://github.com/caolan/magery-tests) to get you started. If
your library passes the tests, you can send a pull request to include
it here.

- [python-magery](https://github.com/caolan/python-magery)

## Tests

You can [run the current test suite](https://caolan.github.io/magery/test/) 
in your browser. Please report any failures as GitHub issues and be sure
to state the browser version and operating system you're running on.

If you're working on the Magery source code, you can run these tests
by executing `npm run build-test` and then visiting `test/index.html`
in your browser. Or, you can run `npm test` to use a headless browser
([slimerjs](http://slimerjs.org)) and see test results in your
console. For this to work you'll need to install xvfb:

    sudo apt-get install xvfb
    
If you're not on Linux then you may need to run slimerjs directly
without xvfb (just remove `xvfb-run` from the test script line in
`package.json`). Running without xvfb means you'll see a small
slimerjs window temporarily pop up.

## Benchmarks

You can [run the current benchmarks](https://caolan.github.io/magery/bench/)
in your browser. They're very simple tests of performance so don't read 
too much into them.

## Live editor

This allows you to play around with Magery syntax without installing
it, and immediately see the results in your browser.

[Open the editor](https://caolan.github.io/magery/editor/)

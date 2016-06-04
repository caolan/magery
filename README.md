# Magery.js

_**NOTE:** This project is **experimental** - do not expect full
browser compatibility, bug-free operation or stable APIs. The current
code is to prompt discussion. Your ideas and questions are very
welcome, just open an issue._

Templates for progressive enhancement: blends server-side
rendering with incremental DOM updates.

Magery aims to discover ways to improve
JavaScript development on traditional multi-page websites.
The plan is to create a shared template syntax that can be ported to
server-side languages but still allow for easy DOM patching on the
client, including a way to listen for events that is
less-closely tied to a page's HTML structure.

This is the client-side part - a library which can patch the DOM using
a shared Magery template. A multi-page site using Magery.js should be
able to remove jQuery as a dependency, spend less time manually
plumbing together events and DOM updates, and avoid conflicting
client/server opinions on correct page structure. Magery can be used with
other tools like [Redux][redux].

## Download

* [magery.js][magery-js] (development)
* [magery.min.js][magery-min-js] (production)

Include one of the above in your HTML:

```html
<script src="magery.min.js"></script>
```

## Demo

Once you have a feel for the syntax, you can try out Magery using the
[live editor][live-editor].

## Basic syntax

Magery templates use regular HTML with embedded template tags. The
syntax is similar to [Handlebars][handlebars] but restricted to basic
expressions which make incremental patching and porting to server-side
languages easier.

```html
{{#define main}}
  <div class="article">
    <h1>{{title}}</h1>
  </div>
{{/define}}
```

A template expression is contained within double curly-braces: `{{`
and `}}`. Block expressions (containing other tags or expressions)
open with `{{#...}}` and close with `{{/...}}`. It's also possible to
have a self-closing block tag (much like HTML tags): e.g. `{{#block /}}`.

Above, the `define` block creates a template called `main`. Using
`define` blocks, multiple templates can be safely concatenated and
loaded from a single file.

To produce HTML, the above template is combined with JSON data:

```json
{"title": "Example"}
```

Results in:

```html
<div class="article">
  <h1>Example</h1>
</div>
```

### Caveats

Template tags must sit properly in the HTML tree structure. This is
because internally the templates are represented on the client as
HTML nodes, which makes diffing and patching easier.

Most of the time this is natural, but occasionally you have to
be a bit more verbose:

#### Invalid

```html
<button {{#if submitted}}disabled{{/if}}>Go!</button>
```

#### Valid

```html
{{#if submitted}}
  <button disabled>Go!</button>
{{else}}
  <button>Go!</button>
{{/if}}
```

### Delivering to the browser

How you deliver a template to the browser will depend on your
server configuration and preferences. You might choose to bundle templates
with your JavaScript, embed them in the page, load from a
concatenated file, or request templates on-demand via AJAX.

To experiment quickly, we'll be defining our examples
inside HTML5 template tags:

```html
<template id="templates">
  {{#define main}}
    <div class="article">
      <h1>{{title}}</h1>
    </div>
  {{/define}}
</template>
```

The template tag is not rendered when the page loads and serves as a
useful container for client-side content. Alternatively, you could use a
script tag with a `type="text/x-magery-template"` attribute.

### Loading templates

To load templates in JavaScript, use `Magery.loadTemplates`:

```javascript
var source = document.getElementById("templates").innerHTML;
var templates = Magery.loadTemplates(source);
```

This returns an object containing all template definitions in the
source string, each keyed by template name. You shouldn't need to do
anything with this object beyond providing it as an argument to `patch`.

### Patching

When rendering a template, Magery.js will diff the page in order to
minimize DOM updates and keep elements stable. This provides a nice
experience for the user (as form elements won't be re-rendered clearing
input data) and reasonably fast page updates.

```javascript
Magery.patch(templates, 'main', container, data);
```

#### Patch with immutable data

If you're using an immutable data structure (like
[Copy Kitten][copy-kitten]), you can pass the previous data as the
optional last argument. This will be used to intelligently skip over
sections of the DOM for which the context data is unchanged:

```javascript
Magery.patch(templates, template_name, container, data, prev_data);
```

### Events

You can bind event listeners to elements by using `on*` attributes.

```html
<template id="templates">
  {{#define main}}
    <ul>
      {{#each timestamps}}
        <li>{{secs}}</li>
      {{/each}}
    </ul>
    <button onclick="addTime">Add</button>
  {{/define}}
</template>
```

Magery will use `addEventListener` to re-bind the `onclick` event, and
expose it via the container element. These
events can be handled directly on the container by adding a `dispatch`
function. Each event passed to `dispatch` will also get a reference to
its context in the template.

```javascript
container.dispatch = function (name, event, context, path) {
    if (name === 'addTime') {
        var secs = new Date().getTime();
        context.timestamps.push({secs: secs});
    }
};
```

The dispatch handler accepts four arguments, usually you'll just use
the first three.

* __name__ - the event name provided to the `on*` attribute,
  e.g. `addTime`
* __event__ - the original browser event that triggered this call
* __context__ - the template context at the point the handler is bound
  (e.g. inside an each block it would be a reference to the current
  item)
* __path__ - an array of property names which describes the current
  context value's location in the original data object.
  For example `["items", 0]` would be equivalent to `data.items[0]`.
  When using an each block with a key, an entry in the path may
  take the form: `{key: 123, property: 'id'}` which in this case would
  require scanning through the array for `id=123` to find the correct
  item.

## Template Tags

#### define

Creates a named template. Define blocks must only exist at the
top-level of a template file (no other top-level elements are valid).
Multiple define blocks may exist in a single file.

```html
{{#define example}}
  ...
{{/define}}
```

#### with

Specifies template context. This can be useful when referring to
nested properties. Accepts one argument: the property to use as the
new context. Being as specific as possible with context can help
Magery skip over unchanged blocks (when using immutable data structures
with `patch`).

```json
{"article": {"title": "Example"}}
```

```html
{{#with article}}
  <h1>{{title}}</h1>
{{/with}}
```

#### each

Iterates over an array, rendering the contents of the each block for
every item.

```json
{
    "items": [
        {"name": "one"},
        {"name": "two"},
        {"name": "three"}
    ]
}
```

```html
<ul>
  {{#each items}}
    <li>{{name}}</li>
  {{/each}}
</ul>
```

To reduce unnecessary DOM updates, you should use an `each` block with
a `key` argument wherever possible. The key should be a property for
which the value will uniquely identify the item in the array.

```html
<ul>
  {{#each items key=name}}
    <li>{{name}}</li>
  {{/each}}
</ul>
```

Each blocks also accept an `{{else}}` clause, rendered when the array
is empty or the property is missing. The `else` template tag must sit
at the same level in the tree as the opening and closing `if` template
tags.

```json
{"items": []}
```

```html
{{#each items}}
  <section>{{name}}</section>
{{else}}
  <p>No items</p>
{{/each}}
```

#### if

Renders it's contents if the named property is truthy (i.e. __not__
false, empty array, empty string, zero or undefined).

```json
{"published": true}
```

```html
{{#if published}}
  <strong>Public</strong>
{{/if}}
```

If blocks also accept an `{{else}}` clause. The `else` template tag
must sit at the same level in the tree as the opening and closing `if`
template tags.

```json
{"published": false}
```

```html
{{#if published}}
  <strong>Public</strong>
{{else}}
  <span>Private</span>
{{/if}}
```

#### unless

Renders it's contents if the named property is falsy (i.e. false,
empty array, empty string, zero or undefined).

```json
{"published": false}
```

```html
{{#unless published}}
  <strong>Private</strong>
{{/if}}
```

Unless blocks also accept an `{{else}}` clause. The `else` template tag
must sit at the same level in the tree as the opening and closing `if`
template tags.

```json
{"published": true}
```

```html
{{#unless published}}
  <strong>Private</strong>
{{else}}
  <span>Public</span>
{{/unless}}
```

#### call

Renders the template named by a context property. This allows you to
dynamically choose which template to render based on the data. Accepts
an optional new context for the called template.

```json
{
  "greetingTemplate": "hey",
  "user": {
    "name": "world"
  }
}
```

```html
{{#define hey}}
  <p>Hey, {{name}}!</p>
{{/define}}

{{#define main}}
  <div class="greeting">
    {{#call greetingTemplate user /}}
  </div>
{{/define}}
```

### Variable Expansion

Template variables can exist in two places, inside attribute strings,
or inside text blocks. Attempting to expand a variable anywhere else
in the template is invalid.

* __Valid:__ `<h1>{{title}}</h1>`
* __Valid:__ `<h1>Hello, {{name}}!</h1>`
* __Valid:__ `<a href="{{url}}">link</a>`
* __Invalid:__ `<{{tagName}} class="btn" />`

#### Escaped

This will safely render the named property as text.

```html
{{property}}
```

You can also reference nested properties using dot-syntax:

```html
{{user.name}}
```

Or, reference the current context using `.` on it's own:

```html
{{.}}
```

#### Unescaped

This will render the named property as HTML. This will cause magery to
first parse the string as a HTML document in order to be able to patch
the page with the new elements correctly. As such, it is best avoided,
but can be useful when wanting to render markdown etc.

```html
<div class="description">
  {{{markdown}}}
</div>
```

__NOTE:__ unescaped blocks will only be rendered as HTML if used in a
child node position like the above example. Attempting to use an
unescaped block as an attribute value will behave the same as rendering an
escaped block.

### Custom tags

Magery let's you render other named templates as if they were
template tags. It does not allow JavaScript or other native
extensions to the template syntax as templates would no longer be
portable.

#### Templates as tags

Rendering another template as if it were a block tag.

```json
{
  "countries": [
    {"url": "http://example.com", "label": "Foo"},
    {"url": "http://test.com", "label": "Bar"}
  ]
}
```

```html
{{#define listitem}}
  <li>
    <a href="{{url}}">{{label}}</a>
    <a href="#" class="btn">Delete</a>
  </li>
{{/define}}

{{#define main}}
  <ul>
    {{#each countries}}
      {{#listitem /}}
    {{/each}}
  </ul>
{{/define}}
```

#### Rendering child nodes

As other templates can be used as block tags, any reference to them can
also have child nodes. These can be useful for defining base or
page-level templates, and can be expanded using `{{...}}`.

```html
{{#define bold}}
  <strong>{{...}}</strong>
{{/define}}

{{#define main}}
  <p>Hello, {{#bold}}world{{/bold}}</p>
{{/define}}
```

#### Calling other templates dynamically

See the `call` builtin for referencing other templates via a context
variable. Otherwise the `call` block behaves like any other template
block tag (can include child nodes etc).

## Forms

As with other DOM-diffing libraries, form elements
present a particular problem because they can hold their own state in
`value`, `checked` and `selected` properties.

In Magery, form elements are considered __controlled__. Any text input
with a `value` property, or any checkbox or select element will only
update it's value via a `patch` call. You will not be able to type
into a text box unless there is an event handler updating the text box
value.

Some examples of getting user input via form elements:

### Input

```html
{{#define main}}
  <input type="text" value="{{name}}" oninput="updateName" />
{{/define}}
```

```javascript
var data = {name: ""};

function patch() {
  Magery.patch(templates, 'main', container, data);
}

container.dispatch = function (name, event, context) {
  if (name === 'updateName') {
    // get the updated value from event.target.value
    data.name = event.target.value;
    patch();
  }
};

patch();
```

### Checkbox

```html
{{#define main}}
  {{#if checked}}
    <input type="checkbox" onchange="toggle" checked />
  {{else}}
    <input type="checkbox" onchange="toggle" />
  {{/if}}
{{/define}}
```

```javascript
var data = {checked: false};

function patch() {
  Magery.patch(templates, 'main', container, data);
}

container.dispatch = function (name, event, context) {
  if (name === 'toggle') {
    // get the updated value from event.target.checked
    data.checked = event.target.checked;
    patch();
  }
};

patch();
```

### Select

```html
{{#define main}}
  <select onchange="updateSelect">
    {{#each options}}
      {{#if selected}}
        <option value="{{value}}" selected>{{label}}</option>
      {{else}}
        <option value="{{value}}">{{label}}</option>
      {{/if}}
    {{/each}}
  </select>
{{/define}}
```

```javascript
var data = {
  options: [
    {value: 1, label: 'one', selected: false},
    {value: 2, label: 'two', selected: true},
    {value: 3, label: 'three', selected: false}
  ]
};

function patch() {
  Magery.patch(templates, 'main', container, data);
}

container.dispatch = function (name, event, context) {
  if (name === 'updateSelect') {
    data.options = data.options.map(function (option) {
      option.selected = (option.value == context.value);
      return option;
    });
    patch();
  }
};

patch();
```


[live-editor]: http://caolan.github.io/magery/demo/index.html
[handlebars]: http://handlebarsjs.com
[redux]: http://redux.js.org/
[magery-js]: https://raw.githubusercontent.com/caolan/magery/master/build/magery.js
[magery-min-js]: https://raw.githubusercontent.com/caolan/magery/master/build/magery.min.js
[immutable-js]: http://facebook.github.io/immutable-js/
[copy-kitten]: https://github.com/caolan/copykitten

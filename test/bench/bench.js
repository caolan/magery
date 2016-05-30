/*
- benchmark specific use-cases against react
- compare running time for 1k iterations (or whatever)
- and also compare the number of mutations made to the DOM
  (as minimizing this is also important, separate from runtime)
*/

var idom = IncrementalDOM;

function sectionHeading(txt) {
    var h2 = document.createElement('h2');
    h2.textContent = txt;
    document.getElementById('results').appendChild(h2);
}

var now;
if (window.performance) {
    now = function () {
        return window.performance.now();
    };
}
else {
    now = function () {
        return new Date().getTime();
    };
}

function bench(name, container, iterations, f) {
    var div = document.createElement('div');
    document.getElementById('results').appendChild(div);
    /*
    var observer = new MutationSummary({
        rootNode: container,
        callback: function () {},
        queries: [{all: true}]
    });
     */
    var sample = [];
    var fastest = Infinity;
    var slowest = 0;
    var start = now();
    for (var i = 0; i < iterations; i++) {
        var istart = now();
        f(i);
        var iend = now();
        var iduration = iend - istart;
        if (i % 10 === 0) {
            sample.push(iduration);
        }
        if (iduration > slowest) {
            slowest = iduration;
        }
        if (iduration < fastest) {
            fastest = iduration;
        }
    }
    var end = now();
    //var summaries = observer.disconnect();
    //console.log(['observer', observer]);
    //console.log(['summaries', summaries]);
    //var mutations = summaries[0].projection.mutations.length;
    // console.log(name + ' duration: ' + (end - start) + 'ms');
    // console.log(name + ' fastest: ' + fastest + 'ms');
    // console.log(name + ' slowest: ' + slowest + 'ms');
    //console.log(name + ' mutations: ' + mutations);
    div.innerHTML = '<h3>' + name + '</h3><pre>' +
        'Total time: ' + (end - start) + 'ms\n' +
        'Fastest render: ' + fastest + 'ms\n' +
        'Slowest render: ' + slowest + 'ms\n' +
        '<h4>Sample of render times (1 in 10):</h4>';
    var data = {labels: [], series: [sample]};
    var options = {
        high: 4,
        low: 0,
        //showLine: false,
        axisY: {
            onlyInteger: true
        }
    };
    var responsiveOptions = {};
    var chart = document.createElement('div');
    chart.style = 'height: 200px;';
    div.appendChild(chart);
    chart.className = 'ct-chart ct-perfect-fourth';
    new Chartist.Bar(chart, data, options, responsiveOptions);
}


sectionHeading('Add 500 elements to a list, one at a time - no keys');

var container = document.createElement('div');
var templates = Magery.loadTemplates(
    '{{#define app}}' +
        '<ul>' +
            '{{#each items}}' +
                '<li>{{name}}</li>' +
            '{{/each}}' +
        '</ul>' +
    '{{/define}}'
);

var prev_data = null;
var data = {items: []};

Magery.patch(templates, 'app', container, data);

bench('Magery', container, 500, function (i) {
    var items = data.items.slice();
    items.push({name: 'item' + i});
    prev_data = data;
    data = {items: items};
    Magery.patch(templates, 'app', container, data, prev_data);
});


var container = document.createElement('div');
var App = React.createClass({
    render: function () {
        var items = this.props.items;
        return React.createElement('ul', null, items.map(function (item) {
            return React.createElement('li', null, item.name);
        }));
    }
});

var data = {items: []};

bench('React', container, 500, function (i) {
    data.items.push({name: 'item' + i});
    ReactDOM.render(React.createElement(App, data), container);
});


var container = document.createElement('div');
function render(data) {
    idom.elementOpen('ul', '', null);
    data.items.forEach(function (item) {
        idom.elementOpen('li', '', null);
        idom.text(item.name);
        idom.elementClose('li');
    });
    idom.elementClose('ul');
}

var data = {items: []};

bench('IncrementalDOM', container, 500, function (i) {
    data.items.push({name: 'item' + i});
    idom.patch(container, function() {
        render(data);
    });
});



sectionHeading('Add 500 elements to a list, one at a time - keys');

var container = document.createElement('div');
var templates = Magery.loadTemplates(
    '{{#define app}}' +
        '<ul>' +
            '{{#each items key=id}}' +
                '<li>{{name}}</li>' +
            '{{/each}}' +
        '</ul>' +
    '{{/define}}'
);

var prev_data = null;
var data = {items: []};

Magery.patch(templates, 'app', container, data);

bench('Magery', container, 500, function (i) {
    var items = data.items.slice();
    items.push({id: i, name: 'item' + i});
    prev_data = data;
    data = {items: items};
    Magery.patch(templates, 'app', container, data, prev_data);
});



var container = document.createElement('div');

var Item = React.createClass({
    shouldComponentUpdate: function(nextProps, nextState) {
        return nextProps.item.id !== this.props.item.id;
    },
    render: function () {
        return React.createElement('li', null, this.props.item.name);
    }
});

var App = React.createClass({
    render: function () {
        var items = this.props.items;
        return React.createElement('ul', null, items.map(function (item) {
            return React.createElement(Item, {key: item.id, item: item});
        }));
    }
});

var data = {items: []};

bench('React', container, 500, function (i) {
    data.items.push({id: i, name: 'item' + i});
    ReactDOM.render(React.createElement(App, data), container);
});


// TODO: try benchmarking against React + Immutable / cursors


var container = document.createElement('div');
function render(data) {
    idom.elementOpen('ul', '', null);
    data.items.forEach(function (item) {
        idom.elementOpen('li', item.id, null);
        idom.text(item.name);
        idom.elementClose('li');
    });
    idom.elementClose('ul');
}

var data = {items: []};

bench('IncrementalDOM', container, 500, function (i) {
    data.items.push({id: i, name: 'item' + i});
    idom.patch(container, function() {
        render(data);
    });
});


sectionHeading('Randomly remove elements from 500 length list, one at a time - with keys');

function random(max) {
    return Math.floor(Math.random() * (max + 1));
}


var container = document.createElement('div');
var templates = Magery.loadTemplates(
    '{{#define app}}' +
        '<ul>' +
            '{{#each items key=id}}' +
                '<li>{{name}}</li>' +
            '{{/each}}' +
        '</ul>' +
    '{{/define}}'
);

var prev_data = null;
var data = {items: []};
for (var i = 0; i < 500; i++) {
    data.items.push({id: i, name: 'item' + i});
}
Magery.patch(templates, 'app', container, data);

bench('Magery', container, 500, function (i) {
    var items = data.items.slice();
    items.splice(random(items.length - 1), 1);
    prev_data = data;
    data = {items: items};
    Magery.patch(templates, 'app', container, data, prev_data);
});




var container = document.createElement('div');

var Item = React.createClass({
    shouldComponentUpdate: function(nextProps, nextState) {
        return nextProps.item.id !== this.props.item.id;
    },
    render: function () {
        return React.createElement('li', null, this.props.item.name);
    }
});

var App = React.createClass({
    render: function () {
        var items = this.props.items;
        return React.createElement('ul', null, items.map(function (item) {
            return React.createElement(Item, {key: item.id, item: item});
        }));
    }
});

var data = {items: []};
for (var i = 0; i < 500; i++) {
    data.items.push({id: i, name: 'item' + i});
}
bench('React', container, 500, function (i) {
    data.items.splice(random(data.items.length), 1);
    ReactDOM.render(React.createElement(App, data), container);
});




var container = document.createElement('div');
function render(data) {
    idom.elementOpen('ul', '', null);
    data.items.forEach(function (item) {
        idom.elementOpen('li', item.id, null);
        idom.text(item.name);
        idom.elementClose('li');
    });
    idom.elementClose('ul');
}

var data = {items: []};
for (var i = 0; i < 500; i++) {
    data.items.push({id: i, name: 'item' + i});
}
bench('IncrementalDOM', container, 500, function (i) {
    data.items.splice(random(data.items.length), 1);
    idom.patch(container, function() {
        render(data);
    });
});


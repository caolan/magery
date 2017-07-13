var query = {};
var params = window.location.search.substring(1).split('&');
for (var i = 0; i < params.length; i++) {
    var pair = params[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
}

var templates_editor = ace.edit("templates");
templates_editor.getSession().setUseWorker(false);
templates_editor.setTheme("ace/theme/solarized_light");
templates_editor.setHighlightActiveLine(false);
templates_editor.setShowPrintMargin(false);
templates_editor.getSession().setMode("ace/mode/html");
//templates_editor.setBehavioursEnabled(false);

var json_editor = ace.edit("data");
json_editor.getSession().setUseWorker(false);
json_editor.setTheme("ace/theme/solarized_light");
json_editor.setHighlightActiveLine(false);
json_editor.setShowPrintMargin(false);
json_editor.getSession().setMode("ace/mode/json");
json_editor.$blockScrolling = Infinity;
//json_editor.setBehavioursEnabled(false);

if (query.templates) {
    templates_editor.setValue(query.templates);
}
if (query.data) {
    json_editor.setValue(query.data);
}

function eachNode(nodelist, f) {
    var i = 0;
    var node = nodelist[0];
    while (node) {
        var tmp = node;
        // need to call nextSibling before f() because f()
        // might remove the node from the DOM
        node = node.nextSibling;
        f(tmp, i++, nodelist);
    }
};

function copyTemplatesToPage() {
    var active = document.getElementById('active-templates');
    var el = document.createElement('div');
    el.innerHTML = templates_editor.getValue();
    eachNode(el.getElementsByTagName('template'), function (node) {
        var existing = document.getElementById(node.id);
        if (existing) {
            existing.innerHTML = node.innerHTML;
        }
        else {
            active.appendChild(node);
        }
    });
}

var data;
try {
    data = JSON.parse(json_editor.getValue());
}
catch (e) {
    data = {};
    json_editor.setValue('{}');
}

copyTemplatesToPage();
// check if query params failed to provide a 'main' template
if (!document.getElementById('main')) {
    var tmpl = document.createElement('template');
    tmpl.id = 'main';
    document.getElementById('active-templates').appendChild(tmpl);
}

Magery.initTemplates();
var app = Magery.bind('result', 'main', data, {});
    
function patch() {
    try {
        app.update();
    }
    catch (e) {
        // user might still be editing
        return false;
    }
}

function updateTemplates() {
    try {
        copyTemplatesToPage();
        Magery.initTemplates();
        return true;
    }
    catch (e) {
        // user might still be editing
        return false;
    }
}

function updateJSON() {
    try {
        app.context = JSON.parse(json_editor.getValue());
        return true;
    }
    catch (e) {
        // user might still be editing
        return false;
    }
}

templates_editor.getSession().on('change', function () {
    if (updateTemplates()) {
        patch();
    }
});

json_editor.getSession().on('change', function () {
    if (updateJSON()) {
        patch();
    }
});

// initial render
updateTemplates();
updateJSON();
patch();

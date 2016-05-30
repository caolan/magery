// editor app
var user_templates, user_data, templates_editor, json_editor;

templates_editor = ace.edit("templates");
templates_editor.getSession().setUseWorker(false);
templates_editor.setTheme("ace/theme/solarized_light");
templates_editor.setHighlightActiveLine(false);
templates_editor.setShowPrintMargin(false);
templates_editor.getSession().setMode("ace/mode/handlebars");
//templates_editor.setBehavioursEnabled(false);

json_editor = ace.edit("data");
json_editor.getSession().setUseWorker(false);
json_editor.setTheme("ace/theme/solarized_light");
json_editor.setHighlightActiveLine(false);
json_editor.setShowPrintMargin(false);
json_editor.getSession().setMode("ace/mode/json");
json_editor.$blockScrolling = Infinity;
//json_editor.setBehavioursEnabled(false);

function patch() {
    var container = document.getElementById('result');
    try {
        Magery.patch(user_templates, 'main', container, user_data);
    }
    catch (e) {
        // user might still be editing
        return false;
    }
}

function updateTemplates() {
    try {
        user_templates = Magery.loadTemplates(templates_editor.getValue());
        return true;
    }
    catch (e) {
        // user might still be editing
        return false;
    }
}

function updateJSON() {
    try {
        user_data = JSON.parse(json_editor.getValue());
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

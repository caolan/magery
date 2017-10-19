var page = require('webpage').create();

var failures = [];

function receive(msg) {
    if (msg.type == 'suite') {
        console.log(msg.title);
    }
    if (msg.type == 'pass') {
        console.log(' ✓ ' + msg.title);
    }
    if (msg.type == 'fail') {
        failures.push(msg.error);
        console.log(' ' + failures.length + ') ' + msg.title);
    }
    if (msg.type == 'suite end') {
        console.log('');
    }
    if (msg.type == 'end') {
        console.log((msg.stats.passes || 0) + ' passing (' + msg.stats.duration + 'ms)');
        if (msg.stats.pending) {
            console.log(' ' + msg.stats.pending + ' pending');
        }
        if (msg.stats.failures) {
            console.log(' ' + msg.stats.failures + ' failing');
            console.log('');
            failures.forEach(function (err, i) {
                console.log((i + 1) + ') ' + err);
            });
        }
        slimer.exit(msg.stats.failures);
    }
}

page.onError = function (err) {
    console.error(err);
    slimer.exit(1);
};

page.onConsoleMessage = function (message) {
    console.log(message);
};

page.onAlert = function (str) {
    receive(JSON.parse(str));
};

var url = './test/index.html';

page.open(url, function (status) {
    if (status !== 'success') {
        console.error('Could not open: ' + url);
	slimer.exit(1);
    }
});

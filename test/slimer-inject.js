var Base = Mocha.reporters.Base;

function send(x) {
    alert(JSON.stringify(x));
}

function SlimerReporter(runner) {
    Base.call(this, runner);
    var self = this;

    runner.on('start', function(){
        send({type: 'start'});
    });
    
    runner.on('suite', function(suite){
        send({type: 'suite', title: suite.title});
    });
    
    runner.on('suite end', function(suite){
        send({type: 'suite end', title: suite.title});
    });
    
    runner.on('pending', function(test){
        send({type: 'pending', title: test.title});
    });
    
    runner.on('pass', function(test){
        send({type: 'pass', title: test.title, speed: test.speed, duration: test.duration});
    });
    
    runner.on('fail', function(test, err){
        send({type: 'fail', title: test.title, error: '' + err});
    });
    
    runner.on('end', function () {
        send({type: 'end', stats: self.stats});
    });
}


/**
 * Inherit from `Base.prototype`.
 */

function F(){};
F.prototype = Base.prototype;
SlimerReporter.prototype = new F;
SlimerReporter.prototype.constructor = SlimerReporter;


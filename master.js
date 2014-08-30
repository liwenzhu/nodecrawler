'use strict';

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var Bloom = require('bloom-lite');
var bloom = new Bloom();

var urls = [], count = 0;
var LOG_INTERVAL = 10000; // 10 seconds
var UPDATE_CHILD_INTERVAL = 2*60*1000; // 1 minutes

var PORTAL_URL = "http://www.jd.com";

cluster.setupMaster({
	exec: "worker.js"
});

for (var i = 0; i < numCPUs; i++) {
	createWorker();
}

function createWorker () {
	var worker = cluster.fork();
	worker.on('message', function (msg) {
		// console.log(msg);
		if (msg.cmd && msg.cmd === "url") {
			// console.log(msg.url);
			if (!bloom.exist(msg.url)) {
				count++;
				bloom.add(msg.url);
				urls.push(msg.url);
			}
		} else if (msg.cmd && msg.cmd === "error") {
			console.log("----------> Error URL: %s, %s, urls: %s, ID: %s", urls[0], new Date(), urls.length, worker.id);
			if (msg.errorURL)
				urls.push(msg.errorURL); // push error url back
			setTimeout(function(){
				try {
					worker.send({url: urls.shift()});
				} catch (e) {
					console.log(e); // channel closed do nothing.
				}
			}, 1000);
		} else {
			// console.log("url length:", urls.length);
			if (urls.length === 0) {
				console.log('there is no url in array. pages: %s', count);
				process.exit(0);
			}
			if ((urls.length & 127) === 0)
				console.log("DEBUG: URL: %s, %s, urls: %s, id: %s", urls[0], new Date(), urls.length, worker.id);
			process.nextTick(function(){
				worker.send({url: urls.shift()});
			});
 		}	
	});
	if (urls.length === 0) {
		if(!bloom.exist(PORTAL_URL))
			worker.send({url: PORTAL_URL, saveId: worker.id});
		else 
			worker.send({url:null, saveId: worker.id});
	}
	else 
		worker.send({url: urls.shift(), saveId: worker.id});
};

cluster.on('online', function (worker) {
	console.log('INFO: worker %s is ready.', worker.id);
});

cluster.on('exit', function (worker, code, signal) {
	console.log('INFO: worker %d died (%s). restarting...',
	worker.process.pid, signal || code);
	createWorker();
});


function printUrlsLength() {
	console.log("INFO: urls: (%s), next url: (%s), workers: (%s).", 
		urls.length, urls[0], Object.keys(cluster.workers).length);
	setTimeout(function () {
		printUrlsLength();
	}, LOG_INTERVAL);
};

printUrlsLength();

function updateChildren () {
	for(var child in cluster.workers)
		cluster.workers[child].kill();
	setTimeout(function(){
		updateChildren();
	}, UPDATE_CHILD_INTERVAL);
}

setTimeout(function(){
	updateChildren();
},UPDATE_CHILD_INTERVAL);


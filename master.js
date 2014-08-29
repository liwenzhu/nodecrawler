'use strict';

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var Bloom = require('bloom-lite');
var bloom = new Bloom();

var urls = [], count = 0;
var LOG_INTERVAL = 10000; // 10 seconds

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
		if (msg.cmd && msg.cmd === "url") {
			if (!bloom.exist(msg.url)) {
				count++;
				bloom.add(msg.url);
				urls.push(msg.url);
			}
		} else if (msg.cmd && msg.cmd === "error") {
			console.log("----------> Error URL: %s, %s, urls: %s, ID: %s", urls[0], new Date(), urls.length, worker.id);
			setTimeout(function(){
				try {
					worker.send({url: urls.shift()});
				} catch (e) {
					console.log(e); // channel closed do nothing.
				}
			}, 1000);
		} else {
			if (urls.length === 0) {
				console.log('urls is empty');
				process.exit(0);
			}
			if ((urls.length & 127) === 0)
			console.log("----------> URL: %s, %s, urls: %s, id: %s", urls[0], new Date(), urls.length, worker.id);
			process.nextTick(function(){
				worker.send({url: urls.shift()});
			});
 		}	
	});
	if (urls.length === 0)
		worker.send({url: PORTAL_URL, saveId: worker.id});
	else 
		worker.send({url: urls.shift(), saveId: worker.id});
};

cluster.on('online', function (worker) {
	console.log('worker %s is ready.', worker.id);
});

cluster.on('exit', function (worker, code, signal) {
	console.log('worker %d died (%s). restarting...',
	worker.process.pid, signal || code);
	createWorker();
});


// function printUrlsLength() {
// 	console.log("crawled pages:", count, new Date());
// 	console.log("urls to crawl:", urls.length);
// 	console.log("next url:", urls[0]);
// 	setTimeout(function () {
// 		printUrlsLength();
// 	}, LOG_INTERVAL);
// };

//printUrlsLength();
function updateChildren () {
	for(var child in cluster.workers)
		cluster.workers[child].kill();
	setTimeout(function(){
		updateChildren();
	}, 600000);
}

updateChildren();

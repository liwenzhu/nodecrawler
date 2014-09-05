'use strict';

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var Bloom = require('bloom-lite');
var bloom = new Bloom();

var urls = [], count = 0;
var LOG_INTERVAL = 10000; // 10 seconds
var UPDATE_CHILD_INTERVAL = 10*60*1000; // 10 minutes
// var PORTAL_URL = "http://www.walmart.com/cp/cell-phones/1105910?povid=P1171-C1110.2784+1455.2776+1115.2956-L33";
// var PORTAL_URL = "http://www.amazon.com/s/ref=nb_sb_noss?url=search-alias%3Dmobile&field-keywords=";
var PORTAL_URL = "http://www.jd.com";
// var PORTAL_URL = "http://www.amazon.com/Best-Sellers-Cell-Phones-Accessories/zgbs/wireless/7072561011/ref=acs_ux_rw_ts_cps_7072561011_more?pf_rd_p=1877024482&pf_rd_s=merchandised-search-10&pf_rd_t=101&pf_rd_i=7072561011&pf_rd_m=ATVPDKIKX0DER&pf_rd_r=1Z6BFFW16QM92KYDBZDJ";

cluster.setupMaster({
	exec: "worker.js"
});

// for (var i = 0; i < numCPUs; i++) {
	createWorker();
// }

function createWorker () {
	var worker = cluster.fork();
	worker.on('message', function (msg) {
		if (msg.cmd && msg.cmd === "url") {
			handleURLMessage(msg.url);
		} else if (msg.cmd && msg.cmd === "kill") {
			worker.kill();
		} else if (msg.cmd && msg.cmd === "error") {
			handleWorkerError(msg.errorURL, worker.id);
			setTimeout(function(){
				try {
					worker.send({url: urls.shift()});
				} catch (e) {
					console.log(e); // channel closed do nothing.
				}
			}, 1000);
		} else {
			if (urls.length === 0) {
				console.log('there is no url in array. pages: %s', count);
				// process.exit(0);
			}
			if ((urls.length & 127) === 0)
				console.log("DEBUG: URL: %s, %s, urls: %s, id: %s", urls[0], new Date(), urls.length, worker.id);
			try {
					worker.send({url: urls.shift()});
			} catch (e) {
				console.log(e); // channel closed do nothing.
			}
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

function handleWorkerError (errorURL, workerId) {
	console.log("----------> Error URL: (%s), time:(%s), urls: (%s), ID: (%s)", 
		urls[0], new Date(), urls.length, workerId);
	if (errorURL) {
		urls.push(errorURL); // push error url back
	}
};

function handleURLMessage (url) {
	if (!bloom.exist(url)) {
		count++;
		bloom.add(url);
		urls.push(url);
	}
};

function printUrlsLength() {
	console.log("INFO: urls: (%s), next url: (%s), workers: (%s), pages: (%s).", 
		urls.length, urls[0], Object.keys(cluster.workers).length, count);
	setTimeout(function () {
		printUrlsLength();
	}, LOG_INTERVAL);
};

printUrlsLength();

// function updateChildren () {
// 	for(var child in cluster.workers)
// 		cluster.workers[child].kill();
// 	setTimeout(function(){
// 		updateChildren();
// 	}, UPDATE_CHILD_INTERVAL);
// }

// setTimeout(function(){
// 	updateChildren();
// },UPDATE_CHILD_INTERVAL);


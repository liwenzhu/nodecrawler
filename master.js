var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

cluster.setupMaster({
	exec: "worker.js"
});
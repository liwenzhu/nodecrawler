'use strict';

var jschardet = require('jschardet');
var iconv = require('iconv-lite');
var htmlparser = require('htmlparser2');
var http = require('http');
var url = require('url');
var fs = require('fs');

var SPEED_LIMIT = 50; // 50 kb/s  per/process
var SPEED = (SPEED_LIMIT * 1024) / 1000.0;

var errorCount = 0;
var options = {
};

var buffers, buf, encoding, body, req, id, fsWriteStream;

process.on('message', handleMessage);

function handleMessage (msg) {
	if (msg.saveId) {
		id = msg.saveId;
		fsWriteStream = fs.createWriteStream(__dirname + "/pages/"+id+".txt", {flag: "a+"});
		console.log("logfile:", __dirname + "/pages/"+id+".txt");
	}
	crawl(msg.url);
};

var parser = new htmlparser.Parser({
	onopentag: function (name, attribs) {
		if(name === "a" && attribs.href) {
			if(attribs.href.indexOf('jd.com') > 0) {
				process.send({cmd: 'url', url: attribs.href});
			}
		}
	},
	ontext: function (text) {
		text = innerText(text);
		if(text) 
			fsWriteStream.write(text, function (err) {
				if(err)
					console.log("######id:%s, error:", id, err);
			});
	}
});

function innerText (text) {
	if(!/[\n\(\/\sfp)]/.test(text[0]))
		return text;
	return null;
};

var crawl = function (crawlURL) {
	if (!crawlURL) {
		console.log('#### crawlURL is null');
		return sendMeMessageLater();
	}
	var parsedUrl = url.parse(crawlURL);
	if ("https:" === parsedUrl.protocol || !parsedUrl.protocol)
		return sendMeMessageLater();
	//extract url
	options.hostname = parsedUrl.hostname;
	options.path = parsedUrl.path;

	req = http.request(options, function (res) {
		buffers = [];
		var startTime = new Date();
		var tmpSentBytes = 0, elapsedTime, assumedTime, lag;
		res.on('data', function (chunk) {
			if(!buffers)
				return process.send({});
			buffers.push(chunk);
			tmpSentBytes += chunk.length;
			elapsedTime = new Date() - startTime;
	        assumedTime = tmpSentBytes / SPEED;
	        lag = assumedTime - elapsedTime;
	        controlSpeed(lag, res);
		});

		res.on('end', function () {
			if(!buffers)
				return sendMeMessageLater();
			try {
				buf = Buffer.concat(buffers);
			} catch (e) {
				console.log("ERROR Buffer concat: buf: %s, buffers: %s.", buf, buffers);
				return sendMeMessageLater();
			}
			encoding = jschardet.detect(buf).encoding;
			if(!encoding)
				return sendMeMessageLater();
			body = iconv.decode(buf, encoding);
			parser.write(body);
			parser.end();	
			buf = null;
			buffers = null;
			process.send({});
		});
	});

	req.on('error', function (e) {
		console.log('ERROR: options: (%s), message: (%s), time: (%s), url: (%s)', options, e, new Date(), crawlURL);
		errorCount++;
		if (errorCount === 10) 
			return killMe();
		if (e.code==='ECONNRESET')
			process.send({cmd: 'error', errorURL: crawlURL});
		else 
			sendMeMessageLater();
	});

	req.end();
};

function killMe () {
	console.log("INFO: a stupid child process killed by itself!!!");
	process.send({cmd:"kill"});
}

function controlSpeed (lag, res) {
	if (lag > 0) {
		// console.log('%s too fast, download will resume in: %s ms', crawlURL, lag);
		res.pause();
		setTimeout(function () {
			res.resume();
		}, lag);
	}
};

function sendMeMessageLater () {
	setTimeout(function () {
		process.send({})
	}, 5000);
};







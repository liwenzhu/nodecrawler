'use strict';

var jschardet = require('jschardet');
var iconv = require('iconv-lite');
var http = require('http');
var url = require('url');
var fs = require('fs');
var cheerio = require('cheerio');

var SPEED_LIMIT = 300; // 300 kb/s  per/process
var SPEED = (SPEED_LIMIT * 1024) / 1000.0;
var DATA_SIZE_LIMIT = 100*1024; // 100 kb
var URL_FILTER = 'item.jd.com'

var errorCount = 0;
var options = {
};

var buffers, buf, body, req, id, fsWriteStream;

process.on('message', handleMessage);

function handleMessage (msg) {
	if (msg.saveId) {
		id = msg.saveId;
		fsWriteStream = fs.createWriteStream(__dirname + "/pages/"+id+".txt", {flag: "a+"});
		removeOldFileIfEmpty(__dirname + '/pages/' + (id-1) + '.txt');
		console.log("INFO: log file: ", __dirname + "/pages/"+id+".txt");
	}
	crawl(msg.url);
};

function removeOldFileIfEmpty (filePath) {
	fs.stat(filePath, function (error, stats) {
		if (error) 
			return console.log('ERROR: error when remove data file(%s)', error);
		if (stats.size < DATA_SIZE_LIMIT) {
			console.log('INFO: data file size less than 100 KB, removed (%s).', filePath);
			fs.unlinkSync(filePath);
		} else {
			console.log('INFO: crawled data size: %s kb', stats.size >>> 10);
		}
	}); 
}

function crawl (crawlURL) {
	if (!crawlURL) {
		return sendMeMessageLater();
	}

	var parsedUrl = url.parse(crawlURL);

	if ("https:" === parsedUrl.protocol || !parsedUrl.protocol)
		return sendMeMessageLater();
	//extract url
	options.hostname = parsedUrl.hostname;
	options.path = parsedUrl.path;

	req = http.request(options, handleRequest);

	req.setTimeout(5000, function () {
		console.log('TIMEOUT: request timeout, url(%s).', crawlURL);
		req.destroy();
		process.send({});
	});

	req.on('error', function (e) {
		console.log('ERROR: options: (%s), message: (%s), time: (%s), url: (%s)', options, e, new Date(), crawlURL);
		if (e.code==='ECONNRESET') {
			console.log(e.message, e.code);
			return killMe();
		}
		else 
			sendMeMessageLater();
	});

	req.end();
};

function handleRequest (res) {
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
        pauseIfTooFast(lag, res);
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
		body = parseBody(buf);
		if (!body)
			return sendMeMessageLater();
		handleBody(body);
		process.send({});
	});
};

function handleBody(body) {
	var $ = cheerio.load(body);
	var text;
	$('script').remove();
	$('a').map(function (i, link) {
		var href = $(link).attr('href');
		if (!href)
			return;
		if (!href.match('.jpg') && href.match(URL_FILTER))
			process.send({cmd: 'url', url: href});
	});
	text = $('div').text();
	if (text) {
		text = text.replace(/(\t|\s\s)/g,'\r\n').replace(/\r\n\r\n/g,'');
		fsWriteStream.write(text, function (err) {
			if(err)
				console.log("ERROR: id: (%s), error: (%s).", id, err);
		});
	}
}

function parseBody (buf) {
	var encoding = jschardet.detect(buf).encoding;
	if(!encoding)
		return null;
	return iconv.decode(buf, encoding);
};

function killMe () {
	console.log("INFO: a stupid child process killed by itself!!!");
	setTimeout(function(){process.send({cmd:"kill"});}, 5000);
};

function pauseIfTooFast (lag, res) {
	if (lag > 0) {
		// console.log('%s too fast, download will resume in: %s ms', crawlURL, lag);
		res.pause();
		setTimeout(function () {
			res.resume();
		}, lag);
	}
};

function sendMeMessageLater () {
	console.log("INFO: send a delay request.");
	setTimeout(function () {
		process.send({})
	}, 5000);
};







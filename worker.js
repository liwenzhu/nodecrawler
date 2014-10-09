'use strict';
// ___________________________________o88888o
// _________________________88o_____o88888888
// _______________________o888o___o8888888888
// _______o888ooo________o8888o_888888888888
// __ooo8888888888888___88888888888888888888
// ___*88888888888888o_88888888888888888888
// ___o8888888888888__88888888888888888888
// __o8888888888888__88888888888888888888
// ___88888888888*__888888888888888888*
// ______*88888*___888888888888888*
// _______888888__88888888888888*
// ______o88888888888888888888*
// ____o888888888888888888888888888888888888888oo
// ___8888888888888888888888888888888888888888888o
// _o8888888888888888888888888888888888888888888*
// 888888888888888888888888888888888888888888**
// *8888888888888888888888888888888**
// _*88888888888*_88888
// __8888888888*___*8888
// __8888888888_____88888o
// __*888888888o_____88888o
// ___88888888888_____*8888o
// ___*888888888888o___*8888o
// ____*8888888888888o___*888o
// _____*88888888888888____8888
// _______8888888888888o____*888
// ________888888888888______*888o
// _________8888888888*_______*8888
// _________*8888888888oo______*888
// __________*8888888888888o
// ___________*88888888888888o
// ____________*888888888888888o
// ______________88888888___8888o
// _______________8888888_o88888
// _______________*8888888888*
// _________________8888888*
// __________________88888888888o
// ___________________88888888__*o
// ____________________8888888o
// _____________________8888888
// ______________________8888888
// ______________________*8888888
// ______________________888888888oo
// ______________________888__888888o
// _____________________o88___88888
// _____________________*_____8888
// __________________________o88

var jschardet = require('jschardet');
var iconv = require('iconv-lite');
var http = require('http');
var url = require('url');
var fs = require('fs');
var cheerio = require('cheerio');
var plugin = require('./plugins/tmall.js')

var SPEED_LIMIT = 300; // 300 kb/s  per/process
var SPEED = (SPEED_LIMIT * 1024) / 1000.0;
var DATA_SIZE_LIMIT = 1;//100*1024; // 100 kb
var URL_FILTER = plugin.filter;

var errorCount = 0;
var options = {
	headers:{
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.94 Safari/537.36'
	}
};

var buffers, buf, body, req, id, fsWriteStream;

process.on('message', handleMessage);

function handleMessage (msg) {
	if (msg.saveId) {
		id = msg.saveId;
		fsWriteStream = fs.createWriteStream(__dirname + "/pages/"+id+".txt", {flags: "a+"});
		if (id > 5) {
			removeOldFileIfEmpty(__dirname + '/pages/' + (id-1) + '.txt');
		}
		console.log("INFO: log file: ", __dirname + "/pages/"+id+".txt");
	}
	crawl(msg.url);
};

function removeOldFileIfEmpty (filePath) {
	fs.stat(filePath, function (error, stats) {
		if (error) 
			return console.log('ERROR: error when remove data file(%s)', error);
		// if (stats.size < DATA_SIZE_LIMIT) {
		if (stats.size === 0) {
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
	if (res.statusCode == 302)
		return crawl(res.headers['location']);

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
		// console.log(body);
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
	$('style').remove();
	$('a').map(function (i, link) {
		var href = $(link).attr('href');
		if (!href)
			return;
		href = href.trim();
		// if (!href.match('.jpg') && href.match(URL_FILTER) && href.match(TMP_FILTER))
		if (!href.match('.jpg') && href.match(URL_FILTER))
			process.send({cmd: 'url', url: href});
	});
	text = plugin.extractContent(body);
	if (text) {
		text = handleText(text);
		fsWriteStream.write(text+'\n', function (err) {
			if(err)
				console.log("ERROR: id: (%s), error: (%s).", id, err);
		});
	}
}

function handleText (text) {
	text = text.replace(/(\t|\s\s)/g,'\r\n').replace(/\r\n\r\n/g,'');
	return text;
};

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
	setTimeout(function () {
		process.send({});
	}, 5000);
};







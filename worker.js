'use strict';

var jschardet = require('jschardet');
var iconv = require('iconv-lite');
var htmlparser = require('htmlparser2');
var http = require('http');
var url = require('url');

var options = {
	agent: false
};

var buffers, buf, encoding, body, req;

process.on('message', handleMessage);

function handleMessage (msg) {
	if (msg.url) {
		crawl(msg.url, msg.id);
	}
};

var parser = new htmlparser.Parser({
	onopentag: function (name, attribs) {
		if(name === "a" && attribs.href) {
			if(attribs.href.indexOf('jd.com') > 0) {
				process.send({cmd: 'url', url: attribs.href});
			}
		}
	}
});

var crawl = function (crawlURL, id) {
	if (!crawlURL) {
		console.log('#### crawlURL is null');
		return setTimeout(function(){
			process.send({});
		}, 5000);
	}
	var parsedUrl = url.parse(crawlURL);
	if ("https:" === parsedUrl.protocol || !parsedUrl.protocol)
		return process.send({});
	//extract url
	options.hostname = parsedUrl.hostname;
	options.path = parsedUrl.path;
	buffers = [];

	req = http.request(options, function (res) {
		res.on('data', function (chunk) {
			try {
				buffers.push(chunk);
			} catch (e) {
				console.log('url:', crawlURL);
				console.log(e);
				console.log('buffers', buffers);
				console.log(chunk);
			}
		});

		res.on('end', function () {
			buf = Buffer.concat(buffers);
			encoding = jschardet.detect(buf).encoding;
			if(!encoding)
				return process.send({});
			body = iconv.decode(buf, encoding);
			parser.write(body);
			parser.end();
			buf = null;
			buffers = null;
			process.send({});
		});

		res.on('error', function(err){
			console.log(err);
		});
	});

	req.setTimeout(30000, function(){
		console.log(new Date(), 'request timeout, skip url:', crawlURL);
		process.send({});
	});

	req.on('error', function (e) {
		console.log(new Date() , ' connection problem:', e, crawlURL);
		process.send({});
	});

	req.end();
};
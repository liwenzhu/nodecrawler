'use strict';

var Bloom = require('bloom-lite');
var showmemory = require('showmemory');
var jschardet = require('jschardet');
var iconv = require('iconv-lite');
var htmlparser = require('htmlparser2');
var http = require('http');
var url = require('url');
// showmemory(10000);

var PORTAL = "http://www.jd.com";
var bloom = new Bloom();
var urls = [];
var options = {
	agent: false
};
var count = 0;
var LOG_INTERVAL = 10000; // 10 seconds

var buffers, buf, encoding, body, req;

var parser = new htmlparser.Parser({
	onopentag: function (name, attribs) {
		if(name === "a" && attribs.href) {
			if(!bloom.exist(attribs.href) 
				// && (url.parse(attribs.href).protocol != null) 
				&& attribs.href.indexOf('jd.com') > 0) {
				count++;
				urls.push(attribs.href);
			}
		}
	}
});

var crawl = function (crawlURL) {
	if ( (count & 127) == 0)
		console.log("----------> URL: %s, %s", crawlURL, new Date());
	if (!crawlURL) return process.exit(0);
	var parsedUrl = url.parse(crawlURL);
	if ("https:" === parsedUrl.protocol || !parsedUrl.protocol)
		return crawl(urls.pop());
	//extract url
	options.hostname = parsedUrl.hostname;
	options.path = parsedUrl.path;
	buffers = [];
	bloom.add(crawlURL);

	req = http.request(options, function (res) {
		res.on('data', function (chunk) {
			buffers.push(chunk);
		});

		res.on('end', function () {
			buf = Buffer.concat(buffers);
			encoding = jschardet.detect(buf).encoding;
			if(!encoding)
				return crawl(urls.pop());
			body = iconv.decode(buf, encoding);
			parser.write(body);
			parser.end();
			buf = null;
			buffers = null;
			process.nextTick(function () {
				crawl(urls.pop());
			});
		});

		res.on('error', function(err){
			console.log(err);
		});
	});

	req.setTimeout(30000, function(){
		console.log(new Date(), 'request timeout, skip url:', crawlURL);
		crawl(urls.pop());
	});

	req.on('error', function (e) {
		console.log(new Date() , ' connection problem retry 30 seconds later:', e, crawlURL);
		setTimeout(function () {
			crawl(urls.pop());
		}, 30000);
	});

	req.end();
};

function printUrlsLength() {
	console.log("crawled pages:", count, new Date());
	console.log("urls to crawl:", urls.length);
	setTimeout(function () {
		printUrlsLength();
	}, LOG_INTERVAL);
};

printUrlsLength();

crawl(PORTAL);









































'use strict';

var Bloom = require('bloom-lite');
var showmemory = require('showmemory');
var jschardet = require('jschardet');
var iconv = require('iconv-lite');
var htmlparser = require('htmlparser2');
var http = require('http');
var url = require('url');
showmemory(5000);

var PORTAL = "http://www.jd.com";
var bloom = new Bloom();
var urls = [];
var options = {};
var count = 0;
// var INTERVAL = 100;
var buffers, buf, encoding, body;

var parser = new htmlparser.Parser({
	onopentag: function (name, attribs) {
		if(name === "a") {
			if(!bloom.exist(attribs.href) 
				&& (url.parse(attribs.href).protocol != null)) {
				count++;
				if ( (count & 4095) == 0) {
					console.log("total pages: %s, url: %s", count, attribs.href);
				}
				urls.push(attribs.href);
			}
		}
	}
});

var crawl = function (crawlURL) {
	if (!crawlURL) return process.exit(0);
	var parsedUrl = url.parse(crawlURL);
	if ("https:" === parsedUrl.protocol || !parsedUrl.protocol)
		return crawl(urls.pop());
	//extract url
	options.hostname = parsedUrl.hostname;
	options.path = parsedUrl.path;
	buffers = [];

	http.request(options, function (res) {
		res.on('data', function (chunk) {
			buffers.push(chunk);
		});

		res.on('end', function () {
			if (buffers.length == 0) 
				return crawl(urls.pop());
			buf = Buffer.concat(buffers);
			encoding = jschardet.detect(buf).encoding;
			body = iconv.decode(buf, encoding);
			parser.write(body);
			parser.end();
			console.log("url list length:", urls.length);
			buf = null;
			buffers = null;
			process.nextTick(function () {
				crawl(urls.pop());
			});
		});
	}).end();
};

crawl(PORTAL);









































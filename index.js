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
var buffers, buf, encoding, body, req;

var parser = new htmlparser.Parser({
	onopentag: function (name, attribs) {
		if(name === "a" && attribs.href) {
			if(!bloom.exist(attribs.href) 
				&& (url.parse(attribs.href).protocol != null) 
				&& attribs.href.indexOf('jd.com') > 0) {
				count++;
				if ( (count & 127) == 0) {
					console.log("total pages: %s, url: %s", count, attribs.href);
				}
				urls.push(attribs.href);
			}
		}
	}
});

var crawl = function (crawlURL) {
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

		res.on('error', function(err){
			console.log(err);
		});
	});

	req.on('error', function (e) {
		console.log(new Date() , ' connection problem:', e);

		crawl(urls.pop());
	});

	req.end();
};

crawl(PORTAL);









































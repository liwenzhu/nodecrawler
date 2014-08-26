var Bloom = require('bloom-lite');
var showmemory = require('showmemory');
var jschardet = require('jschardet');
var iconv = require('iconv-lite');
var htmlparser = require('htmlparser2');
var http = require('http');
var url = require('url');
showmemory();

var PORTAL = "http://www.jd.com";
var bloom = new Bloom();
var urls = [];
var options = {};
var count = 0;
var INTERVAL = 100;
var buffers = [], buf, encoding;

var parser = new htmlparser.Parser({
	onopentag: function (name, attribs) {
		if(name === "a") {
			if(!bloom.exist(attribs.href)) {
				count++;
				if ( (count & 511) == 0) {
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

	http.request(options, function (res) {
		res.on('data', function (chunk) {
			buffers.push(chunk);
		});

		res.on('end', function () {
			buf = buf = Buffer.concat(buffers);
			// console.log(jschardet.detect(buf));
			encoding = jschardet.detect(buf).encoding;
			body = iconv.decode(buf, encoding);
			parser.write(body);
			parser.end();
			console.log("url list length:", urls.length);
			setTimeout(function(){
				crawl(urls.pop());
			}, INTERVAL);
		});
	}).end();
};

crawl(PORTAL);









































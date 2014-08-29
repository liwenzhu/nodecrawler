'use strict';

var jschardet = require('jschardet');
var iconv = require('iconv-lite');
var htmlparser = require('htmlparser2');
var http = require('http');
var url = require('url');
var fs = require('fs');

var options = {
	agent: false
};

var DOWNLOAD_SPEED = 1024*200; // 200 kb/s

var buffers, buf, encoding, body, req, id, fsWriteStream;

process.on('message', handleMessage);

function handleMessage (msg) {
	if (msg.saveId) {
		id = msg.saveId;
		fsWriteStream = fs.createWriteStream(__dirname + "/pages/"+id+".txt", {flag: "a+"});
		console.log("logfile:", __dirname + "/pages/"+id+".txt");
	}
	if (msg.url) {
		crawl(msg.url, msg.id);
	}
};

var parser = new htmlparser.Parser({
	onopentag: function (name, attribs) {
		if(name === "a" && attribs.href) {
			if(attribs.href.indexOf('jd.com') > 0) {
				// console.log(attribs.href);
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
			})
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
		res.on('readable', function () {
			var chunk;
			while (null != (chunk = res.read(DOWNLOAD_SPEED))) {
				if(!buffers)
				return process.send({});
				try {
					buf = Buffer.concat(buffers);
				} catch (e) {
					console.log("buf:", buf);
					console.log("buffers:", buffers);
					return process.send({});
				}
				encoding = jschardet.detect(buf).encoding;
				if(!encoding)
					return process.send({});
				body = iconv.decode(buf, encoding);
				// console.log(body);
				// handleBody(body);
				parser.write(body);
				parser.end();
				buf = null;
				buffers = null;
				process.send({});
			}
			
		});
		// res.on('data', function (chunk) {
		// 	// try {
		// 	if(!buffers)
		// 		return process.send({});
		// 	buffers.push(chunk);
		// 	// } catch (e) {
		// 	// 	console.log('url:', crawlURL);
		// 	// 	console.log(e);
		// 	// 	console.log('buffers', buffers);
		// 	// 	console.log(chunk);
		// 	// }
		// });

		// res.on('end', function () {
		// 	if(!buffers)
		// 		return process.send({});
		// 	try {
		// 		buf = Buffer.concat(buffers);
		// 	} catch (e) {
		// 		console.log("buf:", buf);
		// 		console.log("buffers:", buffers);
		// 		return process.send({});
		// 	}
		// 	encoding = jschardet.detect(buf).encoding;
		// 	if(!encoding)
		// 		return process.send({});
		// 	body = iconv.decode(buf, encoding);
		// 	// console.log(body);
		// 	// handleBody(body);
		// 	parser.write(body);
		// 	parser.end();
		// 	buf = null;
		// 	buffers = null;
		// 	process.send({});
		// });

		res.on('error', function(err){
			console.log(err);
		});
	});

	// req.setTimeout(30000, function(){
	// 	console.log(new Date(), 'request timeout, skip url:', crawlURL);
	// 	process.send({});
	// });

	req.on('error', function (e) {
		console.log(new Date() , ' connection problem:', e, crawlURL);
		process.send({cmd: 'error'});
	});

	req.end();
};

// var fs = require('fs');
// fs.readFile('./out.txt', {encoding: 'utf8'}, function(err, data){
// 	// console.log(data);
// 	console.log(data.match(/<body((.|\r\n)*)\/body>/g))
// 	// console.log(data.match(/<body>(.*)<\/body>/));
// })
// var str = '';
// console.log(str.match(/\<body\>.*\<\/body\>/g))







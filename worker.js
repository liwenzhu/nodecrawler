'use strict';

var jschardet = require('jschardet');
var iconv = require('iconv-lite');
var htmlparser = require('htmlparser2');
var http = require('http');
var url = require('url');
var fs = require('fs');

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

	req = http.request(options, function (res) {
		buffers = [];
		res.on('data', function (chunk) {
			if(!buffers)
				return process.send({});
			buffers.push(chunk);
			res.pause();
			setTimeout(function(){res.resume();}, 1000);
		});

		res.on('end', function () {
			res.destroy();
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
			parser.write(body);
			parser.end();	
			buf = null;
			buffers = null;
			process.send({});
		});

		res.on('error', function(err){
			console.log(err);
			res.destroy();
		});
	});

	req.on('error', function (e) {
		console.log('ERROR: options: (%s), message: (%s), time: (%s), url: (%s)', options, e, new Date(), crawlURL);
		if (e.code==='ECONNRESET')
			process.send({cmd: 'error', errorURL: crawlURL});
		else 
			process.send({cmd: 'error'});
		req.destroy();
	});

	req.end();
};








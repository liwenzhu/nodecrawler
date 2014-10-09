var cheerio = require('cheerio');

exports.portal = 'http://mobile.sina.com.cn';
exports.filter = 'tech.sina.com.cn';

exports.extractContent = function (body) {
	var $ = cheerio.load(body);
	$('script').remove();
	$('style').remove();
	var text = $('#artibody').text();
	return text;
};


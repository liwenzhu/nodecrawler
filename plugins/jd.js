var cheerio = require('cheerio');

exports.portal = 'http://www.jd.com';
exports.filter = 'item.jd.com';

exports.extractContent = function (body) {
	var $ = cheerio.load(body);
	$('script').remove();
	$('style').remove();
	var text = $('#product-detail-1 ul li').attr('title');
	return text;
};


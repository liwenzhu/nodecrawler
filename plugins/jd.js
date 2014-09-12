var cheerio = require('cheerio');

exports.extractContent = function (body) {
	var $ = cheerio.load(body);
	$('script').remove();
	$('style').remove();
	var text = $('#product-detail-1 ul li').attr('title');
	return text;
};
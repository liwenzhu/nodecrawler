var cheerio = require('cheerio');

exports.portal = 'http://3c.tmall.com/?spm=3.7396704.20000023.1.sBnCzf&acm=tt-1143110-39118.1003.8.87004&uuid=87004&scm=1003.8.tt-1143110-39118.OTHER_1404175014321_87004&go=mobi-t1&pos=1';
// exports.portal = 'http://detail.tmall.com/item.htm?spm=a220m.1000858.1000725.276.8WQHvb&id=39781221815&areaId=110000&cat_id=50928001&rn=ac524730ca114988ea2a7bb138a71b93&standard=1&user_id=1034481551&is_b=1';
exports.filter = 'tmall.com';

exports.extractContent = function (body) {
	// console.log(body);
	var $ = cheerio.load(body);
	$('script').remove();
	$('style').remove();
	var text = $('#J_AttrUL li').attr('title');
	if (text)
		console.log('==========>> Product found: ', text);
	return text;
};

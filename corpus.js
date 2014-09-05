var bosonnlp = require('bosonnlp');
var nlp = new bosonnlp.BosonNLP('59G4ZvQp.2193.0YmDde8uiv3e');

var fs = require('fs');

fs.readFile(__dirname + '/pages/1.txt', {encoding: 'utf8'}, function(err, data){
	data = data.split('\r\n');
	result = [];
	for (var i = 0; i < 10; i++) {
		// console.log(data[i]);
		result.push(data[i]);
	}
	result = result.join('');
	result = result.replace(/[\[\]]/g, '');
	result = result.replace(' ', '');
	console.log(result);
	// var s = "\u6536\u85CF\u4EAC\u4E1C\u60A8\u597D\uFF01\u6B22\u8FCE\u6765\u5230\u4EAC\u4E1C\uFF01\u767B\u5F55\A0\u514D\u8D39\u6CE8\u518C\u6211\u7684\u8BA2\u5355\u4F1A\u5458\u4FF1\u4E50\u90E8\u624B\u673A\u4EAC\u4E1C\u5BA2\u6237\u670D\u52A1\u5E2E\u52A9\u4E2D\u5FC3\u552E\u540E\u670D\u52A1\u5728\u7EBF\u5BA2\u670D\u6295\u8BC9\u4E2D\u5FC3\u5BA2\u670D\u90AE\u7BB1\u7F51\u7AD9\u5BFC\u822A\u7279\u8272\u680F\u76EE";
	// console.log(s.length)
	// console.log(result[88]);
//	{"status":400,"message":"decode: expected value but found invalid escape code at character 88"}
	nlp.ner(result, function (result) {
		console.log(result);
	});
});

// var str = "[登录] [免费注册] 我的订单会员俱乐部手机京东 客户服务 帮助中心 售后服务 在线客服 投诉中心 客服邮箱网站导航 特色栏目";
// console.log(escape(str));
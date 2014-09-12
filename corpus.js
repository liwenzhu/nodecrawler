var bosonnlp = require('bosonnlp');
var nlp = new bosonnlp.BosonNLP('bPbKk3DR.2300.n9hO7ae7WiS3');

var fs = require('fs');
var count = 0;

var writeStream = fs.createWriteStream(__dirname+'/corpus.txt', {flag: 'a+'});
fs.readFile(__dirname + '/pages/1.txt', {encoding: 'utf8'}, function(err, data){
	data = data.split('\r\n');
	result = [];
	len = 0;
	// console.log(data.length); // 11608
	// process.exit(0);
	// sendMessage('投诉中心,客服邮箱网站导航特色栏目京东通信校园之星为我推荐视频购物京东社区在线读书装机大师京东E卡家装城');
	for (var i = 0; i < 200; i++) {
		// console.log(data[i]);
		result.push(data[i]);
		len += data[i].length;
		// console.log(len);
		if (len > 3000) {
			sendMessage(result.join(''));
			result = [];
			len = 0;
		}
		// if (result.length )
	}
	// result = result.join('');
	// result = result.replace(/[\[\]]/g, '');
	// result = result.replace(' ', '');
	// console.log(result);
	// var s = "\u6536\u85CF\u4EAC\u4E1C\u60A8\u597D\uFF01\u6B22\u8FCE\u6765\u5230\u4EAC\u4E1C\uFF01\u767B\u5F55\A0\u514D\u8D39\u6CE8\u518C\u6211\u7684\u8BA2\u5355\u4F1A\u5458\u4FF1\u4E50\u90E8\u624B\u673A\u4EAC\u4E1C\u5BA2\u6237\u670D\u52A1\u5E2E\u52A9\u4E2D\u5FC3\u552E\u540E\u670D\u52A1\u5728\u7EBF\u5BA2\u670D\u6295\u8BC9\u4E2D\u5FC3\u5BA2\u670D\u90AE\u7BB1\u7F51\u7AD9\u5BFC\u822A\u7279\u8272\u680F\u76EE";
	// console.log(s.length)
	// console.log(result[88]);
//	{"status":400,"message":"decode: expected value but found invalid escape code at character 88"}
	// nlp.ner(result, function (result) {
	// 	console.log(result);
	// });
});

function sendMessage (message) {
	// console.log('%s, ===========> %s', count++, message);
	var data;
	// console.log('result:'+message);
	nlp.ner(message, function (result) {
		// data = JSON.parse(result);
		// if(data.status == 400)
		// 	console.log(message);
		// data = JSON.parse(data)[0]; 
		// var entity = data.entity[0];
		// test.equal(data.word.slice(entity[0], entity[1]).join(''), "成都商报");
		// test.equal(entity[2], "product_name");
		// try {
		// 	data = JSON.parse(result);
		// 	if(data.status == 400)
		// 		console.log(message);
		// 	// console.log(data);
		// } catch(e) {
		// 	writeStream.write(result);	
		// }
		writeStream.write(result);
		// if(result)
		console.log(result);
	});
};


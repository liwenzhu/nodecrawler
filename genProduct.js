var fs = require('fs');

var dir = __dirname + '/jd';
var writeStream = fs.createWriteStream(__dirname + '/pro.txt', {flag: 'a+', encoding: 'utf8'});

fs.readdir(dir, function(err, files){
	if (err) console.log(err);
	for (var index in files) {
		handleFile(dir + '/' + files[index]);
	}
});

function handleFile (file) {
	fs.readFile(file, {encoding: 'utf8'}, function (err, data) {
		if (err) console.log(err);
		data = data.split('\n')
		for (var index in data) {
			handleLine(data[index]);
		}
	});
};

function handleLine (line) {
	var words = line.split(' ');
	var product = [];
	for (var index in words) {
		text = words[index].match(/[^\w+]/g);
		if (text) {
			for (var charIndex in text)
				product.push(text[charIndex] + ' v P');
		}
		enText = words[index].match(/\w+/g);
		if (enText) {
			for (var itemIndex in enText)
				product.push(enText[itemIndex] + ' v P');
		}
	}
	writeStream.write(product.join('\n') + '\n');
};

// var s = '努比亚小牛2 Z5S mini';
// s = s.split(' ');
// var parts, text, enText;
// for (var i in s) {
// 	text = s[i].match(/[^\w+]/g);
// 	if (text) {
// 		for (var c in text)
// 			console.log(text[c] + ' v P');
// 	}
// 	enText = s[i].match(/\w+/g);
// 	if (enText) {
// 		console.log(enText + ' v P');
// 	}
// 	// console.log(s[i])
// 	// if (s[i].match(/[^\w+]/g)) {
// 	// 	// console.log(s[i]);
// 	// 	// parts = s[i].split('');
// 	// 	for (var c in s[i])
// 	// 		console.log(s[i][c] + ' P');
// 	// } else 
// 	// 	console.log(s[i] + ' P');
// }
// console.log(s.match(/[^\w+]/g));
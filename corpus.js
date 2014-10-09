var bosonnlp = require('bosonnlp');
// 59G4ZvQp.2193.0YmDde8uiv3e
// bPbKk3DR.2300.n9hO7ae7WiS3
var nlp = new bosonnlp.BosonNLP('59G4ZvQp.2193.0YmDde8uiv3e');

var fs = require('fs');
// var count = 0;
// var writeStream = fs.createWriteStream(__dirname+'/corpus.txt', {flags: 'a+', encoding: 'utf8'});

// var home = __dirname + '/pages';

// fs.readdir(home, function (err, files) {
// 	for (var i in files) {
// 		handleFile(home + '/' + files[1]);
// 	}
// });

// function handleFile (file) {
// 	fs.readFile(file, {encoding: 'utf8'}, function(err, data){
// 		data = data.split('\n');
// 		result = [];
// 		len = 0;
// 		for (var i = 0; i < data.length; i++) {
// 			result.push(data[i]);
// 			len += data[i].length;
// 			if (len > 1000) {
// 				count ++;
// 				sendMessage(result.join(''));
// 				result = [];
// 				len = 0;
// 			}
// 		}
// 	});
// };

// function sendMessage (message, callback) {
// 	nlp.ner(message, function (result) {
// 		writeStream.write(result + '\n');
// 		console.log(result);
// 	});
// };

var ws = fs.createWriteStream(__dirname + '/corpus2.txt', {flags: 'a+', encoding: 'utf8'});
fs.readFile(__dirname + '/corpus.txt', {encoding: 'utf8'}, function (err, data) {
	data = data.split('\n');
	// console.log(JSON.parse(data[0].slice(1, data[0].length-1)));
	for (var i in data) {
		ws.write(data[i].slice(1, data[i].length-1) + '\n');
	}
});

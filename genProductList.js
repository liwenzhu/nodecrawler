var fs = require('fs');

// var Bloom = require('bloom-lite');
// var bloom = new Bloom();

var cache = {};

var dir = __dirname + '/pages';
writeStream = fs.createWriteStream(__dirname+'/list.txt', {encoding: 'utf8', flag: 'a+'});
fs.readdir(dir, function (err, files) {
	for (var index in files) {
		fs.readFile(dir + '/' + files[index], {encoding: 'utf8'}, function (err, data) {
			if (!data) return;
			data = data.split('\n');
			for (var i in data) {
				// if (!bloom.exist(data[i])) {
				// 	bloom.add(data[i]);
				// 	writeStream.write(data[i] + '\n');
				// }
				if (!cache[data[i]]) {
					cache[data[i]] = 1;
					writeStream.write(data[i] + '\n');
				}
			}
		});
		// console.log(files[index]);
	}
});
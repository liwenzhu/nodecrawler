"use strict"

var fs = require('fs');

var writeStream = fs.createWriteStream(__dirname + '/tmp.txt', {flag: 'a+', encoding:'utf8'});
var ENTITY_START = 0;
var ENTITY_STOP = 1;
var ENTITY_TYPE = 2;

fs.readFile(__dirname + '/corpus.txt', {encoding:'utf8'}, function (err, data) {
	data = data.slice(1, data.length-1);
	data = JSON.parse(data);
	var word, pos, tag;
	for (var index in data.word) {
		// check tag
		tag = 'U'; // tag unknown
		if (data.entity[0] && data.entity[0][ENTITY_TYPE] != 'product_name')
			data.entity.shift();
		if (data.entity[0]) {
			if (index >= data.entity[0][ENTITY_STOP]) {
				data.entity.shift();
			} else if (index >= data.entity[0][ENTITY_START]) {
				tag = 'P'; // tag product
			}
		}

		word = data.word[index];
		if (!word.match(/\w+/)) { //a Chinese word
			word = word.split('');
			pos = data.tag[index];
			for (var c in word)
				writeStream.write(word[c] + ' ' + pos + ' ' + tag + '\n');
		} else {
			pos = data.tag[index];
			writeStream.write(word + ' ' + pos + ' ' + tag + '\n');
		}
	}
});


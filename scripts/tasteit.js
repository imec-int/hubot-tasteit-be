// Commands:
//   hubot broodje van de week
//   hubot wat is het broodje van de week?
//   hubot broodjes
//   hubot wat ligt er op <broodje>?

/*
Copyright (c) 2013 MiX

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
var cheerio = require('cheerio');
var scopedClient = require('scoped-http-client');


module.exports = function(robot) {
	robot.respond(/(what is the |what the fuck is the |what's the |wat is het )?(brood|broodje|sandwich) (van de |of the )(week|week?)/i, function (msg){
		getBroodjeVanDeWeek(function (broodje){
			msg.send( "Broodje van de Week: " + broodje );
		});
	});

	robot.respond(/broodjes/i, function (msg){
		getAllBroodjes(function (err, broodjes){
			var output = "BROODJE VAN DE WEEK\n";
			output    += "===================\n";
			output    +=  broodjes.vandeweek.description  + " ("+broodjes.vandeweek.price+" €)" + "\n\n";

			output    += "CLASSIC\n";
			output    += "===================\n";
			output    +=  flattenBroodjesList(broodjes.classic) + "\n\n";

			output    += "SPECIAL\n";
			output    += "===================\n";
			output    +=  flattenBroodjesList(broodjes.special) + "\n\n";

			msg.send( output );
		});
	});

	robot.respond(/wat ligt er op (een broodje )?(.*)(\?)?/i, function (msg){
		var input = msg.match[2];
		findBroodje(input, function (err, broodje){
			msg.send("Op een broodje " + broodje.title + " ("+broodje.price+" €) ligt er: " + broodje.description);
		});
	});
};


// Taste-it parsers:
// ******************
function getBroodjeVanDeWeek(callback){
	var client = scopedClient.create('http://www.taste-it-gent.be/broodjes.php').get()(function (err, resp, body) {
		$ = cheerio.load(body);

			/*
			$(".itemDescription").each(function (i, elem) {
				 console.log($(this).text());
			});
			*/
		callback( $(".itemDescription").first().text() );
	})
}

function getAllBroodjes(callback){
	var broodjevandeweek = {};
	var classicbroodjes = new Array();
	var specialbroodjes = new Array();

	var client = scopedClient.create('http://www.taste-it-gent.be/broodjes.php').get()(function (err, resp, body) {
		$ = cheerio.load(body);

		// maybe we can opitimize this shit:
		var rows = $("#HeadTable").find(".itemDescription").first().parent().parent().parent().parent().parent().parent().parent().parent().parent().parent().parent().children("tr");

		var broodjevandeweekRow = $(rows[1]);

		broodjevandeweek = {
			description: trim(broodjevandeweekRow.find(".itemDescription").text()),
			price: trim(broodjevandeweekRow.find(".itemDescription").parent().parent().parent().find("td").next().next().html().replace(/\s&euro;/g,""))
		}

		var classicbroodjesRow = $(rows[3]);
		classicbroodjes = parseTablesOfBroodjes( classicbroodjesRow.children("table").first().find("table").first().find("table") );


		var specialbroodjesRow = $(rows[5]);
		specialbroodjes = parseTablesOfBroodjes( specialbroodjesRow.children("table").first().find("table").first().find("table") );

		callback(null, {
			vandeweek: broodjevandeweek,
			classic: classicbroodjes,
			special: specialbroodjes
		});
	})
}

function parseTablesOfBroodjes(tables){
	var broodjes = new Array();

	tables.each(function (i, elem) {
		var title = $(elem).find(".itemTitle").text();
		var description = $(elem).find(".itemDescription").text();
		var price = $(elem).find(".itemPrice").text().replace(/\s+€/g,"");

		if(title){
			broodjes.push({
				title: trim(title.split("\n")[0]),
				description: trim(description),
				price: price
			});
		}
	});

	return broodjes;
}

function trim(str) {
	return str.replace(/^\s+|\s+$/g,'');
};

function flattenBroodjesList(broodjesList){
	var list = new Array();
	for(var i in broodjesList){
		list.push(broodjesList[i].title + " ("+broodjesList[i].price+" €)")
	}
	return list.join(", ");
}

function findBroodje(userinput, callback){
	var highestMatchValue = 0;
	var mostMatchingBroodje;

	function check(userinput, broodje){
		var matchvalue = similar_text(userinput, broodje.title, true);
		if(matchvalue > highestMatchValue){
			mostMatchingBroodje = broodje;
			highestMatchValue = matchvalue;
		}
	}

	getAllBroodjes(function (err, broodjes){
		for(var i in broodjes.classic){
			check(userinput, broodjes.classic[i]);
		}
		for(var i in broodjes.special){
			check(userinput, broodjes.special[i]);
		}

		callback(null, mostMatchingBroodje);
	});
}

function similar_text (first, second, percent) {
	// http://kevin.vanzonneveld.net
	// +   original by: Rafał Kukawski (http://blog.kukawski.pl)
	// +   bugfixed by: Chris McMacken
	// +   added percent parameter by: Markus Padourek (taken from http://www.kevinhq.com/2012/06/php-similartext-function-in-javascript_16.html)
	// *     example 1: similar_text('Hello World!', 'Hello phpjs!');
	// *     returns 1: 7
	// *     example 2: similar_text('Hello World!', null);
	// *     returns 2: 0
	// *     example 3: similar_text('Hello World!', null, 1);
	// *     returns 3: 58.33
	if (first === null || second === null || typeof first === 'undefined' || typeof second === 'undefined') {
		return 0;
	}

	first += '';
	second += '';

	var pos1 = 0,
		pos2 = 0,
		max = 0,
		firstLength = first.length,
		secondLength = second.length,
		p, q, l, sum;

	max = 0;

	for (p = 0; p < firstLength; p++) {
		for (q = 0; q < secondLength; q++) {
			for (l = 0;
			(p + l < firstLength) && (q + l < secondLength) && (first.charAt(p + l) === second.charAt(q + l)); l++);
			if (l > max) {
				max = l;
				pos1 = p;
				pos2 = q;
			}
		}
	}

	sum = max;

	if (sum) {
		if (pos1 && pos2) {
			sum += similar_text(first.substr(0, pos2), second.substr(0, pos2));
		}

		if ((pos1 + max < firstLength) && (pos2 + max < secondLength)) {
			sum += similar_text(first.substr(pos1 + max, firstLength - pos1 - max), second.substr(pos2 + max, secondLength - pos2 - max));
		}
	}

	if (!percent) {
		return sum;
	} else {
		return (sum * 200) / (firstLength + secondLength);
	}
}

exports.getBroodjeVanDeWeek = getBroodjeVanDeWeek;
exports.getAllBroodjes = getAllBroodjes;
exports.similar_text = similar_text;
exports.findBroodje = findBroodje;







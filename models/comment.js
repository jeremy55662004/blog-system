var mongodb = require('mongodb').Db;
var settings = require('../settings');

function Comment(name, day, title, comment){
	this.name = name;
	this.day = day;
	this.title = title;
	this.comment = comment;
}

module.exports = Comment;

Comment.prototype.save = function (callback){
	var name = this.name,
		day = this.day,
		title = this.title,
		comment = this.comment;

	//open database
	mongodb.connect(settings.url, function (err, db){
		if(err){
			return callback(err);
		}
		// read posts set
		db.collection('posts', function (err,collection){
			if (err){
				db.close();
				return callback(err);
			}
			//insert into posts set
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$push: {"comments": comment}
			}, function (err){
				db.close();
				if (err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};
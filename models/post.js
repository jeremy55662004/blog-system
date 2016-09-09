var mongodb = require('./db'),
	markdown = require('markdown').markdown;

function Post(name, title, post){
	this.name = name;
	this.title = title;
	this.post = post;
}

module.exports = Post;

//store an article and others information
Post.prototype.save = function (callback){
	var date = new Date();
	// store date
	// 0 means Jan
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + "-" + (date.getMonth() + 1),
		day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "" + 
		date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())

	}
	//file which need to store in database
	var post = {
		name: this.name,
		time: time,
		title: this.title,
		post: this.post
	};

	//open database
	mongodb.open(function (err, db){
		if(err){
			return callback(err);
		}
		// read posts set
		db.collection('posts', function (err,collection){
			if (err){
				mongodb.close();
				return callback(err);
			}
			//insert into posts set
			collection.insert(post, {
				safe: true
			}, function (err){
				mongodb.close();
				if (err){
					return callback(err);
				}
				callback(err);
			});
		});
	});
};

//read article and other information from one person or people
Post.getAll = function(name, callback){
	//open database
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}

		//read posts set
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var query = {};
			if (name){
				query.name = name;
			}
			//use query object to find article
			collection.find(query).sort({
				time: -1
			}).toArray(function (err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				docs.forEach(function (doc){
					doc.post = markdown.toHTML(doc.post);
				});
				callback(null, docs);
			});
		});
	});
};


//Base on user name, date to get an article
Post.getOne = function(name, day, title, callback){
	//open database
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}

		//read posts set
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//use user name, post date and article's name to query
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function (err, doc){
				mongodb.close();
				if(err){
					return callback(err);
				}
				doc.post = markdown.toHTML(doc.post);
				callback(null, doc); //return an article
			});
		});
	});
};

Post.edit = function (name, day, title, callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}

		//read posts set
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//use user name, post date and article's name to query
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function (err, doc){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, doc); //return an article
			});
		});
	});
};

Post.update = function (name, day, title, post, callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}

		//read posts set
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//update article
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$set: {post: post}
			}, function (err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

Post.remove = function (name, day, title, callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}

		//read posts set
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//update article
			collection.remove({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				w: 1
			}, function (err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

var mongodb = require('./db'),
	markdown = require('markdown').markdown;

function Post(name, head, title, tags, post){
	this.name = name;
	this.head = head;
	this.title = title;
	this.tags = tags;
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

	};
	//file which need to store in database
	var post = {
		name: this.name,
		head: this.head,
		time: time,
		title: this.title,
		tags: this.tags,
		post: this.post,
		comments: [],
		reprint_info: {},
		pv: 0
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
Post.getTen = function(name, page, callback){
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
			//use count to return the number of documents(total)
			collection.count(query, function (err,total){
				//use query object to find article
				collection.find(query, {
					skip: (page -1) * 10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function (err, docs){
					mongodb.close();
					if(err){
						return callback(err);
					}
					docs.forEach(function (doc){
						if(doc.post){
							doc.post = markdown.toHTML(doc.post);
						}
					});
					callback(null, docs, total);
				});
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
				if(err){
					mongodb.close();
					return callback(err);
				}
				if(doc){
					
					// when view one times then pv +1
					collection.update({
						"name": name,
						"time.day": day,
						"title": title
					}, {
						$inc: {"pv": 1}
					}, function(err){
						mongodb.close();
						if(err){
							return callback(err);
						}
					});
					doc.post = markdown.toHTML(doc.post);
					if(doc.comments){
						doc.comments.forEach(function (comment){
							comment.content = markdown.toHTML(comment.content);
						});
					}
				}
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

			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function (err,doc){
				if(err){
					mongodb.close();
					return callback(err);
				}
				//if there is reprint_from then the article was repritned
				var reprint_from = "";
				if (doc.reprint_info.reprint_from){
					reprint_from = doc.reprint_info.reprint_from;
				}
				if (reprint_from != ""){
					// update oiginal article's reprint_to
					collection.update({
						"name": reprint_from.name,
						"time.day": reprint_from.day,
						"title": reprint_from.title
					}, {
						$pull: {
							"reprint_info.reprint_to": {
								"name": name,
								"day": day,
								"title": title
							}
						}
						}, function (err){
							if (err){
								mongodb.close();
								return callback(err);
							}
					});
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
	});
};

Post.getArchive = function(callback){
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
			//return the arraies consist of documents which include name, time and title
			collection.find({}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function (err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

Post.getTags = function(callback){
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
			//use distinct to find different tags
			collection.distinct("tags", function (err,docs) {
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

Post.getTag = function(tag, callback){
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
			//find documents which has tag inside tags array
			collection.find({
				"tags": tag
			}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function (err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};


//use title to search posts
Post.search = function(keyword, callback){
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
			var pattern = new RegExp(keyword, "i");
			collection.find({
				"title": pattern
			}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function (err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

Post.reprint = function(reprint_from, reprint_to, callback){
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
			//find the origin document which is reprinted
			collection.findOne({
				"name": reprint_from.name,
				"time.day": reprint_from.day,
				"title": reprint_from.title
			}, function (err, doc){
				if(err){
					mongodb.close();
					return callback(err);
				}

				var date = new Date();
				var time = {
					date: date,
					year: date.getFullYear(),
					month: date.getFullYear() + "-" + (date.getMonth() + 1),
					day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
					minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "" + 
					date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())

				}

				//delete origin _id
				delete doc._id;

				doc.name = reprint_to.name;
				doc.head = reprint_to.head;
				doc.time = time;
				doc.title = (doc.title.search(/Reprint/) > -1) ? doc.title : "[Reprint]" + doc.title;
				doc.comments = [];
				doc.reprint_info = {"reprint_from": reprint_from};
				doc.pv = 0;

				collection.update({
					"name": reprint_from.name,
					"time.day": reprint_from.day,
					"title": reprint_from.title
				}, {
					$push: {
						"reprint_info.reprint_to":{
							"name": doc.name,
							"day": time.day,
							"title": doc.title
						}
					}
				}, function(err){
					if(err){
						mongodb.close();
						return callback(err);
					}
				});

				collection.insert(doc,{
					safe: true
				}, function (err,post){
					mongodb.close();
					if(err){
						return callback(err);
					}
					callback(err, post[0]);
				});			
			});
		});
	});
};

var mongodb = require('mongodb').Db;
var crypto = require('crypto');
var settings = require('../settings');

function User(user){
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
};

module.exports = User;

//store the information of users
User.prototype.save = function(callback){
	var md5 = crypto.createHash('md5'),
		email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
		head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";

	//store user file into database
	var user = {
		name: this.name,
		password: this.password,
		email: this.email,
		head: head
	};

	//open database
	mongodb.connect(settings.url, function(err, db){
		if(err){
			return callback(err);
		}
		//read sets of users
		db.collection('users', function(err, collection){
			if(err){
				db.close();
				return callback(err);
			}
			//insert information of users into users' set
			collection.insert(user,{
				safe: true
			}, function(err, user){
				db.close();
				if(err){
					return callback(err);
				}
				callback(null, user[0]); //error is null and return user file 
			});
		});
	});
};

//read information of user
User.get = function(name, callback){
	//open database
	mongodb.connect(settings.url, function(err,db){
		if(err){
			return callback(err);
		}
		//read set of users
		db.collection('users', function(err, collection){
			if(err){
				db.close();
				return callback(err);
			}
			//search the value of user(key=name) is name
			collection.findOne({
				name:name
			}, function(err,user){
				db.close();
				if(err){
					return callback(err);
				}
				callback(null, user);
			});
		});
	});
};
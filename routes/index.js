var crypto = require('crypto'),
	User = require('../models/user.js'),
	Post = require('../models/post.js'),
	Comment = require('../models/comment.js');

module.exports = function(app) {
	app.get('/', function (req, res){
		var page = req.query.p ? parseInt(req.query.p) : 1;
		Post.getTen(null, page, function (err, posts, total){
			if(err){
				posts =[];
			}
			res.render('index', { 
				title: 'Home',
				posts: posts,
				page: page,
				isFirstPage: (page -1) == 0,
				isLastPage: ((page-1) * 10 + posts.length) == total,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/reg', checkNotLogin);
	app.get('/reg', function (req, res){
		res.render('reg', { 
			title: 'Register',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/reg', checkNotLogin);
	app.post('/reg', function (req, res){
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];
		if (password_re != password){
			req.flash('error', 'The confirm password is not correct!');
			return res.redirect('/reg');
		}

		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: req.body.name,
			password: password,
			email: req.body.email
		});

		//check if the user already existed
		User.get(newUser.name, function (err, user){
			if(user){
				req.flash('error', 'User already existed!');
				return res.redirect('/reg');
			}
			//if not exist then add new user
			newUser.save(function(err, user){
				if(err){
					req.flash('error', err);
					return res.redirect('/reg');
				}
				req.session.user = user;  // store information of user in session
				req.flash('success', 'Register successfully !');
				res.redirect('/');
			});
		});
	});

	app.get('/login', checkNotLogin);
	app.get('/login', function (req, res){
		res.render('login', {
		 title: 'Login',
		 user: req.session.user,
		 success: req.flash('success').toString(),
		 error: req.flash('error').toString()
		});
	});
	app.post('/login', checkNotLogin);
	app.post('/login', function (req,res){
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		//check the user if already existed
		User.get(req.body.name, function (err, user){
			if(!user){
				req.flash('error','user does not exist');
				return res.redirect('/login');
			}
			//check password
			if(user.password != password){
				req.flash('error', 'Password is not correct!');
				return res.redirect('/login');
			}
			//name and password are correct then store info into session
			req.session.user = user;
			req.flash('success', 'Login Successfully !');
			res.redirect('/');
		});
	});
	app.get('/post', checkLogin);
	app.get('/post', function (req, res){
		res.render('post', { 
			title: 'Post',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/post', checkLogin);
	app.post('/post', function (req, res){
		var currentUser = req.session.user,
			tags = [req.body.tag1,req.body.tag2,req.body.tag3],
			post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
		post.save(function (err){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', 'Post Successfully !');
			res.redirect('/');
		})
	});
	app.get('/logout', checkLogin);
	app.get('/logout', function (req, res){
		req.session.user = null;
		req.flash('success', 'Logout Successfully !');
		res.redirect('/');
	});

	app.get('/upload', checkLogin);
	app.get('/upload', function (req, res){
		res.render('upload', {
			title: 'upload file',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/upload', checkLogin)
	app.post('/upload', function (req, res){
		req.flash('success','Upload file Successfully !');
		res.redirect('/upload');
	});

	app.get('/archive', function (req, res){
		Post.getArchive(function (err,posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('archive', { 
				title: 'Save',
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/tags', function (req, res){
		Post.getTags(function (err,posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('tags', { 
				title: 'Tag',
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/tags/:tag', function (req, res){
		Post.getTag(req.params.tag, function (err,posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('tag', { 
				title: 'TAG-' + req.params.tag,
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/links', function(req, res){
		res.render('links', { 
			title: "Friendly links",
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.get('/search', function(req, res){
		Post.search(req.query.keyword, function (err, posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('search', { 
				title: "SEARCH-" + req.query.keyword,
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/u/:name', function (req, res){
		var page = req.query.p ? parseInt(req.query.p) : 1;
		User.get(req.params.name, function (err, user){
			if(!user) {
				req.flash('error', 'user does not exist !');
				return res.redirect('/');
			}
			Post.getTen(user.name, page, function (err, posts, total){
				if(err){
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('user', { 
					title: user.name,
					posts: posts,
					page: page,
					isFirstPage: (page -1) == 0,
					isLastPage: ((page-1) * 10 + posts.length) == total,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});

	app.get('/u/:name/:day/:title', function (req, res){
		Post.getOne(req.params.name, req.params.day, req.params.title, function (err,post){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('article', { 
				title: req.params.title,
				user: req.session.user,
				post: post,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.post('/u/:name/:day/:title', function (req,res){
		var date = new Date(),
			time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "" + 
					date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + 
					date.getMinutes() : date.getMinutes());
		var md5 = crypto.createHash('md5'),
			email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
			head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
		var comment = {
			name: req.body.name,
			head: head,
			email: req.body.email,
			website: req.body.website,
			time: time,
			content: req.body.content
		};
		var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
		newComment.save(function (err){
			if(err){
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', 'Leave message Successfully !');
			res.redirect('back');
		});

	});

	app.get('/edit/:name/:day/:title', checkLogin);
	app.get('/edit/:name/:day/:title', function (req, res){
		Post.edit(req.params.name,req.params.day,req.params.title, function (err,post){
			if(err){
				req.flash('error', err);
				return res.redirect('back');
			}
			res.render('edit', { 
				title: 'Edit',
				user: req.session.user,
				post: post,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function (req, res){
		var currentUser = req.session.user;
		Post.update(currentUser.name,req.params.day,req.params.title, req.body.post, function (err){
			var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
			if(err){
				req.flash('error', err);
				return res.redirect(url);
			}
			req.flash('success', "Update Successfully !");
			res.redirect(url);
		});
	});

	app.get('/remove/:name/:day/:title', checkLogin);
	app.get('/remove/:name/:day/:title', function (req, res){
		var currentUser = req.session.user;
		Post.remove(currentUser.name,req.params.day,req.params.title, function (err){
			if(err){
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', "Remove Successfully !");
			res.redirect('/');
		});
	});

	app.use(function (req, res){
		res.render("404");
	});

	function checkLogin(req, res, next){
		if(!req.session.user){
			req.flash('error', 'Not login !');
			res.redirect('/login');
		}
		next();
	}

	function checkNotLogin(req, res, next){
		if(req.session.user){
			req.flash('error', 'You have already logged in !');
			res.redirect('back');
		}
		next();
	}
};

var crypto = require('crypto'),
	User = require('../models/user.js');
	Post = require('../models/post.js');

module.exports = function(app) {
	app.get('/', function (req, res){
		Post.getAll(null, function (err,posts){
			if(err){
				posts =[];
			}
			res.render('index', { 
				title: 'Home',
				user: req.session.user,
				posts: posts,
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
			post = new Post(currentUser.name, req.body.title, req.body.post);
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

	app.get('/u/:name', function (req, res){
		User.get(req.params.name, function (err, user){
			if(!user) {
				req.flash('error', 'user does not exist !');
				return res.redirect('/');
			}
			Post.getAll(null, function (err,posts){
				if(err){
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('user', { 
					title: user.name,
					user: req.session.user,
					posts: posts,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});

	app.get('/u/:name/:day/:title', function (req, res){
		Post.getOne(req.params.name,req.params.day,req.params.title, function (err,post){
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

	app.get('/edit/:name/:day/:title', checkLogin);
	app.get('edit/:name/:day/:title', function (req, res){
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

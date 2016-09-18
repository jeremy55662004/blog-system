var db_username = process.env.YOUR_DB_USERNAME;
var db_password = process.env.YOUR_DB_PASSWORD;


module.exports = {
	cookieSecret: 'myblog',
	//db: 'blog',
	//host: 'localhost',
	//port: 27017
	url: 'mongodb://'+ db_username + ':' + db_password + '@ds033076.mlab.com:33076/blog_project'
};
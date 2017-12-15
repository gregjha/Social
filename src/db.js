const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');

// schema

const Follow = new mongoose.Schema({
	username: String,
	url: String
});

const Users = new mongoose.Schema({
	// Username and password to log into the web app
	username: String,
	password: String,

	// Social Media Accounts
	twitterUsername: String,

	// Instagram user id needed for API
	instagramID: String,
	fbUsername: String,
	following: [Follow]
});


Users.plugin(URLSlugs('username'));

// Model to use in implementation
mongoose.model('Users', Users);
mongoose.model('Follow', Follow);

let dbconf;
// is the environment variable, NODE_ENV, set to PRODUCTION? 
if (process.env.NODE_ENV === 'PRODUCTION') {
 // if we're in PRODUCTION mode, then read the configration from a file
 // use blocking file io to do this...
 	const fs = require('fs');
 	const path = require('path');
 	const fn = path.join(__dirname, 'config.json');
 	const data = fs.readFileSync(fn);

 // our configuration file will be in json, so parse it and set the
 // conenction string appropriately!
	const conf = JSON.parse(data);
	dbconf = conf.dbconf;
	console.log(dbconf);
} else {
 // if we're not in PRODUCTION mode, then use
	dbconf = 'mongodb://localhost/gjh267';
}

// Connection to the MongoDB for the web app
mongoose.connect(dbconf);

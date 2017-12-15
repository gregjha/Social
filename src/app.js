const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const publicPath = path.resolve(__dirname, 'public');
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const InstaFeed = require('instafeed.js');
app.use(express.static(publicPath));

require('./db');
const mongoose = require('mongoose');
const Users = mongoose.model('Users');
const Follow = mongoose.model('Follow');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

passport.use(new Strategy(
  function(username, password, cb) {
    Users.findOne({username: username}, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
  }));

passport.serializeUser(function(user, cb) {
  cb(null, user._id);
});

passport.deserializeUser(function(id, cb) {
  Users.findOne({_id: id}, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

app.set('view engine', 'hbs');
app.use(passport.initialize());
app.use(passport.session());

app.get('/css/base.css', function(req, res) {
	res.sendFile('/css/base.css');
});

app.get('/', function(req, res) {
  res.render('home', {'webtitle':'Social - Home'});
});

app.get('/login', function(req, res){
  res.render('home', {'webtitle': 'Social - Login Error', error: 'Must be logged in'});
});

app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/settings');
  });

app.get('/register', function(req, res) {
  res.render('register');
});

app.post('/register', function(req,res) {
  const newUser = {username: req.body.username, password: req.body.password, twitter: req.body.twitter, instagram: req.body.instagram, facebook: req.body.facebook};
  new Users({
    username: newUser.username,
    password: newUser.password,
    twitterUsername: newUser.twitter,
    instagramID: newUser.instagram,
    fbUsername: newUser.facebook  
  }).save(function(){
    res.redirect('/');
  });
});

app.get('/settings', require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('settings', {insta: req.user.instagramID, fb: req.user.fbUsername, twitter: req.user.twitterUsername, username: req.user.username});
  });

app.post('/settings/change', function(req, res) {
	Users.findOneAndUpdate({username: req.user.username}, {$set: {twitterUsername: req.body.twitter, instagramID: req.body.instagram}}, function(){
      res.redirect('/settings');
  });
});

app.get('/search', function(req, res) {
  Users.find(function(err, data){
    const users = data.filter(function(user){
      if (req.query.search === "" || req.query.search === undefined){
        return user;
      }
      else{
        return user.username === req.query.search;
      }
    });
    res.render('search', {'webtitle':'Social - Search', 'users':users, 'totalusers': users.length});
  });
}); 

app.get('/profile/:slug', function(req, res) {
  Users.find(function(err,data){
    const users = data.filter(function(user){
      if (req.params.slug === "" || req.params.slug === undefined){
        return user;
      }
      else{
        return user.username === req.params.slug;
      }
    });
    res.render('user', {'instagramID':users[0].instagramID, 'twitter':users[0].twitterUsername, 'fb':users[0].fbUsername});
  }); 
});

app.get('/logout',
  function(req, res){
    req.logout();
    res.redirect('/');
  });

app.get('/follow', require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    Users.find(function(err,data){
      const users = data.filter(function(user){
        return user.username === req.user.username;
      });
      res.render('follow', {'follow':users[0].following, 'username': req.user.username});
    });  
  });

app.post('/newfollow', function(req,res){
  const newUrl = '/profile/'+req.body.newfollow;
  const newFollow = new Follow({
    username: req.body.newfollow,
    url: newUrl
  });
  newFollow.save(function(err){
      Users.findOneAndUpdate({'username':req.user.username}, {$push: {following: newFollow}}, function(){
      res.redirect('/follow');
    });
  });
}); 


app.listen(process.env.PORT || 8080);
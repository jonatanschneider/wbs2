import * as express from 'express';
import session = require('express-session');
import * as passport from 'passport';
import * as pGoogle from 'passport-google-oauth20';
import { Profile } from 'passport';

let router = express();

router.use(session({
	resave: true,
	saveUninitialized: true,
	rolling: true,
	secret: 'Webbasierte Mongotiere'
}));

router.use('/client', express.static(__dirname + '/client'));
router.use('/jquery', express.static(__dirname + '/node_modules/jquery'));
router.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap'));

router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser(function (profile: Profile, done) {
	done(null, profile);
});

passport.deserializeUser(function (profile: Profile, done) {
	done(null, profile);
});

router.get('/', function (req, res) {
	res.sendFile(__dirname + '/client/index.html');
});

router.get('/profile', isLoggedIn, function (req, res) {
	console.log('/profile was called');
	res.sendFile(__dirname + '/client/profile.html');
});

router.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

router.get('/userProfile', isLoggedIn, function (req, res) {
	res.status(200);

	let user = {
		user: req.user
	};

	res.send(JSON.stringify(user));
});

router.get('/auth/google', passport.authenticate('google', {
	scope: [
		'profile',
		'email'
	]
}));

router.get('/auth/google/callback', passport.authenticate('google', {
	successRedirect: '/profile',
	failureRedirect: '/'
}));

function isLoggedIn(req, res, next) {
	console.log('A login check will be performed');
	if (req.isAuthenticated()) {
		console.log('... Login successful');
		return next;
	}

	console.log('... Login failed');
	res.sendFile(__dirname + '/client/login.html');
}

let GoogleStrategy = pGoogle.Strategy;
passport.use(new GoogleStrategy({
		clientID: '',
		clientSecret: '',
		callbackURL: 'http://localhost:8080/auth/google/callback',
		passReqToCallback: true
	},
	function (req, accessToken, refreshToken, profile, done) {
		done(null, profile);
	}));

router.listen(8080);
console.log("http://localhost:8080");

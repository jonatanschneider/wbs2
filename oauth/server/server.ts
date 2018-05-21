/*****************************************************************************
 ***  Import some module from node.js (see: expressjs.com/en/4x/api.html)    *
 *****************************************************************************/
import * as path from 'path';
import * as express from 'express';
import * as session from 'express-session';
import * as passport from 'passport';
import { Profile } from 'passport';
import * as pFacebook from 'passport-facebook';
import * as pTwitter from 'passport-twitter';
import * as pInstagram from 'passport-instagram';
import * as pGoogle from 'passport-google-oauth20';
import * as request from 'request-promise';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import bodyParser = require('body-parser');

/*****************************************************************************
 ***  Create servers with handler function and start it                      *
 *****************************************************************************/
let privateKey = fs.readFileSync(__dirname + '/sslcert/localhost.key', 'utf8');
let certificate = fs.readFileSync(__dirname + '/sslcert/localhost.crt', 'utf8');
let credentials = {key: privateKey, cert: certificate};
let router = express();
// router.listen(8080);
https.createServer(credentials, router).listen(8443);
http.createServer(router).listen(8080);
console.log(`
	-------------------------------------------------------------
	Aufruf: https://localhost:8443
	-------------------------------------------------------------
`);

/*****************************************************************************
 ***  set up session- and authentication management with passport            *
 *****************************************************************************/

//--- session management -----------------------------------------------------
router.use(session({
	resave: true,    // save session even if not modified
	saveUninitialized: true,    // save session even if not used
	rolling: true,    // forces cookie set on every response
	secret: 'secret' // encrypt session-id in cookie using "secret"
}));

//--- middleware routers to initialize passport and set up session ------------
router.use(passport.initialize());
router.use(passport.session()); // persistent login sessions

//--- used to (de-)serialize the user for the session -------------------------
passport.serializeUser(function (profile: Profile, done) {
	done(null, profile);
});
passport.deserializeUser(function (profile: Profile, done) {
	done(null, profile);
});

//--- Define structure of authentification credentials ------------------------
interface iAuth {
	callbackURL: string
}

interface iFacebookAuth extends iAuth {
	clientID: string,
	clientSecret: string,
}

interface iInstagramAuth extends iAuth {
	clientID: string,
	clientSecret: string
}

interface iTwitterAuth extends iAuth {
	consumerKey: string,
	consumerSecret: string
}

interface iGoogleAuth extends iAuth {
	clientID: string,
	clientSecret: string
}

//--- Store authentification credentials in a class ---------------------------
class AuthConfig {
	// ToDo: Insert authentication data here
	// https://developers.facebook.com/
	facebookAuth: iFacebookAuth = {
		clientID: '',                  // your App ID
		clientSecret: '', // your App Secret
		callbackURL: 'https://localhost:8443/auth/facebook/callback'
	};
	// https://apps.twitter.com/
	twitterAuth: iTwitterAuth = {
		consumerKey: '',
		consumerSecret: '',
		callbackURL: 'https://localhost:8443/auth/twitter/callback'
	};
	// https://www.instagram.com/developer/
	instagramAuth: iInstagramAuth = {
		clientID: '',
		clientSecret: '',
		callbackURL: 'https://localhost:8443/auth/instagram/callback'
	};
	// https://console.developers.google.com/apis/dashboard
	googleAuth: iGoogleAuth = {
		clientID: '',
		clientSecret: '',
		callbackURL: 'https://localhost:8443/auth/google/callback'
	}
}

let configAuth: AuthConfig = new AuthConfig();

//--- Strategies  -------------------------------------------------------------
let FacebookStrategy = pFacebook.Strategy;

let TwitterStrategy = pTwitter.Strategy;

let InstagramStrategy = pInstagram.Strategy;

let GoogleStrategy = pGoogle.Strategy;

let fbAccessToken: string;
let fbUserId: string;
//--- FACEBOOK ----------------------------------------------------------------
passport.use(new FacebookStrategy({
		clientID: configAuth.facebookAuth.clientID,
		clientSecret: configAuth.facebookAuth.clientSecret,
		callbackURL: configAuth.facebookAuth.callbackURL,
		passReqToCallback: true
	},
	function (req, accessToken, refreshToken, profile, done) {
		fbAccessToken = accessToken;
		fbUserId = profile.id;
		// set up parameters of Graph-API request
		const options = {
			method: 'GET',
			uri: 'https://graph.facebook.com/v3.0/me',
			qs: {
				access_token: accessToken,
				fields: 'email, picture, gender, first_name, last_name'
			}
		};
		// request Graph-API
		request(options)
			.then(fbRes => {
				let parsedRes = JSON.parse(fbRes);
				// add some attributes to the user
				profile.emails = [{value: parsedRes.email}];
				profile.photos = [{value: parsedRes.picture.data.url}];
				profile.gender = parsedRes.gender;
				profile.name.givenName = parsedRes.first_name;
				profile.name.familyName = parsedRes.last_name;
				done(null, profile);
			})
			.catch((err) => {
				console.log('Error: ' + err);
			});
	}
));

//--- TWITTER ----------------------------------------------------------------
passport.use(new TwitterStrategy({
	consumerKey: configAuth.twitterAuth.consumerKey,
	consumerSecret: configAuth.twitterAuth.consumerSecret,
	callbackURL: configAuth.twitterAuth.callbackURL,
	passReqToCallback: true
}, function (req, token, tokenSecret, profile, done) {
	done(null, profile);
}));

//--- INSTAGRAM ----------------------------------------------------------------
passport.use(new InstagramStrategy({
		clientID: configAuth.instagramAuth.clientID,
		clientSecret: configAuth.instagramAuth.clientSecret,
		callbackURL: configAuth.instagramAuth.callbackURL,
	},
	function (accessToken, refreshToken, profile, done) {
		const options = {
			method: 'GET',
			uri: 'https://api.instagram.com/v1/users/self/',
			qs: {
				access_token: accessToken
			}
		};
		request(options).then(igRes => {
			let parsedRes = JSON.parse(igRes);
			profile.emails = [{value: parsedRes.data.email}];
			profile.photos = [{value: parsedRes.data.profile_picture}];
			profile.gender = parsedRes.gender;
			profile.name.givenName = '';
			profile.name.familyName = parsedRes.data.full_name;
			done(null, profile);
		})
			.catch((err) => {
				console.log('Error: ' + err);
			});
	}));


//--- GOOGLE ----------------------------------------------------------------
passport.use(new GoogleStrategy({
	clientID: configAuth.googleAuth.clientID,
	clientSecret: configAuth.googleAuth.clientSecret,
	callbackURL: configAuth.googleAuth.callbackURL,
}, function (req, accessToken, refreshToken, profile, done) {
	const options = {
		method: 'GET',
		uri: 'https://www.googleapis.com/auth/plus.me',
		qs: {
			access_token: accessToken,
			fields: 'email, picture, gender, first_name, last_name'
		}
	};
	request(options).then(() => {
		done(null, profile);
	})
		.catch((err) => {
			console.log('Error: ' + err);
		});
}));

/*****************************************************************************
 *** route middleware to make sure a user is logged in                       *
 *****************************************************************************/
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated()) {
		return next();
	}
	// if they aren't redirect them to the home page
	res.sendFile(viewPath + '/login.html');
}


/*****************************************************************************
 ***  routes                                                                 *
 *****************************************************************************/

//--- get some paths ----------------------------------------------------------
let clientPath: string = path.resolve(__dirname + '/../client/');
let viewPath: string = clientPath + '/views/';

//--- static routes -----------------------------------------------------------
router.use('/client', express.static(clientPath));
router.use('/jquery', express.static(clientPath + '/node_modules/jquery/dist'));

//--- route for showing the index page ----------------------------------------
router.get('/', function (req, res) {
	res.sendFile(viewPath + '/index.html');
});

// route for showing the profile page -----------------------------------------
router.get('/profile', isLoggedIn, function (req, res) {
	res.sendFile(viewPath + '/profile.html');
});

//--- route for logging out ---------------------------------------------------
router.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

//--- route for showing profile data ------------------------------------------
router.get('/userProfile', isLoggedIn, function (req, res) {
	res.status(200);
	let user = {
		user: req.user // get the user out of session and pass to template
	};
	res.send(JSON.stringify(user));
});


/*****************************************************************************
 ***  SocialMedia routers                                                    *
 *****************************************************************************/

//--- FACEBOOK routes ---------------------------------------------------------
router.get('/auth/facebook',
	passport.authenticate('facebook', {
		scope: ['public_profile', 'email', 'publish_actions']
	})
);
router.get('/auth/facebook/callback',
	passport.authenticate('facebook', {
		successRedirect: '/profile',
		failureRedirect: '/'
	})
);

//--- TWITTER routes ---------------------------------------------------------
router.get('/auth/twitter', passport.authenticate('twitter'));

router.get('/auth/twitter/callback',
	passport.authenticate('twitter', {
		successRedirect: '/profile',
		failureRedirect: '/'
	})
);

//--- INSTAGRAM routes ---------------------------------------------------------
router.get('/auth/instagram', passport.authenticate('instagram', {
		scope: ['basic']
	})
);

router.get('/auth/instagram/callback',
	passport.authenticate('instagram', {
		successRedirect: '/profile',
		failureRedirect: '/'
	})
);

//--- GOOGLE routes ---------------------------------------------------------
router.get('/auth/google',
	passport.authenticate('google', {
		scope: ['profile', 'email']
	})
);
router.get('/auth/google/callback',
	passport.authenticate('google', {
		successRedirect: '/profile',
		failureRedirect: '/'
	})
);

router.use(bodyParser.urlencoded({
	extended: true
}));

router.post('/createPost', function (req, res) {
	const options = {
		method: 'POST',
		uri: 'https://graph.facebook.com/v3.0/me/feed',
		qs: {
			access_token: fbAccessToken,
			message: req.body.input
		}
	};
	request(options).then(fbRes => {
		res.status(201);
		res.send(fbRes);
	}).catch(err => {
		res.status(400);
		res.send(err);
	});
});

router.delete('/deletePost', function (req, res) {
	const options = {
		method: 'DELETE',
		uri: 'https://graph.facebook.com/v3.0/' + req.body.id,
		qs: {
			access_token: fbAccessToken
		}
	};
	request(options).then(answer => {
		res.status(200);
		res.send(answer);
	}).catch(answer => {
		res.status(400);
		res.send(answer);
	});
});

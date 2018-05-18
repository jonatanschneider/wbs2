/*****************************************************************************
 ***  Import some module from node.js (see: expressjs.com/en/4x/api.html)    *
 *****************************************************************************/
import * as path from 'path';
import * as express from 'express';
import * as session from 'express-session';
import * as passport from 'passport';
import { Profile } from 'passport';
import * as pFacebook from 'passport-facebook';

import * as request from 'request-promise';

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';

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
	clientSecret: string
}

//--- Store authentification credentials in a class ---------------------------
class AuthConfig {
	facebookAuth: iFacebookAuth = {
		clientID: '',                  // your App ID
		clientSecret: '', // your App Secret
		callbackURL: 'https://localhost:8443/auth/facebook/callback'
	};
}

let configAuth: AuthConfig = new AuthConfig();

//--- Strategies  -------------------------------------------------------------
let FacebookStrategy = pFacebook.Strategy;
/*
let TwitterStrategy   = pTwitter.Strategy;
let InstagramStrategy = pInstagram.Strategy;
let GoogleStrategy    = pGoogle.Strategy;
*/

//--- FACEBOOK ----------------------------------------------------------------
passport.use(new FacebookStrategy({
		clientID: configAuth.facebookAuth.clientID,
		clientSecret: configAuth.facebookAuth.clientSecret,
		callbackURL: configAuth.facebookAuth.callbackURL,
		passReqToCallback: true
	},
	function (req, accessToken, refreshToken, profile, done) {
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
		scope: ['public_profile', 'email']
	})
);
router.get('/auth/facebook/callback',
	passport.authenticate('facebook', {
		successRedirect: '/profile',
		failureRedirect: '/'
	})
);

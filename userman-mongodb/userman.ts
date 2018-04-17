/*****************************************************************************
 ***  Import some module from node.js (see: expressjs.com/en/4x/api.html)    *
 *****************************************************************************/
import * as express from 'express';         // routing
import * as bodyParser from 'body-parser';     // parsing parameters
import * as session from 'express-session'; // sessions
import * as cryptoJS from 'crypto-js';       // crypting
import * as socket from 'socket.io';

import { Request, Response } from 'express';
import {
	Collection,
	Db,
	DeleteWriteOpResultObject,
	InsertOneWriteOpResult,
	MongoClient,
	MongoError,
	UpdateWriteOpResult
} from 'mongodb';
import { ObjectID } from 'bson';

/*****************************************************************************
 ***  setup database and its structure                                       *
 *****************************************************************************/
//---- Object with connection parameters --------------------------------------
let usermanDb: Db;
let users: Collection<any>;

MongoClient.connect('mongodb://localhost:27017').then((dbClient: MongoClient) => {
	usermanDb = dbClient.db('userman');
	users = usermanDb.collection('userlist');
	console.log('Database is connected! \n');
}).catch((err: MongoError) => {
	console.error('Error connection to database\n' + err);
});

//--- Data structure that represents a user in database -----------------------
class User {
	time: string; // time-time format defined[RFC 3339] e.g. 2017-12-31T23:59:6
	username: string;
	vorname: string;
	nachname: string;
	password: string;

	constructor(time: string, username: string, vorname: string, nachname: string, password: string) {
		this.time = time;
		this.username = username;
		this.vorname = vorname;
		this.nachname = nachname;
		this.password = password;
	}
}

/*****************************************************************************
 ***  Create server with handler function and start it                       *
 *****************************************************************************/
let router = express();
let server = router.listen(8080, function () {
	console.log('');
	console.log('-------------------------------------------------------------');
	console.log('  userMan (complete)');
	console.log('  (Dokumentation als API-Doc)');
	console.log('  Dokumentation erstellen mit (im Terminal von webStorm)');
	console.log('     \'apidoc -o apidoc -e node_modules\' ');
	console.log('  Dokumentation aufrufen:');
	console.log('     Doppelklick auf: apidoc/index.html ');
	console.log('');
	console.log('  Aufruf: http://localhost:8080/views/client.html');
	console.log('-------------------------------------------------------------');
});

/*****************************************************************************
 ***  set up webSocket                                                       *
 *****************************************************************************/
let io = socket(server);
io.on('connection', (socket) => {
	console.log('made socket connection', socket.id);
	//--- Handle lock event -----------------------------------------------------
	socket.on('lock', function (user) {
		socket.broadcast.emit('lock', user);
	});
	//--- Handle update event ---------------------------------------------------
	socket.on('update', function () {
		socket.broadcast.emit('update');
	});
	//--- Handle disconnect event -----------------------------------------------
	socket.on('disconnect', function () {
		socket.broadcast.emit('update');
	});
});

/*****************************************************************************
 ***  Rights Management (class and function)                                 *
 *****************************************************************************/
//--- Class that deals with Rights --------------------------------------------
class Rights {
	admin: boolean; // user is administrator
	superadmin: boolean; // user is super-administrator
	// can be extended here with other user-roles
	constructor(admin: boolean, superadmin: boolean) {
		this.admin = admin;
		this.superadmin = superadmin;
		// can be extended here with other user roles
	}
}

//--- checkRight, is there still a session and are the rights sufficient ------
function checkRights(req: Request, res: Response, rights: Rights): boolean {
	let response: {
		message: string;
		userList: User[];
		user: User;
		username: string
	};

	//--- check if session is existing ------------------------------------------
	if (!req.session.rights) {
		response = {
			message: 'No session: Please log in',
			userList: null,
			user: null,
			username: null
		};
		res.status(401);     // set HTTP response state
		res.json(response);  // send HTTP-response
		return false;
	}

	//--- check rights against the needed rights (provided as parameter) --------
	else {
		let rightsOK: boolean = true;
		let message: string = 'unsufficient rights';
		if (rights.admin) {  // checks if "admin" is needed
			rightsOK = rightsOK && req.session.rights.admin;
			message += ': not logged in'
		}
		if (rights.superadmin) { // ckecks if "superadmin" is needed
			rightsOK = rightsOK && req.session.rights.superadmin;
			message += ', not admin';
		}
		// can be extended here checking other user roles
		if (!rightsOK) {
			response = {
				message: message,
				userList: null,
				user: null,
				username: null
			};
			res.status(401);     // set HTTP response state
			res.json(response);  // send HTTP-response
			return false;
		}
	}

	//--- return TRUE if everthing was o.k. --------------------------------------
	return true;

}


/*****************************************************************************
 *** sendData                                                                *
 *** Function that is called by each route to send data                      *
 *** gets userList from database , constructs and send response              *
 *****************************************************************************/
function sendData(status: number, res: Response,
				  message: string, user: User, username: string) {
	/**
	  status   : HTTP response state            (provided in any case)
	  res      : Response object for responding (provided in any case)
	  message  : Message to be returned         (provided in any case)
	  user     : data of one user     (provided only in "READ"-Route)
	  username : name of the user     (provided only during login-accesses)
	*/

	//--- Variable declaration with detailed type of response -------------------
	let response: {
		message: string;
		userList: User[];
		user: User;
		username: string
	};

	let query: Object = {};
	users.find(query).toArray()
		.then((users: User[]) => {
			response = {
				message: message,
				userList: users,
				user: user,
				username: username
			}
		})
		.catch((error: MongoError) => {
			console.log('Database error: ' + error);
			status = 505;
			response = {
				message: 'Database error: ' + error,
				userList: [],
				user: user,
				username: username
			}
		})
		.then(() => {
			res.status(status);
			res.send(response);
		});
}

/*****************************************************************************
 ***  Static routers                                                         *
 ****************************************************************************/
router.use('/views', express.static(__dirname + '/views'));
router.use('/css', express.static(__dirname + '/css'));
router.use('/client', express.static(__dirname + '/client'));
router.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist'));
router.use('/socketio', express.static(__dirname + '/node_modules/socket.io-client/dist'));

/*****************************************************************************
 ***  Middleware Routers for Parsing, Session- and Rights-Management         *
 *****************************************************************************/
//--- parsing json -----------------------------------------------------------
router.use(bodyParser.json());
//--- session management -----------------------------------------------------
router.use(session({
	// save session even if not modified
	resave: true,
	// save session even if not used
	saveUninitialized: true,
	// forces cookie set on every response needed to set expiration (maxAge)
	rolling: true,
	// name of the cookie set is set by the server
	name: 'mySessionCookie',
	// encrypt session-_id in cookie using "secret" as modifier
	secret: 'geheim',
	// set some cookie-attributes. Here expiration-date (offset in ms)
	cookie: {maxAge: 10 * 60 * 1000},
}));

/*****************************************************************************
 ***  Dynamic Routers                                                        *
 *****************************************************************************/
/**
 * --- common api-description: 400 BadRequest --------------------------
 * @apiDefine BadRequest
 * @apiError (Error 400) {string} message  description of the error
 * @apiError (Error 400) {json[]} userList List of users: [{"vorname":string, "nachname":string}, ...]
 * @apiErrorExample 400 (Bad Request) Example 1
 * HTTP/1.1 400 Bad Request
 * {
 *   "message"  : "vorname or nachname not provided",
 *   "userList" : [
 *     {"vorname":"Max",   "nachname":"Mustermann"},
 *   ]
 * }
 * @apiErrorExample 400 (Bad Request) Example 2
 * HTTP/1.1 400 Bad Request
 * {
 *   "message"  : "Id 'Hans' not a number",
 *   "userList" : [
 *     {"vorname":"Max",   "nachname":"Mustermann"},
 *   ]
 * }
 */
/**
 * --- common api-description: 403 Forbidden ---------------------------
 * @apiDefine Forbidden
 * @apiError (Error 403) {string}   message  description of the error
 * @apiError (Error 403) {object[]} userList List of users: [{"vorname":string, "nachname":string}, ...]
 * @apiErrorExample 403 (Forbidden) Example
 * HTTP/1.1 403 Forbidden
 * {
 *   "message"  : "Admin can not be deleted",
 *   "userList" : [
 *     {"vorname":"Max",   "nachname":"Mustermann"},
 *     {"vorname":"Sabine","nachname":"Musterfrau"}
 *   ]
 * }
 */
/**
 * --- common api-description: 404 NotFound ----------------------------
 * @apiDefine NotFound
 * @apiError (Error 404) {string} message  description of the error
 * @apiError (Error 404) {json[]} userList List of users: [{"vorname":string, "nachname":string}, ...]
 * @apiErrorExample 404 (Not Found) Example
 * HTTP/1.1 404 Not Found
 * {
 *   "message"  : "Id 42 out of index range",
 *   "userList" : [
 *     {"vorname":"Max",   "nachname":"Mustermann"},
 *     {"vorname":"Sabine","nachname":"Musterfrau"}
 *   ]
 * }
 *
 */
/**
 * --- common api-description: 410 Gone --------------------------------
 * @apiDefine Gone
 * @apiError (Error 410) {string}   message  description of the error
 * @apiError (Error 410) {object[]} userList List of users: [{"vorname":string, "nachname":string}, ...]
 * @apiErrorExample 410 (Gone) Example
 * HTTP/1.1 410 Gone
 * {
 *   "message"  : "User with _id 2 already deleted",
 *   "userList" : [
 *     {"vorname":"Max",   "nachname":"Mustermann"},
 *     {"vorname":"Sabine","nachname":"Musterfrau"}
 *   ]
 * }
 */

/**
 * --- check login with: post /login/check -----------------------------
 * @api        {post} /login/check check if user is logged in
 * @apiVersion 1.0.0
 * @apiName    LoginCheck
 * @apiGroup   login
 * @apiDescription
 * This route checks, if a user is still logged in <br />
 * This is done by checking, if session-variable "username" still exists
 * @apiExample {url} Usage Example
 * http://localhost:8080/login/check
 *
 * @apiSuccess (Success 200) {string}  message  user Musterfrau still logged in
 * @apiSuccess (Success 200) {string}  username name of the user that is logged in
 * @apiSuccessExample {json} 200 (OK) Example
 * HTTP/1.1 200 OK
 * { "message"  : "user Musterfrau still logged in",
 *   "username" : "Musterfrau"                            }
 */
router.get('/login/check', function (req: Request, res: Response) {
	let message: string;

	//--- check Rights -> RETURN if not sufficient ------------------------------
	if (!checkRights(req, res, new Rights(true, false))) {
		return;
	}

	//--- ok -> set up message and send data ------------------------------------
	message = 'user still logged in';
	sendData(200, res, message, null, req.session.username);
});
/**
 * --- login with: post /login -----------------------------------------
 * @api        {post} /login loggin user
 * @apiVersion 1.0.0
 * @apiName    Login
 * @apiGroup   login
 * @apiDescription
 * This route checks, if a user is still logged in <br />
 * This is done by checking, if session-variable "username" still exists
 * @apiExample {url} Usage Example
 * http://localhost:8080/login
 */
router.post('/login', function (req: Request, res: Response) {
	let status: number = 500;  // Initial HTTP response status
	let message: string = ''; // To be set
	let username: string = req.body.username;
	let password: string = req.body.password;

	//---- ok -> check username/password in database and set Rights -------------
	if (username != '' && password != '') { // there must be username and password
		let query: Object = {
			username: username,
			password: cryptoJS.MD5(password).toString()
		};
		users.find(query).toArray()
			.then((users: User[]) => {
				if (users.length === 1) {
					message = username + ' logged in by username/password';
					req.session.username = username;
					req.session.rights = new Rights(true, true);
					status = 200;
				} else {
					message = 'Not valid: user \'' + username + '\' does not match password';
					status = 401;
				}
			})
			.catch((error: MongoError) => {
				message = 'Database error: ' + error;
				status = 505;
			})
			.then(() => {
				sendData(status, res, message, null, username);
			});
	}
	//--- nok -------------------------------------------------------------------
	else { // either username or password not provided
		message = 'Bad Request: not all mandatory parameters provided';
		status = 400;
		sendData(status, res, message, null, username);
	}
});
/**
 * --- logout with: post /logout ---------------------------------------
 * @api        {post} /login/check check if user is logged in
 * @apiVersion 1.0.0
 * @apiName    Logout
 * @apiGroup   login
 * @apiDescription
 * This route logges out a user
 * @apiExample {url} Usage Example
 * http://localhost:8080/logout
 *
 * @apiSuccess (Success 200) {string}  message  user logout successfull
 * @apiSuccess (Success 200) {string}  username name of the user that is logged in
 * @apiSuccessExample {json} 200 (OK) Example
 * HTTP/1.1 200 OK
 * { "message"  : "Musterfrau logout successfull",
 *   "username" : "Musterfrau"                            }
 */
router.post('/logout', function (req: Request, res: Response) {
	let message: string;

	//--- check Rights -> RETURN if not sufficient ------------------------------
	if (!checkRights(req, res, new Rights(true, false))) {
		return;
	}

	//--- ok -> delete session-variable and reset Rights ------------------------
	let username: string = req.session.username;
	req.session.username = null; // delete session-variable
	req.session.rights = null; // reset all Rights
	message = username + ' logout successfull';
	sendData(200, res, message, null, username);

});

/**
 * --- create new user with: post /user --------------------------------
 * @api        {post} /user Create new user
 * @apiVersion 1.0.0
 * @apiName    CreateUser
 * @apiGroup   User
 * @apiDescription
 * This route creates a new user with provided parameters and returns <br />
 * - a message with the attributes of the newly created user
 * - a userList containing all users
 * - a user-Object with all attributes of the created user<br/><br/>
 * @apiExample {url} Usage Example
 * http://localhost:8080/user
 *
 * @apiParam {string} vorname  surname of the user
 * @apiParam {string} nachname lastname of the user
 * @apiParamExample {json} Parameters Example
 * vorname=Max&nachname=Mustermann
 *
 * @apiSuccess (Success 201) {string}  message  attributes of newly created user
 * @apiSuccess (Success 201) {json[]}  userList List of users: [{"vorname":string, "nachname":string, ...}, ...]
 * @apiSuccess (Success 201) {Object}  user that have been created: {"vorname":string, "nachname":string, ...}
 * @apiSuccessExample {json} 201 (Created) Example
 * HTTP/1.1 201 Created
 * { "message"  : "Sabine Musterfrau successfully added",
 *   "userList" : [ {"vorname":"Max",   "nachname":"Mustermann", "time":"23.02.2017 15:27:00"},
 *                  {"vorname":"Sabine","nachname":"Musterfrau", "time":"23.02.2017 15:28:00"} ],
 *   "user"     : { {"vorname":"Sabine","nachname":"Musterfrau", "time":"23.02.2017 15:28:00"} } }
 *
 * @apiUse BadRequest
 */
router.post('/user', function (req: Request, res: Response) {
	let username: string = (req.body.username ? req.body.username : '').trim();
	let password: string = (req.body.password ? req.body.password : '').trim();
	let vorname: string = (req.body.vorname ? req.body.vorname : '').trim();
	let nachname: string = (req.body.nachname ? req.body.nachname : '').trim();
	let message: string = '';
	let status: number = 500; // Initial HTTP response status

	//--- check Rights -> RETURN if not sufficient ------------------------------
	if (!checkRights(req, res, new Rights(true, false))) {
		return;
	}

	//-- ok -> insert user-data into database -----------------------------------
	if ((username != '') && (vorname != '') && (nachname != '')) {
		let user: User = new User(
			new Date().toLocaleString(),
			username,
			vorname,
			nachname,
			cryptoJS.MD5(password).toString());
		users.insertOne(user)
			.then((result: InsertOneWriteOpResult) => {
				if (result.insertedCount === 1) {
					message = 'Created';
					status = 201;
				} else {
					message = 'Database error: How do I even got here';
					status = 505;
				}
			})
			.catch((error: MongoError) => {
				message = 'Database error: ' + error;
				status = 505;
			})
			.then(() => {
				sendData(status, res, message, null, null);
			});
	}
	//--- nok -------------------------------------------------------------------
	else { // some parameters are not provided
		message = 'Bad Request: not all mandatory parameters provided';
		sendData(400, res, message, null, null); // send message and all data
	}
});
/**
 * --- get user with /user/:_id -----------------------------------------
 * @api        {get} /user/:_id Read User information
 * @apiVersion 1.0.0
 * @apiName    ReadUser
 * @apiGroup   Use
 *
 * @apiParam {number} :_id  URL-parameter: <code>_id</code> of the user to be read
 *
 * @apiDescription
 * This route reads the attributes of a user with provided <code>_id</code> and returns <br />
 * - a message with the attributes of user with _id <code>_id</code><br />
 * - an userList containing all users
 * - a user-Object with all attributes of the read user<br/><br/>
 *
 * @apiExample {url} Usage Example
 * http://localhost:8080/user/0
 *
 * @apiSuccess (Success 200) {string}  message  attributes of user with _id <code>_id</code>
 * @apiSuccess (Success 200) {json[]}  userList List of users: [{"vorname":string, "nachname":string, ...}, ...]
 * @apiSuccess (Success 200) {Object}  user that have been read: {"vorname":string, "nachname":string, ...}
 * @apiSuccessExample {json} 200 (ok) Example
 * HTTP/1.1 200 ok
 * { "message"  : "Selected item is Max Mustermann",
 *   "userList" : [ {"vorname":"Max",   "nachname":"Mustermann", "time":"23.02.2017  15:27:00"},
 *                  {"vorname":"Sabine","nachname":"Musterfrau", "time":"23.02.2017  15:28:00"} ],
 *   "user"     : { {"vorname":"Max",   "nachname":"Mustermann", "time":"23.02.2017  15:27:00"} } }
 *
 * @apiUse BadRequest
 * @apiUse NotFound
 * @apiUse Gone
 */
router.get('/user/:_id', function (req: Request, res: Response) {
	let status: number = 500; // Initial HTTP response status
	let message: string = '';  // To be set
	let id: string = req.params._id;
	let requestedUser: User = null;

	//--- check Rights -> RETURN if not sufficient ------------------------------
	if (!checkRights(req, res, new Rights(true, false))) {
		return;
	}

	//--- ok -> get user from database ------------------------------------------
	if (id) { // _id must be provided and valid
		let query: Object = new ObjectID(id);
		users.findOne(query)
			.then((user: User) => {
				if (user != null) {
					requestedUser = user;
					message = 'Selected item is ' + user.vorname + ' ' + user.nachname;
					status = 200;
				} else {
					message = 'Id ' + id + ' not found';
					status = 404;
				}
			})
			.catch((error: MongoError) => {
				message = 'Database error: ' + error;
				status = 505;
			})
			.then(() => {
				sendData(status, res, message, requestedUser, null);
			});
	}
	//--- nok -------------------------------------------------------------------
	else {// _id is not valid, e.g. not a number
		message = 'Id ' + id + ' not valid';
		status = 500;
		sendData(status, res, message, null, null);
	}
});
/**
 * --- update user with: put /user/:_id ---------------------------------
 * @api        {put} /user/:_id Update user
 * @apiVersion 1.0.0
 * @apiName    UpdateUser
 * @apiGroup   User
 * @apiDescription
 * This route changes attributes of a user with provided <code>_id</code><br />
 * Only the provided (optional) parameters are hanged.
 * "Update User" returns <br />
 * - a message with the attributes of the updated user
 * - a userList containing all users
 * - a user-Object with all attributes of the updated user<br/><br/>
 *
 * @apiExample {url} Usage Example
 * http://localhost:8080/user/1
 *
 * @apiParam {number} :_id  URL-parameter: <code>_id</code> of the user to be updated
 * @apiParam {string} [vorname]  surname of the users
 * @apiParam {string} [nachname] lastname of the user
 *
 * @apiParamExample {urlencoded} Parameters Example
 * vorname=Max&nachname=Mustermann
 *
 * @apiSuccess (Success 200) {string}  message  attributes of newly created user
 * @apiSuccess (Success 200) {json[]}  userList List of users: [{"vorname":string, "nachname":string, ...}, ...]
 * @apiSuccess (Success 200) {Object}  user the user-data after update: {"vorname":string, "nachname":string, ...}
 * @apiSuccessExample {json} 201 (Created) Example
 * HTTP/1.1 200 Ok
 * { "message"  : "Updated item is Sabine Mustermann",
 *   "userList" : [ {"vorname":"Max",   "nachname":"Mustermann", "time":"23.02.2017  15:27:00"},
 *                  {"vorname":"Sabine","nachname":"Mustermann", "time":"23.02.2017  15:28:00"} ],
 *   "user"     : { {"vorname":"Sabine","nachname":"Mustermann", "time":"23.02.2017  15:28:00"} } }
 *
 * @apiUse BadRequest
 * @apiUse NotFound
 * @apiUse Gone
 */
router.put('/user/:_id', function (req: Request, res: Response) {
	let status: number = 500; // Initial HTTP response status
	let message: string = ''; // To be set
	let query: Object = null;
	let updateData: Object;

	//--- check Rights -> RETURN if not sufficient ------------------------------
	if (!checkRights(req, res, new Rights(true, false))) {
		return;
	}

	//--- check if parameters exists -> initialize each if not ------------------
	let id: string = req.params._id;
	let vorname: string = (req.body.vorname ? req.body.vorname : '').trim();
	let nachname: string = (req.body.nachname ? req.body.nachname : '').trim();
	let password: string = (req.body.password ? req.body.password : '').trim();

	//--- ok -> update user with new attributes ---------------------------------
	if (id) { // _id must be provided and valid
		query = {
			_id: new ObjectID(id)
		};

		if (password === '') {
			updateData = {
				vorname: vorname,
				nachname: nachname
			};
		} else {
			updateData = {
				vorname: vorname,
				nachname: nachname,
				password: cryptoJS.MD5(password).toString()
			};
		}
		users.updateOne(query, {$set: updateData})
			.then((result: UpdateWriteOpResult) => {
				if (result.matchedCount === 1) {
					message = 'Successfuly updated';
					status = 201;
				} else {
					message = 'Not valid: _id ' + id + ' not valid';
					status = 500;
				}
			})
			.catch((error: MongoError) => {
				message = 'Database error: ' + error;
				status = 505;
			})
			.then(() => {
				sendData(status, res, message, null, null);
			});
	}
	//--- nok -------------------------------------------------------------------
	else {// _id is not valid, e.g. not a number
		message = 'Id ' + id + ' not valid';
		status = 500;
		sendData(status, res, message, null, null);
	}
});
/**
 * --- delete user with /user/:_id --------------------------------------
 * @api        {delete} /user/:_id Delete User
 * @apiVersion 1.0.0
 * @apiName    DeleteUser
 * @apiGroup   User
 *
 * @apiDescription
 * This route deletes a user with provided <code>_id</code> and returns <br />
 * - a message with the attributes of user with _id <code>_id</code><br />
 * - a userList containing all users
 * - a user-Object with all attributes of the deleted user<br/><br/>
 *
 * @apiExample {url} Usage Example
 * http://localhost:8080/user/0
 *
 * @apiParam {number} :_id  URL-parameter: <code>_id</code> of the user to be deleted
 *
 * @apiSuccess (Success 200) {string}  message  attributes of user with _id <code>_id</code>
 * @apiSuccess (Success 200) {json[]}  userList List of users: [{"vorname":string, "nachname":string}, ...]
 * @apiSuccessExample {json} 200 (ok) Example
 * HTTP/1.1 200 ok
 * { "message"  : "Max Mustermann has been deleted",
 *   "userList" : [ {"vorname":"Sabine","nachname":"Musterfrau", "time":"23.02.2017  15:28:00"} ],
 *   "user"     : { {"vorname":"Max","nachname":"Mustermann", "time":"23.02.2017  15:27:00"} }     }
 *
 * @apiUse BadRequest
 * @apiUse NotFound
 * @apiUse Gone
 * @apiUse Forbidden
 */
router.delete('/user/:_id', function (req: Request, res: Response) {
	let status: number = 500; // Initial HTTP response status
	let message: string = '';  // To be set
	let id: string = req.params._id;

	//--- check Rights -> RETURN if not sufficient ------------------------------
	if (!checkRights(req, res, new Rights(true, false))) {
		return;
	}

	//--- ok -> delete user from database ---------------------------------------
	if (id) { // user with _id=1 (admin) must not be deleted
		let query: Object = {
			_id: new ObjectID(id)
		};

		users.deleteOne(query)
			.then((result: DeleteWriteOpResultObject) => {
				if (result.deletedCount === 1) {
					message = 'Id ' + id + ' sucessfully deleted';
					status = 200;
				} else {
					message = 'Id ' + id + ' not found';
					status = 404;
				}
			})
			.catch((error: MongoError) => {
				message = 'Database error: ' + error;
				status = 505;
			})
			.then(() => {
				sendData(status, res, message, null, null);
			});
	}
	//--- nok -------------------------------------------------------------------
	else {// _id is not valid, e.g. not a number
		message = 'Id ' + id + ' not valid';
		status = 500;
		sendData(status, res, message, null, null);
	}
});

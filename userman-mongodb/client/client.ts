namespace client {


/**********************************************************************************************************************
 *** some global constants and variables                                                                              *
 **********************************************************************************************************************/
const serverURL : string = window.location.protocol + '//' + window.location.host; // eg.: http://localhost
// get own url in macOS:  ifconfig | grep "inet" | grep -v 127.0.0.1
let   username  : string = "";  // holding username of user logged in


/**********************************************************************************************************************
 *** User: class that represents all data that represents a user in the userList                                      *
 **********************************************************************************************************************/
class User {
	id: number;
	username: string;
	vorname: string;
	nachname: string;
	time: string;
}


/**********************************************************************************************************************
 *** Class and Object dealing with settings                                                                           *
 **********************************************************************************************************************/
//--- Class handling settings ------------------------------------------------------------------------------------------
class settingsClass {
	options: boolean[];                   // array to store setting-option values (only boolean values)
	constructor(options: boolean[]) {
		this.options = options;              // just copy given array into internal array
	}
	storeSettings() {
		for (let index in this.options) {    // iterate through all setting-options and save them to localStorage
			localStorage.setItem("option" + index, this.options[index] == true ? "true" : "false");
		}
	}
	restoreSettings() {
		for (let index in this.options) {   // iterate through all setting-options and load them from localStorage
			this.options[index] = (localStorage.getItem("option" + index) == "true");
		}
	}
}
//--- Global variable to store settings --------------------------------------------------------------------------------
let settings: settingsClass = new settingsClass([false, true, true]);  // initialize with three settings


/**********************************************************************************************************************
 *** Connect to server via websocket and listen to websocket-events                                                   *
 **********************************************************************************************************************/
let socket = io.connect(window.location.host);
//--- Listen for lock websocket-event ----------------------------------------------------------------------------------
socket.on('lock', function(user){
	//get DOM element of lock:   <li userid="0"> ... <span class='lock fa fa-lock hide'/> ... </li>
	let lockUser = $("li[userid='" + user.userid +"'] span.lock");
	lockUser.html(" by " + user.username);
	lockUser.removeClass("hide");
});
//--- Listen for update websocket-event --------------------------------------------------------------------------------
socket.on('update', function(){
	checkLogin();
});

/**********************************************************************************************************************
 *** Event-handlers                                                                                                   *
 ***  1. Handler, when clicking the "+"-button or pressing "return" in user-input-field (CREATE)                      *
 ***  2. Handler, when clicking the trash-icon (DELETE)                                                               *
 ***  3. Handler, when clicking on an element in user-line: open edit modal window (READ)                             *
 ***  4. Handler, when clicking on "save"-button (in edit modal window): Save detail information of a user (UPDATE)   *
 ***  5. Handler, when clicking on "cancel"-button (edit window): close edit window                                   *
 ***  6. Handler, when typing filter-characters                                                                       *
 ***  7. Handler, when clicking on "login"-button: login                                                              *
 ***  8. Handler, when clicking on "logout"-button: logout                                                            *
 ***  9. Handler, when clicking on "settings"-button: open settings window check-flags                                *
 *** 10. Handler, when clicking on "save"-button (in sessions modal window): Save settings                            *
 *** 11. Handler, when clicking on "cancel"-button (in sessions modal window): reset check-flags and close window     *
 **********************************************************************************************************************/
//--- 1. Handler, when clicking the "+"-button or pressing "return" in user-input-field (CREATE) -----------------------
function handleCreate() {
	let usernameInput: JQuery = $('#usernameInput'); // input field of username
	let passwordInput: JQuery = $('#passwordInput'); // input field of password
	let vornameInput : JQuery = $('#vornameInput');  // input field of vorname
	let nachnameInput: JQuery = $('#nachnameInput'); // input field of nachname
	// Prevent empty names
	if (((<string>usernameInput.val()).trim().length !== 0) &&
		  ((<string>passwordInput.val()).trim().length !== 0) &&
		  ((<string>vornameInput.val()).trim().length  !== 0) &&
		  ((<string>nachnameInput.val()).trim().length !== 0)) {
		let data: Object = {
			"username" : usernameInput.val(),
			"password" : passwordInput.val(),
			"vorname"  : vornameInput.val(),
			"nachname" : nachnameInput.val()
		};
		$.ajax({                // set up ajax request
			url: serverURL + '/user',
			type: 'POST',    // POST-request for CREATE
			data: JSON.stringify(data),
			contentType: 'application/json',  // using json in request
			dataType: 'json',              // expecting json in response
			error: (jqXHR) => {
				renderResult(jqXHR.responseJSON.message, jqXHR.status);
			},
			success: (data) => {
				socket.emit('update');  // send "update" via websocket to other clients
				renderResult(data.message, 0);
				renderList(data.userList)
			},
		});
		// initialize input field
		usernameInput.val("");
		passwordInput.val("");
		vornameInput.val("");
		nachnameInput.val("");
	}
}

//--- 2. Handler, when clicking the trash-icon (DELETE) ----------------------------------------------------------------
function handleDelete(event: MouseEvent) {
	// the method stopPropagation() stops the bubbling of an event to parent elements,
	// so in this case it prevents "handleRead" from popping up edit window
	event.stopPropagation();
	// delete element with id = userId
	let id: string = $(this).attr("userid"); // "this" referes to current span-element
	$.ajax({
		url: serverURL + '/user/' + id,
		type: 'DELETE',  // DELETE-request for DELETE
		dataType: 'json',    // expecting json
		error: (jqXHR) => {
			renderResult(jqXHR.responseJSON.message, jqXHR.status)
		},
		success: (data) => {
			socket.emit('update');  // send "update" via websocket to other clients
			renderResult(data.message, 0);
			renderList(data.userList)
		},
	});
}

//--- 3. Handler, when clicking on an element in user-line: open edit modal window (READ) ------------------------------
function handleEdit() {
	let id: string = $(this).attr("userid");  // "this" referes to current li element
	if ( $("li[userid='" + id +"'] span.hide").length > 0 ) {  // open edit window, only if not locked (lock hided)
		$.ajax({ // set up ajax request
			url: serverURL + '/user/' + id,
			type: 'GET',    // GET-request for READ
			dataType: 'json',   // expecting json
			error: (jqXHR) => {
				renderResult(jqXHR.responseJSON.message, jqXHR.status)
			},
			success: (data) => {
				socket.emit('lock', {userid: id, username: username}); // send "lock user" via websocket to other clients
				renderResult(data.message, 0);
				renderEdit(id, data.user)
			},
		});
	}
}

//--- 4. Handler, when clicking on "save"-button (edit window): Save detail information of a user (UPDATE) -------------
function handleEditSave() {
	let editWindow: JQuery = $('#editWindow');
	let editPassword: JQuery = $('#editPassword');
	let id: string = editWindow.attr("currentuserid");
	// get user and set attributes
	let data: Object = {
		"vorname": $('#editVorname').val(),
		"nachname": $('#editNachname').val(),
		"password": editPassword.val()
	};
	$.ajax({                // set up ajax request
		url: serverURL + '/user/' + id,
		type: 'PUT',    // PUT-request for UPDATE
		data: JSON.stringify(data),
		contentType: 'application/json',  // using json in request
		dataType: 'json',              // expecting json in response
		error: (jqXHR) => {
			renderResult(jqXHR.responseJSON.message, jqXHR.status)
		},
		success: (data) => {
			socket.emit('update');  // send "update" via websocket to other clients
			renderResult(data.message, 0);
			renderList(data.userList)
		},
	});
	editPassword.val("");       // reset initial value of password
	editWindow.hide();          // Close edit window
}

//--- 5. Handler, when clicking on "cancel"-button (edit window): close edit window ------------------------------------
function handleEditCancel() {
	$('#editWindow').hide();
	socket.emit('update');  // send "update" via websocket to other clients
}

//--- 6. Handler, when typing filter-characters ------------------------------------------------------------------------
function handleFilter() {
	let searchValue: string = <string>($('#userFilter').val());
	$('#userUL').children().each(function () {  // iterate through li-children, each referenced by "$(this)
		if (($(this).find(".vornameText").text().indexOf(searchValue) >= 0) ||
			($(this).find(".nachnameText").text().indexOf(searchValue) >= 0)) {  // search in spans
			$(this).removeClass("hide");  // remove class to hide element -> show it
		} else { // does not match filter
			$(this).addClass("hide");     // add class to hide element
		}
	});
}

//--- 7. Handler, when clicking on "login"-button: login ---------------------------------------------------------------
function handleLogin() {
	// Ajax-Request  : POST http://localhost:8080/login
	let data: Object = {username: $('#userIn').val(), password: $('#passwordIn').val()};
	$.ajax({
		url: serverURL + '/login',
		type: 'POST',
		data: JSON.stringify(data),
		contentType: 'application/json',  // using json in request
		dataType: 'json',              // expecting json in response
		error: (jqXHR) => {
			renderResult(jqXHR.responseJSON.message, jqXHR.status)
		},
		success: (data) => {
			username = data.username;
			renderResult(data.message, 0);
			renderList(data.userList);
			$("#username").html('user: ' + data.username);
			$("#contentArea").show();  // show content area: filter and userList
			$("#login").hide();        // hide login
			$("#logout").show();       // show logout
			$("#userIn").val("");
			$("#passwordIn").val("");
		},
	});
}

//--- 8. Handler, when clicking on "logout"-button: logout -------------------------------------------------------------
function handleLogout() {
	$("#contentArea").hide();  // hide content area: filter and userList
	$("#logout").hide();       // hide logout
	$("#login").show();        // show login
	// Ajax-Request  : POST http://localhost:8080/logout
	$.ajax({
		url: serverURL + '/logout',
		type: 'POST',
		dataType: 'json',    // expecting json
		headers: {},
		error: (jqXHR) => {
			renderResult(jqXHR.responseJSON.message, jqXHR.status)
		},
		success: (data) => {
			username = "";
			renderResult(data.message, 0);
			renderList(data.userList)
		},
	});
}

//--- 9. Handler, when clicking on "settings"-button: open settings window check-flags ---------------------------------
function handleSettings() {
	renderSettings();
	// replace "optionX" by concrete option -> here: option0 = "Expert Mode" (option1, option2 not used)
	$("#option0" + "Check").removeAttr("disabled").prop("checked", settings.options[0]); // set two attributes of checkbox
	$("#option0" + "Label").text("Expert Mode");                                         // label the checkbox
}

//--- 10. Handler, when clicking on "save"-button (settings window): save check-flags ----------------------------------
function handleSettingsSave() {
	let optionCheck: JQuery;
	for (let index in settings.options) { // iterate over all checkboxes and save state
		optionCheck = $("#option" + index + "Check");   // uses twice -> store
		settings.options[index] = (optionCheck.is(":checked"));
		optionCheck.prop("checked", settings.options[index]);  // set "checked" to true or false
	}
	$('#settingsWindow').hide();              // close window
}

//--- 11. Handler, when clicking on "cancel"-button (in sessions modal window): reset check-flags and close window -----
function handleSettingsCancel() {
	for (let index in settings.options) { // iterate over all checkboxes and save state
		$("#option" + index + "Check").prop("checked", settings.options[index]); // reset "checked" to initial value
	}
	$('#settingsWindow').hide(); // close window
}

/**********************************************************************************************************************
 *** Functions that renders result, userlist or edit-window                                                           *
 *** 1. render the userlist                                                                                           *
 *** 2. render the contents of the edit-window                                                                        *
 *** 3. render the result (message and error code)                                                                    *
 *** 4. render the contents of the settings-window                                                                    *
 **********************************************************************************************************************/
//--- 1. render the userlist -------------------------------------------------------------------------------------------
function renderList(userList: User[]) {
	/*
	 constructs a list of li-elements with subsequent DOM elements displaying users
	 its time/time and an erase-icon and appends this list to ul-element.
	 Adds two event-listeners when clicking on some element in line or on the trash-icon

	 Example:
		<li userid="0">
			<div class="w3-tiny">
			  <span class='user'>Mustermann</span>
			  <span class='lock fa fa-lock hide'/>
			</div>
			<div>
				<span class="userVorname">Max</span>
				<span class="userNachname">Mustermann</span>
				<span class="fa fa-trash w3-large w3-margin-right" id="0"></span>
			</div>
			<div class="w3-tiny">Thu, 12 Jan 2017 13:45:00 GMT</div>
		</li>
		<li> ... </li>

		ATTENTION:
		add "userid" in webStorm-preference: Editor -> inspections -> HMTL -> unknown HTM tag attribute to avoid warnings
	*/
	let userUL: JQuery = $('#userUL'); // the user list in which the  users will be added
	let buffer: string = "";
	// remove DOM-subtree below ul-element
	userUL.empty();
	// iterate through all users build li-element with all subelements (see example in method-comment)
	for (let user of userList) {
		if (user != null) { // only if user has not been deleted

			// set up html-code and create li-Element
			buffer = "<li userid='" + user.id + "'>";
			buffer += "  <div class='w3-tiny'>";
			buffer += "    <span class='user'>" + user.username + "</span>";
			buffer += "    <span class='lock fa fa-lock hide'/>";
			buffer += "  </div>";
			buffer += "  <div>";
			buffer += "    <span class='vornameText'>" + user.vorname + "</span>";
			buffer += "    <span class='nachnameText'>" + user.nachname + "</span>";
			buffer += "    <span class='fa fa-trash w3-large w3-margin-right' userid='" + user.id + "'/>";
			buffer += "  </div>";
			buffer += "  <div class='w3-tiny'>" + user.time + "</div>";
			buffer += "</li>";
			let li: JQuery = $(buffer);

			// define eventHandler for li-element and trash
			li.click(handleEdit);
			li.find(".fa-trash").click(handleDelete, null);  // second argument (null) for event

			// append li-element to ul-element
			userUL.append(li);

		}
	}
}

//--- 2. render the contents of the edit-window ------------------------------------------------------------------------
function renderEdit(userID: string, user: User) {
	$('#editTitle').text(user.username);
	$('#editVorname').val(user.vorname);            // set value of "vorname" field to text of provided vorname
	$('#editNachname').val(user.nachname);          // set value of "nachname" field to text of provided nachname
	$('#editDate').val(user.time);                  // set value of "Date" input-field to time of provided user
	// store Id in attribute of DOM-element and show edit-window
	$('#editWindow').attr("currentuserid", userID).show();
}

//--- 3. render the result (message and error code) --------------------------------------------------------------------
let resultTimers: NodeJS.Timer[] = [];  // array that stores all resultTimers that are set
function hideAfter(seconds: number, domElement: JQuery) {  //--- define timer funtion ----------------------------------
	for (let i in resultTimers) { // iterate through all resultTimers and clear them
		clearTimeout(resultTimers[i])
	}
	resultTimers.push(setTimeout(function () {
		domElement.css("display", "none"); // hide domElement after given seconds
	}, seconds * 1000)); // set new timer and store it in resultTimers-array
}
function renderResult(text: string, status: number) { //--- show success/error message (hide after some time) ----------
	let resultWindow: JQuery = $("#resultWindow");
	let result: JQuery = $("#result");
	result.html(text);
	if (status > 0) {  // an error has occured -> set color of result window to orange
		if (status == 401) {  // session expired -> hide contentArea and show loginArea with login
			$("#contentArea").hide(); // hide content area
			$("#logout").hide();      // hide logout
			$("#login").show();       // show login#
		}
		result.removeClass("w3-teal");
		result.addClass("w3-orange");
	} else { // no error has occured -> set color of result window to green
		result.removeClass("w3-orange");
		result.addClass("w3-teal");
	}
	// show if settings.options[0] (= Expert Mode) == true OR  error occurred
	if (settings.options[0] || status > 0) {
		resultWindow.show();
		hideAfter(2, resultWindow); // hide result after three seconds
	}
}

//--- 4. render the contents of the settings-window --------------------------------------------------------------------
function renderSettings() {
	/*
		 constructs a list of options
		 Example:
		 <p> <input id="option1Check" class="w3-check" type="checkbox" disabled>
				 <label id="option1Label"> Option 1 </label> </p>
		 <p> <input id="option2Check" class="w3-check" type="checkbox" disabled>
				 <label id="option2Label"> Option 2 </label> </p>
		 <p> <input id="option3Check" class="w3-check" type="checkbox" disabled>
				 <label id="option3Label"> Option 3 </label> </p>
	*/
	let settingsForm: JQuery = $("#settingsForm"); // get settingForms (to fill it with <p>-tags
	settingsForm.empty();                           // remove DOM-subtree below #settingsForm
	for (let index in settings.options) {           // fill settingsForm with <p>-tags
		settingsForm.append("<p> <input id='option" + index + "Check' class='w3-check' type='checkbox' disabled>\n" +
			"    <label id='option" + index + "Label'> Option " + index + "</label> </p>");
	}
	$('#settingsWindow').show();                    // display settings window
}


/**********************************************************************************************************************
 *** Function that is called initially to get userList                                                                *
 **********************************************************************************************************************/
function checkLogin() {
	$.ajax({
		url: serverURL + '/login/check',
		type: 'GET',  // GET-request to check login and get user
		dataType: 'json', // expecting json
		error: () => {
		},  // need not show anything
		success: (data) => {
			username = data.username;
			$("#username").html('user: ' + data.username);
			$("#contentArea").show();    // show content area, filter and userList
			$("#login").hide();          // hide login
			$("#logout").show();         // show logout
			renderResult(data.message, 0);
			renderList(data.userList);
		},
	});
}


/**********************************************************************************************************************
 *** Main Event Listener, that waits until DOM is loaded                                                              *
 *** 1. (re-)entering application:                                                                                    *
 ***    - restore the settings from local storage                                                                     *
 ***    - check, if user is already logged in (e.g. after refresh)                                                    *
 *** 2. Event Handler                                                                                                 *
 *** 3. Leaving application                                                                                           *
 ***    - store settings in local storage                                                                             *
 **********************************************************************************************************************/
$(function () {

	/**
	 * 1. (re-)entering application
	 */
	settings.restoreSettings();  // restore the settings from local storage
	checkLogin();                // check, if user is already logged in (e.g. after refresh)

	/**
	 * 2. Event Handler
	 */
	//--- 1. click on the "+"-button or "return" : Add a user to the userlist --------------------------------------------
	$('#addUserButton').on('click',handleCreate);
	$('#usernameInput, #passwordInput, #vornameInput, #nachnameInput').keyup(function (event: JQuery.Event) {
		if (event.which === 13) {
			handleCreate();
		}  // only if "enter"-key (=13) is pressed
	});
	//--- 2. click on "save"-button (in edit modal window) or "return": Save detail information of a user ----------------
	$('#editSaveBtn').on('click',handleEditSave);
	$('#editVorname, #editNachname, #editPassword').on('keyup',function (event: JQuery.Event) {
		if (event.which === 13) {
			handleEditSave();
		}  // only if "enter"-key (=13) is pressed
	});
	//--- 3. click on "cancel"-button (in edit modal window): Hide modal window, without doing anything else -------------
	$('#editCancelBtn').on('click',handleEditCancel);
	//--- 4. keyUp in input-field (filter): Show matching users ----------------------------------------------------------
	$('#userFilter').keyup(handleFilter);
	//--- 5. click login button or "cr" on either field  -----------------------------------------------------------------
	$('#loginBtn').on('click',handleLogin);
	$('#userIn, #passwordIn').on('keyup',function (event: JQuery.Event) {
		if (event.which === 13) {
			handleLogin();
		}  // only if "enter"-key (=13) is pressed
	});
	//--- 6. click on the logout button ----------------------------------------------------------------------------------
	$('#logoutBtn').on('click',handleLogout);
	//--- 7. click on the settings button --------------------------------------------------------------------------------
	$('#settingsBtn').on('click',handleSettings);       // just open window
	//--- 8. click on the save button (in settings modal window) ---------------------------------------------------------
	$('#settingsSaveBtn').on('click',handleSettingsSave);
	//--- 9. click on "cancel"-button (in settings modal window): Hide modal window, without doing anything else ---------
	$('#settingsCancelBtn').on('click',handleSettingsCancel);

	/**
	 * 3. Leaving application
	 */
	$(window).on('unload', function () {
		settings.storeSettings();
	}); //--- store settings in local storage

});


}

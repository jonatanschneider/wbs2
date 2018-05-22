/**********************************************************************************************************************
 *** Function that is called initially to get userList                                                                *
 **********************************************************************************************************************/

let posts: string[] = [];
let provider: string;
function showProfileData() {
	$.ajax({
		url: 'https://localhost:8443/userProfile',
		type: 'GET',  // GET-request to check login and get user
		dataType: 'json', // expecting json
		error: () => {
		},  // need not show anything
		success: (data) => {
			renderProfile(data.user);
		},
	});
}

function renderProfile(user) {
	$('#profile_provider').html(user.provider);
	$('#profile_id').html(user.id);
	$('#profile_displayName').html(user.displayName);
	$('#profile_username').html(user.username);
	if (user.emails) {
		$('#profile_email').html(user.emails.pop().value);
	}
	if (user.photos) {
		$('#profile_photo').attr('src', user.photos.pop().value);
	}
	if (user.gender) {
		$('#profile_gender').html(user.gender);
	}
	if (user.name) {
		$('#profile_name').html(user.name.givenName + ' ' + user.name.familyName);
	}
	if(user.provider !== 'facebook') {
		$('#input').hide();
	}
}

$(function () {
	showProfileData();

	$('#postButton').on('click', () => {
		$.ajax({
			url: 'https://localhost:8443/createPost',
			type: 'POST',
			data: 'input=' + $('#postInput').val(),
			dataType: 'json',
			success: answer => {
				$('#postInput').text('');
				posts.push(answer.id);
				renderPostArray();
			},
			error: answer => {
				alert('Isch mach das ned weil ' + answer.responseJSON.message);
			}
		});
	});
});

function deletePost(post: string) {
	$.ajax({
		url: 'https://localhost:8443/deletePost',
		type: 'DELETE',
		data: 'id=' + post,
		dataType: 'json',
		success: () => {
			posts = posts.filter(e => e !== post);
			renderPostArray();
		},
		error: answer => {
			alert('Isch mach das ned weil ' + answer.responseJSON.message);
		}
	});
	renderPostArray();
}


function renderPostArray() {
	let list: string = '';

	list = '<ul>';
	for (let post of posts) {
		list += '<li>' + post + `<button class="btn btn-danger" onclick="deletePost('` + post + `')">Delete</button></li>`;
	}
	list += '</ul>';

	$('#posts').html(list);
}
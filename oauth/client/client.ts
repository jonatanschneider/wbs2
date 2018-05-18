/**********************************************************************************************************************
 *** Function that is called initially to get userList                                                                *
 **********************************************************************************************************************/
function showProfileData() {
    $.ajax({
        url: 'https://localhost:8443/userProfile',
        type: 'GET',  // GET-request to check login and get user
        dataType: 'json', // expecting json
        error: () => { },  // need not show anything
        success: (data) => {
            renderProfile(data.user);
        },
    });
}

function renderProfile(user) {
    $("#profile_provider"   ).html(user.provider);
    $("#profile_id"         ).html(user.id);
    $("#profile_displayName").html(user.displayName);
    $("#profile_username"   ).html(user.username);
    if (user.emails) { $("#profile_email" ).html(user.emails.pop().value);                          }
    if (user.photos) { $("#profile_photo" ).attr("src", user.photos.pop().value);                   }
    if (user.gender) { $("#profile_gender").html(user.gender);                                      }
    if (user.name)   { $("#profile_name"  ).html(user.name.givenName + " " + user.name.familyName); }
}

$(function () {
    showProfileData();
});

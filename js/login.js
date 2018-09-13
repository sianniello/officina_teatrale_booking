// Below function Executes on click of login button.
function validate() {
    $('.loader').show();
    $('.booking-details').hide();
    $('.form').addClass('blur');
    let username = $('#username').val();
    let password = $("input[name='password']").val();
    let userdata = {
        username,
        password
    };
    let url = "https://i2pn7or762.execute-api.us-east-1.amazonaws.com/prod/";
    $.getJSON(url + "MongoDB_Atlas_CheckLogin", userdata, data => {
        if (data) {
            $('.loader').hide();
            sessionStorage.setItem('user', username);
            $('#usernameNavbar').text(data['full_name']);
            alert("Accesso effettuato, benvenut" + (data.sex === 'M'? 'o ' : 'a ') + data['full_name'].split(" ")[0]);
            window.location.reload();
        } else {
            alert("username o password errati");
            $('.loader').hide();
            $('form').hide();
            $('.form').removeClass('blur');
        }
    });

}
// Below function Executes on click of login button.
function validate(){
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let userdata = {username, password};
    let url = "https://i2pn7or762.execute-api.us-east-1.amazonaws.com/prod/";
    $.getJSON(url + "MongoDB_Atlas_CheckLogin", userdata, data =>
        {
            $('.loader').show();
            if (data){
                sessionStorage.setItem('user', username);
                alert("Accesso effettuato");
                location.reload();
            }
            else
                alert("username o password errati");
        }
    );

}
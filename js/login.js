// Below function Executes on click of login button.
function validate(){
    $('.loader').show();
    $('.booking-details').hide();
    $('.form').addClass('blur');
    let username = $('#username').val();
    let password = $("input[name='password']").val();
    let userdata = {username, password};
    let url = "https://i2pn7or762.execute-api.us-east-1.amazonaws.com/prod/";
    $.getJSON(url + "MongoDB_Atlas_CheckLogin", userdata, data =>
        {
            if (data){
                $('.loader').hide();
                sessionStorage.setItem('user', username);
                let suxfiss = data.sex === 'M'? 'o ' : 'a ';
                bootbox.alert({
                    message: "Accesso effettuato, benvenut" + suxfiss +
                    data['full_name'].split(" ")[0],
                    callback: () =>
                    {
                        location.reload();
                    },
                    size: 'small'
                });
                $('.modal-dialog.modal-sm').addClass('custom-modal');
            }
            else
                alert("username o password errati");
        }
    );

}
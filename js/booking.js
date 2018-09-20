let url = 'https://i2pn7or762.execute-api.us-east-1.amazonaws.com/prod/';
// let url = 'http://officinateatrale.hopto.org:5000/bookings';
// let url = 'http://localhost:5000/bookings';
$('.loader').hide();
$(document).ready(function () {
    if (!sessionStorage.getItem('user')) {
        $('.form').show();
        $('.wrapper').hide();
    } else {
        $('.booking-details').hide();
        $('.form').hide();
        $('.loader').show();
        $.ajax({
            url: url + "MongoDB_Atlas_GetDocs",
            contentType: "application/json; charset=utf-8",
            type: 'GET',
            success: data => {
                $('.loader').hide();
                $('.booking-details').show();
                $('.wrapper').show();
                console.log(data);
                start(data);
            },
            error: e => {
                $('.loader').hide();
                console.log(e.message);
            }
        });
    }
});


function start(data) {
    $('#username').text(sessionStorage.getItem('user'));
    let booking = {
        user: '',
        seats: [],
        timestamp: '',
        total: 0
    };

    let columns = [
        "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "",
        "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12", "C13", "C14", "C15", "",
        "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12", "D13", "D14", "D15", "D16",
    ];


    let map = data['seat_map'];

    map.forEach((row, rowIndex) => {
        let rowArray = row.split("");
        rowArray.forEach((seat, seatIndex) => {
            if (seat !== '_')
                rowArray[seatIndex] = seat + '[,' + data['rows'][rowIndex] + columns[seatIndex] + ']'

        });
        map[rowIndex] = rowArray.join("");
    });

    console.log(map);

    let $cart = $('#selected-seats'),
        $counter = $('#counter'),
        $total = $('#total'),

        sc = $('#seat-map').seatCharts({
            map: map,
            seats: {
                f: {
                    price: 12,
                    category: 'adulto',
                    classes: 'my_available', //custom CSS class
                },
                c: {
                    category: 'bambino',
                    classes: 'my_unavailable_child'
                },
                r: {
                    classes: 'my_unavailable_reserved'
                }
            },
            naming: {
                top: true,
                columns: columns,
                rows: data.rows,
            },
            legend: {
                node: $('#legend'),
                items: [
                    ['f', 'available', 'Libero'],
                    ['c', 'unavailable', 'Prenotato Bambino'],
                    ['b', 'unavailable', 'Preonotato Adulto'],
                    ['r', 'unavailable', 'Riservato']
                ]
            },
            click: function () {
                if (this.settings.id) {
                    this.data().category = 'adulto';
                    this.data().price = 12;

                    let row = this.settings.id.substring(0, 1);
                    let sector = "";
                    switch (this.settings.id.substring(2, 3)) {
                        case "S":
                            sector = "sinistro";
                            break;
                        case "C":
                            sector = "centrale";
                            break;
                        case "D":
                            sector = "destro";
                            break;
                    }

                    let seat = this.settings.id.substring(3, this.settings.id.length);

                    if (this.status() === 'available') {
                        //let's create a new <li> which we'll add to the cart items
                        $('<li>Posto ' + this.data().category +
                                ' Fila: ' + row +
                                ' - Settore: ' + sector +
                                ' - Posto: ' + seat +
                                ' <b>€ <span class="price">' + this.data().price + '</span></b> <a href="#" class="cancel-cart-item">[annulla]</a></li>')
                            .attr('id', 'cart-item-' + this.settings.id)
                            .data('seatId', this.settings.id)
                            .addClass('li-item')
                            .appendTo($cart);

                        /*
                         * Lets update the counter and total
                         *
                         * .find function will not find the current seat, because it will change its stauts only after return
                         * 'selected'. This is why we have to add 1 to the length and the current seat price to the total.
                         */

                        booking.total = recalculateTotal($total);
                        booking.seats.push({
                            id: this.settings.id,
                            type: 'unavailable'
                        });
                        $counter.text(booking.seats.length);

                        if (booking.seats.length || parseInt($counter.text()) > 0) $('.checkout-button').removeClass('hidden');
                        else $('.checkout-button').addClass('hidden');

                        return 'selected';

                    } else if (this.status() === 'selected') {

                        this.data().category = 'bambino';
                        this.data().price = 6;
                        let item = $('<li>Posto ' + this.data().category +
                                ' Fila: ' + row +
                                ' - settore: ' + sector +
                                ' - posto: ' + seat +
                                ' <b>€ <span class="price">' + this.data().price + '</span></b> <a href="#" class="cancel-cart-item">[annulla]</a></li>')
                            .attr('id', 'cart-item-' + this.settings.id)
                            .addClass('li-item')
                            .data('seatId', this.settings.id);

                        $cart.find('li#cart-item-' + this.settings.id).remove();
                        item.appendTo($cart);

                        booking.total = recalculateTotal($total);
                        booking.seats.find(s => {
                            return s.id === this.settings.id
                        }).type = 'unavailable_child';

                        return 'selected_child';

                    } else if (this.status() === 'selected_child') {

                        //remove the item from our cart
                        $('#cart-item-' + this.settings.id).remove();

                        booking.total = recalculateTotal($total);
                        let seatToRemove = booking.seats.find(seat => seat.id === this.settings.id);
                        booking.seats.splice(booking.seats.indexOf(seatToRemove), 1);

                        $counter.text(booking.seats.length);

                        if (booking.seats.length || parseInt($counter.text()) > 0) $('.checkout-button').removeClass('hidden');
                        else $('.checkout-button').addClass('hidden');

                        //seat has been vacated
                        return 'available';

                    } else if (this.status() === 'unavailable') {
                        //seat has been already booked

                        return 'unavailable';

                    } else {
                        return this.style();
                    }

                } //func
            }
        });

    //this will handle "[cancel]" link clicks
    $cart.on('click', '.cancel-cart-item', function () {
        //let's just trigger Click event on the appropriate seat, so we don't have to repeat the logic here
        let seat_ID = $(this).parents('li:first').data('seatId');
        $(this).closest('li').remove();

        sc.status(seat_ID, 'available');

        let index = booking.seats.indexOf(booking.seats.find(item => {
            return item.id === seat_ID
        }));
        booking.seats.splice(index, 1);

        if (booking.seats.length === 0) $('.checkout-button').addClass('hidden');
        else $('.checkout-button').removeClass('hidden');

        $counter.text(booking.seats.length);
        recalculateTotal($total);
    });

    $('.checkout-button').on('click', () => {
        if (booking.seats.length && sessionStorage.getItem('user') !== '') {
            $('.wrapper').hide();
            $('.loader').show();
            booking.timestamp = new Date().toISOString();
            booking.user = sessionStorage.getItem('user');
            $.ajax({
                type: "POST",
                contentType: "application/json; charset=utf-8",
                url: url + "MongoDB_Atlas_AddDocs",
                data: JSON.stringify(booking),
                success: data => {
                    console.log(data);
                    $('.loader').hide();
                    let resp_string = "";
                    if (!data.errorMessage) {
                        data.seats.forEach(seat => {
                            let type = seat['type'] === 'unavailable' ? 'adulto' : 'bambino';
                            let row = seat['id'].substring(0, 1);
                            let sector = "";
                            switch (seat['id'].substring(1, 2)) {
                                case "S":
                                    sector = "sinistro";
                                    break;
                                case "C":
                                    sector = "centrale";
                                    break;
                                case "D":
                                    sector = "destro";
                                    break;
                            }

                            let s = seat['id'].substring(2, seat['id'].length);
                            resp_string += "\nFila " + row + " - " + "Settore " + sector + " - " + "Posto " + s + " " + type;

                        });
                        alert("Prenotazione effettuata:" + resp_string);
                        window.location.reload();
                    }
                    else alert("Prenotazione non riuscita. \n" +
                        "Si prega di aggiornare la pagina e ripovare");

                }, //success

                error: () => {
                    $('.loader').hide();
                    alert("Prenotazione non riuscita. \n" +
                        "Si prega di aggiornare la pagina e ripovare");
                    location.reload();
                }
            })
        }
    });

    sc.find('r').status('unavailable');
    sc.find('c').status('unavailable');
    sc.find('b').status('unavailable');

}


function recalculateTotal($total) {
    let total = 0;
    //basically find every selected seat and sum its price
    $('span' + '.price').each(function () {
        total += parseInt(this.innerText)
    });

    $total.text(total);
    return total;
}
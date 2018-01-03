let url = 'https://i2pn7or762.execute-api.us-east-1.amazonaws.com/prod/';
// let url = 'http://officinateatrale.hopto.org:5000/bookings';
// let url = 'http://localhost:5000/bookings';

$('.form').show();
$('.wrapper').hide();

$(document).ready(function()
{
    if (!sessionStorage.getItem('user')) { $('.form').show(); $('.wrapper').hide(); }
    else {
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
                start(data)
            },
            error: e => {
                $('.loader').hide();
                console.log(e.message);
            }
        });
    }
});

function seat_formatting(seat_map, rows, columns)
{
    rows.forEach((row, row_index) =>
        {
            let row_len = seat_map[row_index].length;

            if (row === ' ') {
                seat_map.splice(row_index, 1, '_'.repeat(row_len).split(""));
                seat_map[row_index] = seat_map[row_index].join("");
            }
            else {
                let col = columns[row_index];
                let sx = seat_map[row_index].slice(0, col[0]);
                let cn = seat_map[row_index].slice(col[0], col[0] + col[1]);
                let dx = seat_map[row_index].slice(col[1], col[1] + col[2]);
                let sx_str = sx.join("").padEnd(16+1, "_");
                let cn_str = cn.join("").padEnd(15+1, "_");
                let dx_str = dx.join("").padEnd(16+1, "_");
                seat_map[row_index] = sx_str + cn_str + dx_str;
            }
        }
    );
    console.log(seat_map);
    return seat_map;
}

function start(data) {

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
    let map = seat_formatting(data['seat_map'], data.rows, data.columns);


    let $cart = $('#selected-seats'),
        $counter = $('#counter'),
        $total = $('#total'),

        sc = $('#seat-map').seatCharts({
            map: map,
            seats: {
                f: {
                    price   : 12,
                    category: 'adulto',
                    classes : 'my_available', //custom CSS class
                },
                c: {
                    category: 'bambino',
                    classes: 'my_unavailable_child'
                },
                r: {
                    classes: 'my_unavailable_reserved'
                }
            },
            naming : {
                top : true,
                columns: columns,
                rows: data.rows,
            },
            legend : {
                node : $('#legend'),
                items : [
                    [ 'f', 'available',     'Libero' ],
                    [ 'c', 'unavailable',   'Prenotato Bambino' ],
                    [ 'b', 'unavailable',   'Preonotato Adulto'],
                    [ 'r', 'unavailable',   'Riservato']
                ]
            },
            click: function () {
                if (this.settings.id)
                {
                    this.data().category = 'adulto';
                    this.data().price = 12;

                    let row = this.settings.id.substring(0,1);
                    let sector = "";
                    switch (this.settings.id.substring(2, 3)) {
                        case "S": sector = "sinistro"; break;
                        case "C": sector = "centrale"; break;
                        case "D": sector = "destro"; break;
                    }

                    let seat = this.settings.id.substring(3, this.settings.id.length);

                    if (this.status() === 'available') {
                        //let's create a new <li> which we'll add to the cart items
                        $('<li>Posto ' + this.data().category + ' fila: ' + row + ' settore: '+ sector + ' posto: ' + seat + ' <b>€ <span class="price">' + this.data().price + '</span></b> <a href="#" class="cancel-cart-item">[annulla]</a></li>')
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
                        booking.seats.push({id: this.settings.id, type: 'unavailable'});
                        $counter.text(booking.seats.length);

                        return 'selected';

                    } else if (this.status() === 'selected') {

                        this.data().category = 'bambino';
                        this.data().price = 0;
                        let item = $('<li>Posto ' + this.data().category + ' fila: ' + row + ' settore: '+ sector + ' posto: ' + seat + ' <b>€ <span class="price">' + this.data().price + '</span></b> <a href="#" class="cancel-cart-item">[annulla]</a></li>')
                            .attr('id', 'cart-item-' + this.settings.id)
                            .addClass('li-item')
                            .data('seatId', this.settings.id);

                        $cart.find('li#cart-item-' + this.settings.id).remove();
                        item.appendTo($cart);

                        booking.total = recalculateTotal($total);
                        booking.seats.find(item => {
                            return item.id === this.settings.id
                        }).type = 'unavailable_child';

                        return 'selected_child';

                    } else if (this.status() === 'selected_child') {

                        //remove the item from our cart
                        $('#cart-item-' + this.settings.id).remove();

                        booking.total = recalculateTotal($total);
                        booking.seats.pop();

                        $counter.text(booking.seats.length);

                        //seat has been vacated
                        return 'available';

                    } else if (this.status() === 'unavailable') {
                        //seat has been already booked
                        return 'unavailable';

                    } else {
                        return this.style();
                    }

                }   //func
            }
        });

    //this will handle "[cancel]" link clicks
    $cart.on('click', '.cancel-cart-item', function () {
        //let's just trigger Click event on the appropriate seat, so we don't have to repeat the logic here
        let seat_ID = $(this).parents('li:first').data('seatId');
        $(this).closest('li').remove();

        sc.status(seat_ID, 'available');

        let index = booking.seats.indexOf(booking.seats.find(item => {return item.id === seat_ID}));
        booking.seats.splice(index, 1);
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
                    contentType:"application/json; charset=utf-8",
                    url: url + "MongoDB_Atlas_AddDocs",
                    data: JSON.stringify(booking),
                    success: data =>
                    {
                        $('.loader').hide();
                        let resp_string = "";
                        data.seats.forEach(seat =>
                            {
                                let type = seat['type']==='unavailable'? 'adulto' : 'bambino';
                                let row = seat['id'].substring(0,1);
                                let sector = "";
                                switch (seat['id'].substring(2, 3)) {
                                    case "S": sector = "sinistro"; break;
                                    case "C": sector = "centrale"; break;
                                    case "D": sector = "destro"; break;
                                }

                                let s = seat['id'].substring(3,seat['id'].length);
                                resp_string +=  "Fila " + row + " - " +
                                    "Settore " + sector + " - " +
                                    "Posto " + s + " " + type + "\n";
                            }
                        );
                        alert("Prenotazione effettuata\n" + resp_string);
                        location.reload();
                    },
                    error: (error, status) =>
                    {
                        $('.loader').hide();
                        alert("Error: " + status);
                        location.reload();
                    }
                }
            )
        }
    });

    sc.find('r').status('unavailable');
    sc.find('c').status('unavailable');
    sc.find('b').status('unavailable');

}


function recalculateTotal($total) {
    let total = 0;
    //basically find every selected seat and sum its price
    $('span' + '.price').each(function () {total += parseInt(this.innerText)});

    $total.text(total);
    return total;
}


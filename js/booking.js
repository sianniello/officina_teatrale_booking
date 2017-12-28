$(document).ready(function()
{

    let map = [];

    $.ajax({
        // url: 'http://stenomyapp.ddns.net:5000/bookings',
        url: 'http://localhost:5000/bookings',
        data: {"Access-Control-Allow-Origin": tr},
        type: 'GET',
        success: data =>
        {
            console.log(data);
            start(data)
        }
    });
});

function start(map) {

    let booking = {
        user: '',
        seats: [],
        total: 0
    };

    let $cart = $('#selected-seats'),
        $counter = $('#counter'),
        $total = $('#total'),

        sc = $('#seat-map').seatCharts({
            map: [
                'ffff_ffrrrrff_ffff',
                'ffff_ffffffff_ffff',
                'ffff_ffffffff_ffff',
                '__________________',
                'ffff_ffffffff_ffff',
                'ffff_ffffffff_ffff',
                'ffff_ffffffff_ffff',
                'ffff_fffffbbc_ffff'
            ],
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
                columns: [
                    '1', '2', '3', '4', ' ',
                    '5', '6', '7', '8', '9', '10', '11', '12', ' ',
                    '13', '14', '15', '16'],
                rows: ['A', 'B', 'C', ' ', 'D', 'E', 'F', 'G'],
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
                this.data().category = 'adulto';
                this.data().price = 12;

                if (this.status() === 'available') {
                    //let's create a new <li> which we'll add to the cart items
                    $('<li>Posto '+this.data().category+' #'+this.settings.id+': <b>€ <span class="price">'+this.data().price+'</span></b> <a href="#" class="cancel-cart-item">[annulla]</a></li>')
                        .attr('id', 'cart-item-'+this.settings.id)
                        .data('seatId', this.settings.id)
                        .appendTo($cart);

                    /*
                     * Lets update the counter and total
                     *
                     * .find function will not find the current seat, because it will change its stauts only after return
                     * 'selected'. This is why we have to add 1 to the length and the current seat price to the total.
                     */

                    booking.total = recalculateTotal($total);
                    booking.seats.push({id: this.settings.id, type: 'adulto'});
                    $counter.text(booking.seats.length);

                    return 'selected';

                } else if (this.status() === 'selected') {

                    this.data().category = 'bambino';
                    this.data().price = 0;
                    let item = $('<li>Posto '+this.data().category+' #'+this.settings.id+': <b>€ <span class="price">'+this.data().price+'</span></b> <a href="#" class="cancel-cart-item">[annulla]</a></li>')
                        .attr('id', 'cart-item-'+this.settings.id)
                        .data('seatId', this.settings.id);

                    $cart.find('li#cart-item-'+this.settings.id).remove();
                    item.appendTo($cart);

                    booking.total = recalculateTotal($total);
                    booking.seats.find(item => {return item.id === this.settings.id}).type = 'bambino';

                    return 'selected_child';

                } else if (this.status() === 'selected_child') {

                    //remove the item from our cart
                    $('#cart-item-'+this.settings.id).remove();

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
        });

    //this will handle "[cancel]" link clicks
    $cart.on('click', '.cancel-cart-item', function () {
        //let's just trigger Click event on the appropriate seat, so we don't have to repeat the logic here
        let seat_ID = $(this).parents('li:first').data('seatId');
        $(this).closest('li').remove();

        console.log(sc.get(seat_ID));
        sc.status(seat_ID, 'available');

        let index = booking.seats.indexOf(booking.seats.find(item => {return item.id === seat_ID}));
        booking.seats.splice(index, 1);
        $counter.text(booking.seats.length);
        recalculateTotal($total);

    });

    $('.checkout-button').on('click', () => {
        console.log(JSON.stringify(booking));
        $.ajax({
            url: 'localhost:5000/booking',
            type: 'POST',
            data: booking,
            success: data => { alert('Prenotazione effettuata con successo') }
        });
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


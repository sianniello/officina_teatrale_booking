let firstSeatLabel = 1;

$(document).ready(function() {
    let $cart = $('#selected-seats'),
        $counter = $('#counter'),
        $total = $('#total'),
        sc = $('#seat-map').seatCharts({
            map: [
                'ff_frrf_ff',
                'ff_ffff_ff',
                'ff_ffff_ff',
                'ff_ffff_ff',
                'ff_fbbc_ff'
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
                columns: ['1', '2', ' ', '3', '4', '5', '6', ' ', '7', '8'],
                rows: ['A', 'B', 'C', 'D', 'E'],
                getLabel : function (character, row, column) {
                    return firstSeatLabel++;
                },
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
                    $('<li>Posto '+this.data().category+' #'+this.settings.label+': <b>€ '+this.data().price+'</b> <a href="#" class="cancel-cart-item">[annulla]</a></li>')
                        .attr('id', 'cart-item-'+this.settings.id)
                        .data('seatId', this.settings.id)
                        .appendTo($cart);

                    /*
                     * Lets update the counter and total
                     *
                     * .find function will not find the current seat, because it will change its stauts only after return
                     * 'selected'. This is why we have to add 1 to the length and the current seat price to the total.
                     */
                    $counter.text(sc.find('selected').length+1);

                    recalculateTotal(sc, $total);

                    return 'selected';

                } else if (this.status() === 'selected') {

                    this.data().category = 'bambino';
                    this.data().price = 0;

                    let item = $('<li>Posto '+this.data().category+' #'+this.settings.label+': <b>€<span class="price">'+this.data().price+'</span></b> <a href="#" class="cancel-cart-item">[annulla]</a></li>')
                        .attr('id', 'cart-item-'+this.settings.id)
                        .data('seatId', this.settings.id);

                    $cart.find('li#cart-item-'+this.settings.id).html(item);

                    recalculateTotal(sc, $total);

                    return 'selected_child';

                } else if (this.status() === 'selected_child') {

                    //update the counter
                    let count = sc.find('selected').length;

                    if (count > 1)
                        $counter.text(sc.find('selected').length-1);
                    else
                        $counter.text('0');

                    //remove the item from our cart
                    $('#cart-item-'+this.settings.id).remove();

                    recalculateTotal(sc, $total);

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
        sc.get($(this).parents('li:first').data('seatId')).click();

        let text = $(this).parents('li:first').text();

        if (text.includes('adulto'))
            sc.get($(this).parents('li:first').data('seatId')).click();
    });

    sc.find('r').status('unavailable');
    sc.find('c').status('unavailable');
    sc.find('b').status('unavailable');

});


function recalculateTotal(sc, $total) {
    let total = 0;
    //basically find every selected seat and sum its price
    sc.find('selected').each(function () {
        total += this.data().price;
    });

    $total.text(total);
}
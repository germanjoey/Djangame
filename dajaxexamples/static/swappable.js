(function( $ ){

    var methods = {
        init : function( options ) {
        
            var s = $.extend({
                'activeClass' : "ui-state-default",
                'hoverClass' : "ui-state-hover",
                'accept' : undefined,
                'callback' : undefined
            }, options);
        
            return this.each(function(){
         
                var $this = $(this);
                var data = $this.data('swappable');
             
                // If the plugin hasn't been initialized yet
                if ( ! data ) {
                    $this.draggable({
                            revert: "true",
                            helper: "clone"
                       }).droppable({
                            activeClass: s.activeClass,
                            hoverClass: s.hoverClass,
                            drop: function( event, ui ) {
                                drop_target = $(this);
                                dragged_element = ui.draggable;
                                dragged_html = dragged_element.html();
                                dragged_element.html(drop_target.html());
                                drop_target.html(dragged_html);
                            }
                    });
                    
                    if (s.callback != undefined) {
                        $this.bind( "drop", function(event, ui) {
                            s.callback($(this), ui.draggable);
                        });
                    }
                    
                    if (s.accept != undefined) {
                        $this.droppable('option', 'accept', s.accept);
                    }
                    
                    $this.data('swappable', { target : $this });
                }
            });
        },
        
        option : function(name, value) {
            return this.each(function(){
                var $this = $(this);
                $this.droppable('option', name, value);
            })
        },
        
        destroy : function() {
            return this.each(function(){
                var $this = $(this),
                    data = $this.data('swappable');

                // Namespacing FTW
                $(window).unbind('.swappable');
                data.swappable.remove();
                $this.removeData('swappable');
            })
        }
    };

    $.fn.swappable = function( method ) {

        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        }
        else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        }
        else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.swappable' );
        }    

    };

})( jQuery );
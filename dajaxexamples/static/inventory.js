// TODO:
//   - expand width of dialog if tabs start to wrap

(function( $ ){

    var methods = {
        init : function( options ) {
        
            var s = $.extend( {
                'modal' : true,
                'resizable' : true,
                'width': 'auto',
                'height': 'auto',
                'maxPerPage' : 20, // max items per page; also sets window height for scrolled
                'cols' : 1, // columns in the list
                'emptyText' : 'Inventory is empty!', // for when the inventory has no items
                'itemClass' : 'inventoryItem', // css class for each item
                'listClass' : 'inventoryList', // css class for the containing list
                'paged' : false, // either paged if false (like ADOM) or scrolled if true (like Crawl webtiles)
                'lettered' : true, // items selectable by letter and keypress
                'letterMemory' : true, // new items will try to be assigned to the letter they were previously for scrolled
                'prevText' : 'prev',
                'nextText' : 'next',
                'expandedDesc' : true,
                'categories' : {
                    'used' : false, // whether categories are considered at all; the rest of the categories options are ignored if this is false
                    'class' : 'inventoryCategory', // the category container class; applied to a fieldset if tabbed is false, a div otherwise
                    'tabbed' : false, // tabs like w/ tome4; cannot be used with paged
                    'order' : 'sorted' // pass in an array w/ order if you want it ordered
                },
                'infoBar' : {
                    'used' : true,
                    'class' : 'ui-dialog-buttonpane ui-widget-content ui-helper-clearfix', // the pane by default will use the same as the button pane
                    'text' : undefined, // if undefined, then text will be auto-constructed based on the capabilities of the other settings
                },
                'buttons' : {
                    cancel: function() {
                        $( this ).dialog('close');
                    }
                }
            }, options);
            
            return this.each(function(){
         
                var $this = $(this);
                var data = $this.data('inventory');
                                        
                // If the plugin hasn't been initialized yet
                if ( ! data ) {
                    
                    var dialog = $this.dialog({
                        autoOpen: false,
                        resizeable: s.resizable,
                        modal: s.modal,
                        buttons: s.buttons,
                        close: function(event, ui) {
                            var $this = $(this);
                            $this.inventory('_clear');
                            var data = $this.data('inventory');
                            data.itemStore = new Array();
                            data.lastIndex = 0;
                            data.preWidth = -1;
                        }
                    });
                
                    $this.data('inventory',  $.extend(s, {
                        target : $this,
                        preWidth: -1,
                        lastIndex : 0,
                        dialog: dialog,
                        defaultButtons : s.buttons,
                        itemStore : new Array(),
                    }));
                    
                    var ul = $this.inventory('_makeList', s.listClass);
                    $this.append(ul);
                    var data = $this.data('inventory');
                    data.ul = ul;
                    
                    $this.inventory('_checkData');
                }                
            })
            
        },
        
        // roll our own option since we aren't using the rest of widget;
        // should be compatible w/ jqueryui
        option: function(a,b) {
        
            var results = new Array();
            
            this.each(function(){
                var $this = $(this);
                var data = $this.data('inventory');
            
                // a is a hash
                if (typeof(b) == 'undefined') {
                    if(typeof(a) == 'string') {
                        results.push(data[a]);
                    }
                    else {
                        $this.data('inventory', $.extend(data,a));
                    }
                }
                
                // single-value set
                else if (typeof('b') == 'string') {
                    data[a] = b;
                }
                
                $this.inventory('_checkData');
            });
            
            return results;
        },
     
        // add items to list and open dialog
        open : function(itemList, offset) {
        
            return this.each(function(){
            
                var $this = $(this);
                var data = $this.data('inventory');
                
                data.itemStore = itemList;
                data.lastIndex = offset;
                
                var itemInfo;
                if (itemList.length == 0) {
                    var dummy = $this.inventory('_makeItem', data.itemClass, { 'text' : data.emptyText });
                    data.ul.append(dummy);                            
                    itemInfo = { 'item' : dummy, 'useCols' : 1, 'lineCount' : 1 };
                }
                else {
                
                    var letters = new Array();
                    var letterLookup = new Object();
                    for(var i=0; i<itemList.length; i++) {
                        var letter;
                        if (data.lettered && data.letterMemory) {
                            letter = itemList[i].letter;
                        }
                        else if (data.lettered && (!data.paged)) {
                            letter = $this.inventory('_genLetter', i);
                        }
                        else {
                            letter = itemList[i].id;
                        }
                        
                        itemList[i].useLetter = letter;
                        letters.push(letter);
                        letterLookup[letter] = itemList[i];
                    }
                    
                    if (data.lettered && data.letterMemory) {
                        letters = letters.sort();
                    }

                    var sortedLetters = letters.sort();
                    if (data.categories.used) {
                        itemInfo = $this.inventory('_displayCategoryList', offset, sortedLetters, letterLookup);
                    }
                    else {
                        itemInfo = $this.inventory('_displayFlatList', offset, sortedLetters, letterLookup);
                    }
                }
                
                $this.inventory('_resizeWindow', itemInfo);
                
            })
            
        },

        // close dialog
        close : function() {
        
            return this.each(function(){
                var $this = $(this);
                var data = $this.data('inventory');
                $this.dialog('close');
            })
            
        },
        
        _checkData: function() {
        
            var $this = $(this);
            var data = $this.data('inventory');
            
            if (data.paged && data.categories.tabbed) {
                throw("Tabbed categories cannot be paged!");
            }
            
        },

        _clear : function(itemClass) {
        
            var $this = $(this);
            var data = $this.data('inventory');
            
            data.ul.remove();
            data.infoPane.remove();
            data.ul = $('<ul class="' + data.listClass + '">' );
            $this.append(data.ul);
            $this.unbind('keydown');
            $this.parent().unbind('keydown');
            
            $this.dialog('option', 'width', data.width);                                    
            $this.dialog('option', 'height', data.height);
            $this.dialog('option', 'buttons', data.defaultButtons);
            $this.width(data.width);
            $this.height(data.height);
            
        },
        
        _resizeBox : function(newWidth, newHeight) {
        
            var $this = $(this);
            var data = $this.data('inventory');
        
            $this.dialog('option', 'width', newWidth);
            $this.width(newWidth);
            $this.dialog('option', 'height', newHeight);
            $this.height(newHeight);
        
        },
        
        _makeList : function(listClass) {
        
            var $this = $(this);
            var data = $this.data('inventory');
            
            if (!(data.categories.used && data.categories.tabbed)) {
                return $('<ul class="' + listClass + '">');
            }
            
            return $('<div class="' + listClass + '">');
        },
        
        _makeItem : function(itemClass, item, tab) {
        
            var $this = $(this);
            var data = $this.data('inventory');
            
            var text = item.text;
            var letter = item.useLetter;
            var icon = item.icon;
            var id = item.id;
            
            var li = $('<li class="' + itemClass + '"></li>');
            var button = $('<a id="inventoryButton' + id + '" href="#1"></a>');
            li.append(button);
            
            if (icon) {
                var iconSpan = $('<span class="icon"><img src="' + icon + '" /></span>');
                iconSpan.disableSelection();
                button.append(iconSpan);
            }
            
            if (data.lettered) {
                if (letter) {
                    var letterSpan =  $('<span class="letter">' + letter + '</span>');
                    letterSpan.disableSelection();
                    
                    if (data.letterMemory) {
                        letterSpan.swappable({
                            accept: '.letter',
                            callback : function(dropTarget,draggedItem) {
                                alert(dropTarget.text() + ' ' + draggedItem.text());
                            }
                        });
                    }
                    
                    button.append(letterSpan);
                }
                
                if (letter && text) {
                    var dashSpan = $('<span class="desc"> - </span>');
                    dashSpan.disableSelection();
                    button.append(dashSpan);
                }
            }
            
            if (text) {
                var textSpan = $('<span class="desc">' + text + '</span>');
                button.append(textSpan);
            }
            
            if (data.lettered && (!data.paged)) {
                if (!(data.categories.used && data.categories.tabbed)) {
                    $this.inventory('_bindLetter', button, letter, id, tab);
                }
            }
            
            if (data.expandedDesc) {
                if (item.longdesc) {
                    $this.inventory('_bindExpandDesc', li, item);
                }
            }
            
            return li;
        },
        
        _bindExpandDesc : function(li, item) {
        
            var $this = $(this);
            var data = $this.data('inventory');
        
            var id = item.id;
            var expandDiv = $('<div class="longdesc"></div>');
            var downArrow = $('<img class="expandArrow" id="downArrow' + id + '" src="images/downarrow.gif" />');
            li.append(downArrow);
            li.append(expandDiv);
            expandDiv.text(item.longdesc);
            
            li.accordion({
                collapsible: true,
                active: false,
                clearStyle: true,
                header: '#downArrow' + id,
            });
            
            // remove jqueryui stylez here since we are styling everything ourselves
            li.removeClass('ui-accordion ui-widget ui-helper-reset ui-accordion-icons');
            
            if (data.paged) {
                var expanded = false; var oldHeight; var oldWidth; var extraHeight;
                
                // triggers right before click event - grab stored height
                li.bind( "accordionchangestart", function(event, ui) {
                    oldWidth = $this.dialog('option', 'width');
                    oldHeight = $this.dialog('option', 'height');
                });
                
                // triggers right after click event - resize
                li.bind( "accordionchange", function(event, ui) {
                    if (!expanded) {
                        extraHeight = expandDiv.outerHeight();
                        $this.inventory('_resizeBox', oldWidth, oldHeight + extraHeight);
                        expanded = true;
                    }
                    else {
                        $this.inventory('_resizeBox', oldWidth, oldHeight - extraHeight);
                        expanded = false;
                    }
                });
            }
        },
        
        _bindLetter : function(button, letter, id, tab) {
        
            var $this = $(this);
            var data = $this.data('inventory');
            
            // prevent race condition if $this is selected instead of $this.parent
            var alreadyPressed = false;
            var selector = function() {
                if (!alreadyPressed && (data.categories.tabbed && (data.ul.tabs('option', 'selected') == tab))) {
                    alert(id);
                    alreadyPressed = true;
                    $this.dialog('close');
                }
            };
        
            button.click(selector);
            // bind parent instead of $this b/c .dialog() adds a wrapper to $this, and so
            // if we ever lose focus and click back, we'd actually select the parent rather than
            // $this and the keydown binding will no longer work.
            $this.parent().bind('keydown', letter, selector);
            
        },
        
        _genLetter : function(i) {
        
            var $this = $(this);
            var data = $this.data('inventory');

            if ( ((!data.paged) && (i>61)) || (data.paged && (data.maxPerPage>61)) ) {
                throw("cannot have more than 62 items per-page in an auto-lettered inventory! assign them yourself or page them if you want more!");
            }
        
            var offset = 97;
            if (i > 25) {
                offset = 65;
            }
            else if (i > 51) {
                offset = 48;
            }
            
            var use_i = i % 26;
            return String.fromCharCode(use_i+offset);
            
        },
        
        _displayCategoryList : function(offset, sortedLetters, letterLookup) {
        
            var $this = $(this);
            var data = $this.data('inventory');
        
            var categoryStore = new Object;
            var categoryNames = new Array();
            var fieldsets = new Object();
            var subUl = new Object();
            
            var maxIter = sortedLetters.length;
            if (data.paged) {
                maxIter = Math.min(offset + data.maxPerPage, sortedLetters.length);
            }
            
            var catCount = 1;
            for(var i=0; i<sortedLetters.length; i++) {
                var item = letterLookup[sortedLetters[i]];
                var cat = item.category;
            
                if (!(categoryStore.hasOwnProperty(cat))) {
                    categoryNames.push(cat);
                    categoryStore[cat] = new Array();
                    
                    if (data.categories.tabbed) {
                        fieldsets[cat] = $('<div class="' + data.categories['class'] + '" id="tabs-' + catCount + '"></fieldset>');
                        catCount ++;
                    }
                    else {
                        fieldsets[cat] = $('<fieldset class="' + data.categories['class'] + '" id="cat_' + cat + '"></fieldset>');
                        fieldsets[cat].append($('<legend id="leg_' + cat + '">' + item.category + '</legend>'));
                    }
                    subUl[cat] = $('<ul style="border: 0px; margin: 0px; padding: 0px;"></ul>');
                    fieldsets[cat].append(subUl[cat]);
                }
                
                var li = $this.inventory('_makeItem', data.itemClass, item);
                categoryStore[cat].push(li);                        
            }
            
            if (data.categories.order == 'sorted') {
                categoryNames = categoryNames.sort();
            }
            else if (typeof(data.categories.order) == 'object') {
                var newCategoryNames = new Array();
                for (var i=0; i < data.categories.order.length; i++) {
                    cat = data.categories.order[i];
                    if (categoryNames.indexOf(cat) > -1) {
                        categoryNames.push(cat);
                    }
                }
                categoryNames = newCategoryNames;
            }
            
            var firstLi;
            var categoryLengths = new Object();
            if (data.paged) {
            
                results = $this.inventory('_doPagination', offset, categoryNames, categoryStore, subUl, letterLookup);
                firstLi = results[0];
                categoryLengths = results[1];
            }
            else {
                for (var i=0; i<categoryNames.length; i++) {
                    var cat = categoryNames[i];
                    categoryLengths[cat] = 0;
                    for (var j=0; j<categoryStore[cat].length; j++) {
                        var li = categoryStore[cat][j];
                        if ((i==0) && (j==0)) {
                            firstLi = li;
                        }
                    
                        if (data.lettered) {
                            if (data.categories.tabbed) {                            
                                var letterObj = li.find('.letter');
                                var letter = letterObj.text();
                                var id = letterLookup[letter].id;
                                
                                if (data.lettered && (!data.letterMemory)) {
                                    letter = $this.inventory('_genLetter', categoryLengths[cat]);
                                    letterObj.text(letter);
                                }
                            
                                $this.inventory('_bindLetter', li.find('a'), letter, id, i);
                            }
                        }
                        categoryLengths[cat] ++;
                        subUl[cat].append(li);
                    }
                }
            }
            
            var tabUl;
            if (data.categories.tabbed) {
                tabUl = $('<ul></ul>');
                for (var i=0; i<categoryNames.length; i++) {
                    tabUl.append($('<li><a href="#tabs-' + (i+1) + '">' + categoryNames[i] + '</a></li>'));
                }
                data.ul.append(tabUl);
            }
            
            var maxCat = 0;
            var lineCount = 0;
            var catCount = 0;
            var pickCat = -1;
            var totalItems = 0;
            for (var i=0; i<categoryNames.length; i++) {
                var cat = categoryNames[i];
                var fs = fieldsets[cat];
                var cl = categoryLengths[cat]
                if (cl == 0) {
                    fs.remove();
                    continue;
                }
                if (pickCat == -1) {
                    pickCat = i;
                }

                if (!data.categories.tabbed) {
                    var li = $('<li style="border: 0px; margin: 0px; padding: 0px;"></li>');
                    li.append(fs);
                    data.ul.append(li);
                }
                else {
                    data.ul.append(fs);
                }
                maxCat = Math.max(maxCat, cl);
                
                if (totalItems < data.maxPerPage) {
                    catCount = catCount + 1;
                    lineCount = lineCount + Math.ceil(cl/data.cols);
                }
                totalItems = totalItems + cl;
            }
                       
            if (data.categories.tabbed) {
                data.ul.tabs();
                
                for (var i=0; i<categoryNames.length; i++) {
                    var cat = categoryNames[i];
                    var fs = fieldsets[cat];
                    fs.removeClass('ui-tabs-panel');
                }
                
                lineCount = maxCat;
            }
            
            return {
                'item' : firstLi,
                'category' : fieldsets[categoryNames[pickCat]],
                'useCols' : Math.min(data.cols, maxCat),
                'lineCount' : lineCount,
                'catCount' : catCount,
                'tabUl' : tabUl,
            };
            
        },
        
        _displayFlatList : function(offset, sortedLetters, letterLookup) {
        
            var $this = $(this);
            var data = $this.data('inventory');
            
            var maxIter = sortedLetters.length;
            if (data.paged) {
                maxIter = Math.min(offset + data.maxPerPage, sortedLetters.length);
            }
        
            var firstLi;
            for (var i=offset; i<maxIter; i++) {
                var item = letterLookup[sortedLetters[i]];
                var li = $this.inventory('_makeItem', data.itemClass, item);
                
                var letter = item.useLetter;
                var letterObj = li.find('.letter');
                if (data.lettered && (!data.letterMemory)) {
                    letter = $this.inventory('_genLetter', i-offset);
                    letterObj.text(letter);
                }
                
                $this.inventory('_bindLetter', li.find('a'), letter, item.id);
                data.ul.append(li);
                
                if (i == offset) {
                    firstLi = li;
                }
            }
            
            var useCols = Math.min(data.cols, (maxIter-offset));
            return {
                'item' : firstLi,
                'useCols' : useCols,
                'lineCount' : Math.ceil((maxIter-offset)/useCols)
            };
            
        },
        
        _doPagination : function(offset, categoryNames, categoryStore, subUl, letterLookup) {
        
            var $this = $(this);
            var data = $this.data('inventory');
            
            var firstLi;
            var itemCnt = 0;
            var addedThusFar = 0;
            var categoryLengths = new Object();
            
            for (var i=0; i<categoryNames.length; i++) {
                var cat = categoryNames[i];
                categoryLengths[cat] = 0;
                
                if (itemCnt < offset) { // trim underflow
                    var startIter = itemCnt;
                    var nextIter = Math.min(itemCnt+categoryStore[cat].length, offset);
                    for (var j=startIter; j<nextIter; j++) {
                        categoryStore[cat].shift().remove();
                    }
                    itemCnt = nextIter;
                    if (categoryStore[cat].length == 0) continue;
                }
                
                if (((itemCnt+categoryStore[cat].length) > offset)
                 && (itemCnt < (offset+data.maxPerPage))) {
                 
                    // add the rest
                    var startIter = Math.max(itemCnt, offset);
                    var nextIter = Math.min(itemCnt+categoryStore[cat].length, offset+data.maxPerPage);
                    
                    for (var j=startIter; (j<nextIter) && (categoryStore[cat].length > 0); j++) {
                        var li = categoryStore[cat].shift();
                        
                        var letterObj = li.find('.letter');
                        var letter = letterObj.text();
                        var item = letterLookup[letter].id;
                        
                        if (data.lettered && (!data.letterMemory)) {
                            letter = $this.inventory('_genLetter', addedThusFar);
                            letterObj.text(letter);
                        }
                        
                        $this.inventory('_bindLetter', li.find('a'), letter, item);
                        
                        if (j==offset) {                                
                            firstLi = li;
                        }
                    
                        categoryLengths[cat] ++;
                        addedThusFar ++;
                        subUl[cat].append(li);
                    }
                    
                    itemCnt = nextIter;                    
                }
                
                var tl = categoryStore[cat].length;
                if (tl == 0) continue;
                
                if ((itemCnt+tl) > (offset+data.maxPerPage)) {  // trim overflow
                    var startIter = itemCnt;
                    var nextIter = itemCnt+tl;
                    for (var j=startIter; j<nextIter; j++) {
                        categoryStore[cat].shift().remove();
                    }
                    itemCnt = nextIter;
                }
            }
            
            return [firstLi, categoryLengths];
            
        },
        
        _resizeWindow : function ( itemInfo) {
        
            var $this = $(this);
            var data = $this.data('inventory');
            
            if (data.preWidth == -1) {
                data.preWidth = $this.outerWidth(true)*2;
            }
            
            $this.dialog('open');
                
            var item = itemInfo.item; // always
            var useCols = itemInfo.useCols;
            
            var lineCount;
            if (data.paged || (data.categories.used && (!data.categories.tabbed))) {
                lineCount = itemInfo.lineCount;
            }
            else {                       
                lineCount = Math.min(data.maxPerPage/useCols, itemInfo.lineCount);
            }
            
            var newHeight = item.outerHeight(true)*lineCount;
            var newWidth = data.preWidth + item.outerWidth(true)*useCols;
            
            if (itemInfo.hasOwnProperty('category')) {
                var category = itemInfo.category;
                
                if (data.categories.tabbed) {
                    newHeight = newHeight + itemInfo.tabUl.parent().outerHeight(true);
                }
                else {
                    catLegend = $('#' + category.attr('id') + ' legend');
                    newHeight = newHeight + catLegend.outerHeight(true)*2*(itemInfo.catCount);
                }
            }
            
            if (data.height != 'auto') {
                newHeight = data.height;
            }
            if (data.width != 'auto') {
                newWidth = data.width;
            }
            
            if (data.paged) {
                $this.inventory('_setPaginationButtons');
            }
            
            $this.inventory('_resizeBox', newWidth, newHeight);
            
            // add info after resize
            
            if (data.infoBar.used) {
                $this.inventory('_addInfoPane');
            }
            
            // recenter after resize
            $this.dialog('option', 'position', {
                my: 'center',
                at: 'center',
                collision: 'fit'
            });
            
        },
        
        _addInfoPane : function() {
        
            var $this = $(this);
            var data = $this.data('inventory');
            
            var infoText = '';
            if (data.infoBar.text) {
                infoText = data.infoBar.text;
            }
            else {
                if (data.lettered && data.letterMemory) {
                    infoText = infoText + " Drag and drop the inventory letters to organize! ";
                }
                if (data.categories.used && data.categories.tabbed) {
                    infoText = infoText + " Click the tabs to switch between categories! ";
                }
            }
            
            if (infoText != '') {
                var infoPane = $('<div class="' + data.infoBar['class']  + '"></div>');
                data.infoPane = infoPane;
                var buttonPane = $this.data('inventory').dialog.parent().find('button:last').parent().parent();
                infoPane.insertBefore(buttonPane);
                infoPane.text(infoText);
            }
        },
        
        _setPaginationButtons : function() {
        
            var $this = $(this);
            var data = $this.data('inventory');
            
            var newButtons = $.extend({}, data.defaultButtons);
            
            var prevOffset = data.lastIndex - data.maxPerPage;
            if (prevOffset >= 0) {
                newButtons[data.prevText] = function() {
                    var $this = $(this);
                    var data = $this.data('inventory');
                    $this.inventory('_clear');
                    $this.inventory('open', data.itemStore, prevOffset);
                };
            }
            
            var nextOffset = data.lastIndex + data.maxPerPage; 
            if (nextOffset <= data.maxPerPage * parseInt(10, data.itemStore.length / data.maxPerPage)) {
                newButtons[data.nextText] = function() {
                    var $this = $(this);
                    var data = $this.data('inventory');
                    $this.inventory('_clear');
                    $this.inventory('open', data.itemStore, nextOffset);
                };
            }
            $this.dialog('option', 'buttons', newButtons);
            
            var cnt = 0;
            for (key in newButtons) {
                if (newButtons.hasOwnProperty(key)) cnt++;
            }
            
            var lastButton = data.dialog.parent().find('button:last');
            for (var i=0; i<cnt; i++) {
                if (lastButton.text() == data.prevText) {
                    lastButton.css('float', 'left');
                    
                }
                else if (lastButton.text() == data.nextText) {
                    lastButton.css('float', 'right');
                }
                
                lastButton = lastButton.prev();                            
            }
            
        },
        
        destroy : function() {
        
            return this.each(function(){
                var $this = $(this);
                var data = $this.data('inventory');

                // Namespace bindings and data
                $(window).unbind('.inventory');
                data.inventory.remove();
                $this.removeData('inventory');
            })
            
        }
        
    };

    $.fn.inventory = function( method ) {

        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        }
        else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        }
        else {
            $.error('Method ' +  method + ' does not exist on jQuery.inventory');
        }    

    };

})( jQuery );
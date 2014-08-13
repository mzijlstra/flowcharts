/* 
 Created on : Juyl 31, 2014, 7:10:01 PM
 Author     : mzijlstra
 */

// wr namespace
var wr = {
    "block": function(id) {
        var elem = $(id);
        var result = elem.clone(true).removeAttr("id");
        if (elem.get(0).init) {
            result.get(0).init = elem.get(0).init;
        }
        return result;
    }
};

// hook up event handlers and frequently used elements
$(function() {
    "use strict";

    wr.vars = {};
    wr.ins_menu = $('#ins_menu');
    wr.proj_menu = $('#project_menu');

    /**********************************
     * Insertion menu related code
     **********************************/
    // display insertion menu when clicking on a connection block
    $(".connection").click(function(event) {
        if (Object.keys(wr.vars).length === 0) {
            alert("Please declare a variable first.");
            $('.variable .var').focus();
        } else if (wr.ins_menu.css("display") === "none") {
            wr.ins_menu.css("top", event.pageY);
            wr.ins_menu.css("left", event.pageX);
            wr.ins_menu.css("display", "block");
            wr.clicked = $(this);
        } else {
            wr.ins_menu.css("display", "none");
        }
        return false;
    });

    // hide insertion menu when clicking elsewhere
    $("body").click(function() {
        if (wr.ins_menu.css("display") !== "none") {
            wr.ins_menu.css("display", "none");
        }
    });

    // menu clicks trigger insertions based on id clicked
    wr.ins_menu.click(function(event) {
        var t = $(event.target);
        var toLoad = '#' + t.attr('id').substr(4);
        wr.clicked.after(wr.block("#connection"))
                .after(wr.block(toLoad));

        // trigger initializer code
        var n = wr.clicked.next().get(0);
        if (n.init && typeof n.init === "function") {
            n.init();
        }

        // TODO AJAX POST instructions
    });

    // initialize the variable name for input and assignment
    // to the last used variable name (declared or selected)
    $('#input, #assignment').each(function(i, o) {
        o.init = function() {
            $(this).find(".var").text(wr.lastVar);
        };
    });

    /************************************
     * Variable declaration related code
     ************************************/
    // store current var name on focus
    $(".variable .var").focus(function() {
        var t = $(this);
        t.attr("cur", t.val());
    });

    // no spaces in variable names, blur on enter
    $(".variable .var").keydown(function(event) {
        if (event.which === 32) {
            return false;
        } else if (event.which === 13) {
            $(event.target).blur();
        }
    });

    // check if we need to update var name on blur
    $(".variable .var").blur(function(event) {
        var t = $(this);

        // cleanly exit fields that are not defined yet
        if (t.val() === "" && t.attr("cur") === "") {
            return true;
        }

        // error messages for bad names
        if (!t.val().match(/^[_a-zA-Z]([_0-9a-zA-Z]+)?$/)) {
            alert("Bad Variable Name\n\n" +
                    "Variables can start with an underscore or a letter.\n" +
                    "Then didigts, underscores, and letters are allowed.");
            this.focus();
            return false;
        }

        // if we were indeed updated
        if (t.attr("cur") !== t.val()) {
            if (wr.vars[t.val()]) {
                alert("Duplicate variable name " + t.val() + "\n" +
                        "Please change one to keep them unique");
                this.focus();
            } else {
                var oldn = t.attr('cur');
                var newn = t.val();
<<<<<<< HEAD
                var elem = t.parent().get(0);
=======
>>>>>>> FETCH_HEAD

                // remove old name from our vars 
                if (t.attr("cur") !== ""
                        && wr.vars[oldn] === elem) {
                    delete wr.vars[oldn];
                }

                // add new name to our vars 
<<<<<<< HEAD
                wr.vars[newn] = elem;
                wr.lastVar = newn;
=======
                wr.vars[newn] = t.parent().get(0);
>>>>>>> FETCH_HEAD

                // update instructions with old name to new name
                $('span.var:contains(' + oldn + ')').text(function(i, s) {
                    return s === oldn ? newn : s;
                });

                // append another declration field
                if (t.parent().hasClass("bottom")) {
                    var p = t.parent();
                    p.removeClass("bottom");
                    p.after(wr.block("#declaration"));
                    var added = $(".variable .var:last-child");
                    added.focus();
                }

                // TODO AJAX Post variables
            }
        }
    });

    /******************************
     * Variable menu related code
     ******************************/
    // repopulate var menu on mouse enter
    $(".assignment .var_container").mouseenter(function(event) {
        var t = $(this);
        var menu = $(t.children(".menu")[0]);

        menu.empty();
        for (var k in wr.vars) {
            menu.append("<div class='menu_item'>" + k + "</div>");
        }
        menu.css("display", "block");
    });

    // handle var menu clicks
    $(".var_container .menu").click(function(event) {
        var t = $(event.target);
        $(this).parent().children("span.var").text(t.text());
<<<<<<< HEAD
        wr.lastVar = t.text();
=======
>>>>>>> FETCH_HEAD
        $(this).hide();
    });

    // hide menu if not clicked
    $(".var_container").mouseleave(function() {
        $(this).children(".menu").css("display", "none");
    });

    /**************************************
     * Expression declaration related code
     **************************************/
    var expDecl = function(elem) {
        var t = $(elem);
        var i = $($("<input type='text' />"));
        i.val(t.text());
<<<<<<< HEAD

=======
        
>>>>>>> FETCH_HEAD
        i.keydown(function(event) {
            if (event.which === 13) {
                this.blur();
            }
        });
<<<<<<< HEAD

=======
        
>>>>>>> FETCH_HEAD
        i.blur(function() {
            var t = $(this);
            var exp = t.val();
            var p = t.parent();
            p.empty().text(exp);
        });
<<<<<<< HEAD

        t.append(i);
        i.focus();
    };

    $("span.exp, div.exp").click(function() {
        expDecl(this);
    });

=======
        
        t.append(i);
        i.focus();    
    };
    
    $("span.exp, div.exp").click(function() {
        expDecl(this);
    });
    
>>>>>>> FETCH_HEAD
    $(".diamond").click(function(event) {
        expDecl($(this).find(".exp").get(0));
    });
});

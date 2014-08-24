/* 
 Created on : Juyl 31, 2014, 7:10:01 PM
 Author     : mzijlstra
 */

// wr namespace
var wr = {
    "block": function(id) {
        var elem = $(id);
        var result = elem.clone(true).removeAttr("id");

        // also copy init and destroy methods
        if (elem.get(0).init) {
            result.get(0).init = elem.get(0).init;
        }
        if (elem.get(0).destroy) {
            result.get(0).destroy = elem.get(0).destroy;
        }
        return result;
    }
};

// hook up event handlers and frequently used elements
$(function() {
    "use strict";

    wr.mode = "beginner";
    wr.functions = {'main': {}};
    wr.curvars = wr.functions.main;
    wr.vararea = $("#vars_main");
    wr.insarea = $("#ins_main");
    wr.ins_menu = $('#ins_menu');
    wr.proj_menu = $('#project_menu');

    /**********************************
     * Insertion menu related code
     **********************************/
    // display insertion menu when clicking on a connection block
    $(".connection").click(function(event) {
        // get the amount of variables declared, compatible with old brwsrs
        var size = 0;
        if (Object.keys) {
            size = Object.keys(wr.curvars).length;
        } else {
            for (var k in wr.curvars)
                size++;
        }

        // check if we should insert
        if (size === 0) {
            alert("Please declare a variable first.");
            $('.variable .var').focus();
        } else if (wr.ins_menu.css("display") === "none") {
            wr.ins_menu.css("top", event.pageY);
            wr.ins_menu.css("left", event.pageX);
            wr.ins_menu.show();
            wr.clicked = $(this);
        } else {
            wr.ins_menu.hide();
        }
        return false;
    });

    // hide insertion menu when clicking elsewhere
    $("body").click(function() {
        if (wr.ins_menu.css("display") !== "none") {
            wr.ins_menu.hide();
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
            if (wr.mode !== "beginner") {
                $(this).find(".var").text(wr.lastVar);
            }
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
            if (wr.curvars[t.val()]) {
                alert("Duplicate variable name " + t.val() + "\n" +
                        "Please change one to keep them unique");
                this.focus();
            } else {
                var oldn = t.attr('cur');
                var newn = t.val();
                var elem = t.parent().get(0);

                // remove old name from our vars 
                if (t.attr("cur") !== ""
                        && wr.carvars[oldn] === elem) {
                    delete wr.carvars[oldn];
                }

                // add new name to our vars 
                wr.curvars[newn] = elem;
                wr.lastVar = newn;
                wr.curvars[newn] = t.parent().get(0);

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
        for (var k in wr.curvars) {
            menu.append("<div class='menu_item'>" + k + "</div>");
        }
        menu.show();
    });

    // handle var menu clicks
    $(".var_container .menu").click(function(event) {
        var t = $(event.target);
        $(this).parent().children("span.var").text(t.text());
        wr.lastVar = t.text();
        $(this).hide();
    });

    // hide menu if not clicked
    $(".var_container").mouseleave(function() {
        $(this).children(".menu").hide();
    });

    /**************************************
     * Expression declaration related code
     **************************************/
    var inputHere = function(elem, blur) {
        var t = $(elem);
        var i = $($("<input type='text' />"));
        i.val(t.text());
        i.keydown(function(event) {
            if (event.which === 13) {
                this.blur();
            }
        });
        i.blur(function() {
            var t = $(this);

            // check if the blur handler needs executing
            if (typeof blur === "function") {
                if (!blur(t)) {
                    return false;
                }
            }

            var exp = t.val();
            var p = t.parent();
            p.empty().text(exp);
        });

        t.append(i);
        i.focus();
    };

    $("span.exp, div.exp").click(function() {
        inputHere(this);
    });

    $(".diamond").click(function(event) {
        inputHere($(this).find(".exp").get(0));
    });

    /***********************************
     * Deletion related code
     ***********************************/
    // hook up delete click handlers
    $(".statement .del").click(function() {
        var p = $(this).parent();
        if (!p.hasClass("statement")) {
            p = p.parents(".statement");
        }
        var pelem = p.get(0);
        var c = p.next(); // connector
        if (!pelem.destroy || pelem.destroy()) {
            c.remove();
            p.remove();
        }
    });

    // add confirmation meessages if and while stmts
    $("#if, #while").each(function(i, o) {
        o.destroy = function() {
            return confirm("Are you sure you want to delete this "
                    + o.getAttribute("id") + " statement and everything "
                    + "inside it?");
        };
    });

    // variable delete handler
    $(".variable .del").click(function() {
        var p = $(this).parent();
        var name = p.children("input").val();
        if (!p.hasClass("inuse")) {
            p.remove();
            delete wr.curvars[name];
        } else {
            alert("Cannot remove variable while in use");
        }
    });

    // gray out variable deletes if var in use
    $(".variable").mouseenter(function() {
        var t = $(this);
        var name = t.children("input").val();
        var inuse = false;
        $(".statement .var").each(function(i, o) {
            if (!inuse && $(o).text() === name) {
                inuse = true;
                t.addClass("inuse");
            }
        });
        if (!inuse && t.hasClass("inuse")) {
            t.removeClass("inuse");
        }
    });

    // function delete handler
    $(".rem").click(function() {
        var t = $(this);
        var n = t.parent().children(".name").text();
        if (n === "main") {
            alert("Cannot delete main, the program cannot start without it");
            return false;
        } else if (confirm("Delete the function: " + n + "?")) {
            $("#vars_" + n).remove();
            $("#ins_" + n).remove();
            t.parent().remove();
            $("#fun-names .fun")[0].click();
        }
    });

    /*************************************
     * Adding and switching to functions
     *************************************/
    // add a function
    $("#add_fun").click(function() {

        // ask for new function name
        var bad = true;
        while (bad) {
            var n = prompt("Name for new function:");
            if (!n.match(/^[_a-zA-Z]([_0-9a-zA-Z]+)?$/)) {
                alert("Bad Function Name\n\n" +
                        "Functions can start with an underscore or a letter.\n" +
                        "Then didigts, underscores, and letters are allowed.");
            } else if (wr.functions[n]) {
                alert("Duplicate Function Name\n\n" +
                        "Please change the name to keep the functions unique");
            } else {
                bad = false;
            }
        }

        // create a new scope for the variables
        wr.functions[n] = {};

        // append a new function name tab
        var fname = wr.block("#fun-name");
        fname.find(".name").text(n);
        $("#fun-names").append(fname);

        // append a new instructions area
        var ins = $("<div id='ins_" + n + "' class='instructions'></div>");
        // FIXME function name in start block
        ins.append(wr.block("#start"))
                .append(wr.block("#connection"))
                .append(wr.block("#return"));
        ins.find(".name").text(n);
        $("#instructions").append(ins);

        // append a new variables area
        var vs = $("<div id='vars_" + n + "' class='variables'></div>");
        vs.append("<div class='label'>Parameters:</div>");
        vs.append(wr.block("#declaration"));
        vs.append("<div class='label'>Variables:</div>");
        vs.append(wr.block("#declaration"));
        $("#variables").append(vs);

        // TODO AJAX call to create function on server

        // switch to our new function (see below)
        fname.click();
    });

    // switching to a different function
    $(".fun").click(function() {
        var t = $(this);
        var n = t.find(".name").text();

        // deactivate the previous tab, instructions area, variables area
        $(".active").removeClass("active");

        // activate areas for this function
        t.addClass("active");
        $("#vars_" + n).addClass("active");
        $("#ins_" + n).addClass("active");

        // also switch over global vars
        wr.curvars = wr.functions[n];
        wr.vararea = $("#vars_" + n);
        wr.insarea = $("#ins_" + n);
    });

    // renaming a function
    $(".start").click(function() {
        var n = $(this).find(".name");
        n.attr("cur", n.text());
        inputHere(n.get(0), function(t) {
            var cur = n.attr("cur");
            if (cur === "main") {
                alert("Cannot rename function main");
                n.text("main");
                return true;
            }

            if (cur !== t.val()) {
                var upd = t.val();

                // make sure it's valid
                if (!upd.match(/^[_a-zA-Z]([_0-9a-zA-Z]+)?$/)) {
                    alert("Bad Function Name\n\n" +
                            "Functions can start with an underscore or a letter.\n" +
                            "Then didigts, underscores, and letters are allowed.");
                    t.focus();
                    return false;
                }

                // make sure it's not duplicate
                if (wr.functions[upd]) {
                    alert("Duplicate function name, please change it to keep " +
                            "function names unique.");
                    t.focus();
                    return false;
                }

                // do the update
                wr.functions[upd] = wr.functions[cur];
                delete wr.functions[cur];
                $("#vars_" + cur).attr("id", "vars_" + upd);
                $("#ins_" + cur).attr("id", "ins_" + upd);
                $("#fun-names .active .name").text(upd);
                return true;
            }
        });
    });

});

/* 
 Created on : Juyl 31, 2014, 7:10:01 PM
 Author     : mzijlstra
 */

// wr namespace
var wr = {};

// hook up event handlers and frequently used elements
$(function() {
    "use strict";

    wr.mode = "beginner";
    wr.functions = {'main': {}};
    wr.curvars = wr.functions.main;
    wr.vararea = $("#vars_main");
    wr.insaÏrea = $("#ins_main");
    wr.ins_menu = $('#ins_menu');
    wr.proj_menu = $('#project_menu');
    
    /*
     * Setup AJAX Error Handling
     */
    $(document).ajaxError(function(e) {
        alert("Network Error -- please check your connection and try again.");
    });

    /*
     * Helper functions
     */
    var cloneBlock = function(id) {
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
    };

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

    /*
     * Variable declaration related code
     */
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
                if (oldn !== "" && wr.curvars[oldn] === elem) {
                    delete wr.curvars[oldn];
                }

                // add new name to our vars 
                wr.curvars[newn] = elem;
                wr.lastVar = newn;
                wr.curvars[newn] = t.parent().get(0);

                // update instructions with old name to new name
                $('span.var:contains(' + oldn + ')').text(function(i, s) {
                    return s === oldn ? newn : s;
                });

                // update param name in signature
                if (t.parent().hasClass("parameter")) {
                    var type = t.parent().find(".type").text();
                    var tn = type + " " + newn;
                    var params = $(".active .start .params");
                    var ptext = params.text();

                    // if this is a new name
                    if (oldn === "") {
                        if (ptext === "") {
                            params.text(tn);
                        } else {
                            params.text(ptext + ", " + tn);
                        }
                    } else { // existing param
                        params.text(ptext.replace(
                                new RegExp(type + " " + oldn), tn));
                    }
                }

                // append another declration field
                if (t.parent().hasClass("bottom")) {
                    var p = t.parent();
                    p.removeClass("bottom");
                    if (t.parent().hasClass("parameter")) {
                        p.after(cloneBlock("#declaration").addClass("parameter"));
                    } else {
                        p.after(cloneBlock("#declaration"));
                    }
                    var added = p.parent().find(".var:last-child");
                    added.focus();
                }

                // TODO AJAX Post variables
            }
        }
    });

    // helper for the next two functions
    var updParamType = function(oldt, newt) {
        var params = $(".active .start .params");
        var ptext = params.text();

        params.text(ptext.replace(
                new RegExp(oldt), newt));
    };

    // handle type menu clicks
    $(".type_container .menu_item").click(function() {
        var t = $(this);
        var display = t.parents(".type_container").find(".type");
        var type = t.text();
        var prev = display.text();
        var n = t.parents(".parameter").children("input.var").val();

        // change to new type
        display.text(type);

        // if param also update signature (if we have a name / are declared)
        if (t.parents(".parameter") && n) {
            updParamType(prev + " " + n, type + " " + n);
        }

        t.parent().hide();
        return false; // so as not to trigger function rename
    });

    // special case edit item in type menu
    $(".type_container .menu_edit").click(function() {
        var t = $(this);
        var display = t.parents(".type_container").find(".type");
        var oldt = display.text();

        inputHere(display, function(t) {
            var n = t.parents(".parameter").children("input.var").val();
            if (t.parents(".parameter") && n) {
                updParamType(oldt, t.val());
            }
            return true;
        });

        t.parent().hide();
        return false; // so as not to trigger function renme
    });

    // reset type menu hide status & add item highlight
    $(".type").mouseenter(function() {
        var t = $(this);
        var m = t.parent().children(".menu");
        m.find(".menu_item").each(function(i, o) {
            if ($(o).text() === t.text()) {
                $(o).addClass("menu_hl");
            }
        });
        m.show();
    });

    // remove item highlight (both type and var menus!)
    $(".menu").mouseenter(function() {
        $(this).children(".menu_hl").removeClass("menu_hl");
    });

    // hide menu when mouse out
    $(".type_container").mouseleave(function() {
        $(this).find(".menu").hide();
    });

    // variable delete handler
    $(".variable .del").click(function() {
        var p = $(this).parent();
        var name = p.children("input").val();
        if (!p.hasClass("inuse")) {
            p.remove();
            delete wr.curvars[name];

            // if param also update signature
            if (p.hasClass("parameter")) {
                var params = $(".active .start .params");
                var ptext = params.text();
                var type = p.find(".type").text();

                params.text(ptext.replace(
                        new RegExp("(, )?" + type + " " + name), ""));

                // fix trailing comma when deleting first param
                if (params.text().match(/^, /)) {
                    ptext = params.text();
                    params.text(ptext.replace(/^, /, ""));
                }
            }
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


    /*
     * Statement related code
     */
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
        wr.clicked.after(cloneBlock("#connection"))
                .after(cloneBlock(toLoad));

        // trigger initializer code
        var n = wr.clicked.next().get(0);
        if (n.init && typeof n.init === "function") {
            n.init();
        }

        // TODO AJAX POST instructions
    });

    // repopulate var select menu (in/out/asgn) on mouse enter
    $(".assignment .var_container").mouseenter(function(event) {
        var t = $(this);
        var menu = $(t.children(".menu")[0]);
        var cur = t.find(".var").text();

        menu.empty();
        for (var k in wr.curvars) {
            menu.append("<div class='menu_item'>" + k + "</div>");
        }
        // highlight current
        if (cur && cur !== " ") {
            menu.find(".menu_item:contains(" + cur + ")").addClass("menu_hl");
        }
        menu.show();
    });

    // handle var select menu clicks
    $(".var_container .menu").click(function(event) {
        var t = $(event.target);
        $(this).parent().children("span.var").text(t.text());
        wr.lastVar = t.text();
        $(this).hide();
    });

    // hide var select menu if not clicked
    $(".var_container").mouseleave(function() {
        $(this).children(".menu").hide();
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

    /*
     * Expression declaration related code
     */
    $("span.exp, div.exp").click(function() {
        inputHere(this);
    });

    $(".diamond").click(function(event) {
        inputHere($(this).find(".exp").get(0));
    });


    /*
     * Function related code
     */
    // helper function to add a web-raptor function
    var addFun = function(id, name, idata, vdata) {
        // create a new scope for the variables
        wr.functions[name] = {};

        // append a new function name tab
        var fname = cloneBlock("#fun-name");
        fname.find(".name").text(name);
        fname.attr("fid", id);
        $("#fun-names").append(fname);

        // append a new instructions area
        var ins = $("<div id='ins_" + name + "' class='instructions'></div>");
        ins.append(idata);
        $("#instructions").append(ins);

        // append a new variables area
        var vs = $("<div id='vars_" + name + "' class='variables'></div>");
        vs.append(vdata);
        $("#variables").append(vs);

        // return the fname object so that callers can switch to this function
        return fname;
    };

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

        // append a new instructions area
        var idata = $("<div></div>");
        idata.append(cloneBlock("#start"))
                .append(cloneBlock("#connection"))
                .append(cloneBlock("#return"));
        idata.find(".name").text(n);

        // create a new pramaters area 
        var pm = $("<div class='params'></div>");
        pm.append("<div class='label'>Parameters:</div>");
        pm.append(cloneBlock("#declaration").addClass("parameter"));

        // append a new variables area
        var vdata = $("<div></div>");
        vdata.append(pm);
        vdata.append("<div class='label'>Variables:</div>");
        vdata.append(cloneBlock("#declaration"));

        // AJAX call to create function on server
        var pid = $("h1").attr("pid");
        $.ajax({
            "type": "POST",
            "url": "project/" + pid + "/" + n,
            "data": {"idata": idata.html(), "vdata": vdata.html()},
            "success": function(data) {
                var fid = JSON.parse(data);
                if ($.isNumeric(result)) {
                    // add the function to the HTML
                    var fname = addFun(fid, n, idata.html(), vdata.html());

                    // switch to our new function (as defined below)
                    fname.click();
                }
            }
        });
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

    /*
     * Startup code
     */
    // retrieve function data for the current project
    (function() {
        var pid = $("h1").attr("pid");
        $.get("project/" + pid, function(data) {
            
            // data is a JSON array of function objects
            data = JSON.parse(data);
            var main = false;
            for (var i = 0; i < data.length; i++) {
                var fdata = data[i];
                if (!main) {
                    main = addFun(fdata[0], fdata[1], fdata[2], fdata[3]);
                } else {
                    addFun(fdata[0], fdata[1], fdata[2], fdata[3]);
                }
                
                // switch to main
                main.click();
            }
        });
    })();

});

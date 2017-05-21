/* 
 Created on : July 31, 2014, 7:10:01 PM
 Author     : mzijlstra
 */

/*
 * This file contains the code (event handlers and helper functions for them)
 * for the edit state, because it is so big I've creating clearly delinated 
 * sections with block comment headers 
 */

var wr; // global variable created in the wr module

$(function () {
    "use strict";

    /********************************************************
     * Application State Setup Code (after flow chart loaded from DB)
     ********************************************************/
    // build local variables in wr.functions for each chart
    $(function () {
        $("#workspace .fun .name").each(function () {
            var name = $(this).text();
            wr.functions[name] = {};
            $("#vars_" + name + " input.var").each(function () {
                var v = $(this).val();
                if (v) {
                    wr.functions[name][v] = this;
                }
            });
        });
        wr.state.curvars = wr.functions.main;
    });

    // Setup AJAX Error Handling
    $(document).ajaxError(function () {
        wr.alert("Network Error\n\n" +
                "Or Session Timeout" +
                "Please check your connection or try logging in again.");
    });



    /********************************************************
     * Helper functions
     ********************************************************/
    /**
     * Internal helper function for ajax calls that should not return data
     * If they do return data the session has probably timed out, and the
     * browser will be redirected to the login page
     * @param {type} data
     * @returns {undefined}
     */
    var shouldNotHaveData = function (data) {
        if (data !== "") {
            window.location.assign("../login");
        }
    };

    /**
     * Will ajax POST the variables for the current flowchart to the server
     * @returns {undefined}
     */
    var postVarUpd = function () {
        var vdata = $(".variables.active").html();
        var fid = $(".fun.active").data("fid");
        $.post("../function/" + fid + "/vars", {
            "vdata": vdata
        }, shouldNotHaveData);
    };

    /**
     * Will ajax POST the instructions for the current flowchart to the server
     * @returns {undefined}
     */
    var postInsUpd = function () {
        var idata = $(".instructions.active").html();
        var fid = $(".fun.active").data("fid");
        $.post("../function/" + fid + "/ins", {
            "idata": idata
        }, shouldNotHaveData);
    };

    /**
     * Deep clones the flow chart block indicated by the given id
     * @param {string} id
     * @returns {Element} cloned element
     */
    var cloneBlock = function (id) {
        var elem = $(id);
        var result = elem.clone(true).removeAttr("id");

        // also copy destroy, ready, and exec methods
        result[0].destroy = elem[0].destroy;
        result[0].ready = elem[0].ready;
        return result;
    };

    /**
     * Creates an input field on top of the given element, containing the text
     * of the given element, ready to be edited
     * @param {Element} elem The element that contains the text
     * @param {Function} [blur] validation function, if it returns false
     * we cancel the blur and continue editing
     * @returns {undefined}
     */
    var inputHere = function (elem, blur) {
        // see if there is an existing input element (due to double click)
        var t = $(elem);
        var i = t.find("input");
        if (i.length) {
            i.focus();
            return;
        }

        // create input element and set text
        i = $("<input type='text' />");
        var old = t.text().trim();
        i.val(old);
        t.text("_"); // so that block doesn't show (weird)

        // dynamically resize field based on contents
        var resize = function () {
            var length = i.val().length * 8;
            if (length < 50) {
                length = 50;
            }
            i.css("width", length);
        };
        i.focus(resize);

        // onkeydown resize and also blur when enter is pressed
        i.keydown(function (event) {
            if (event.which === 13) {
                this.blur();
            }

        });
        i[0].oninput = function (event) {
            resize();
        };

        // on call optional fun (that can block blur), and assign new val
        i.blur(function () {
            // check if the blur handler needs executing
            if (typeof blur === "function") {
                if (!blur(i)) {
                    i.focus();
                    return false;
                }
            }

            var exp = i.val();
            t.empty().text(exp);

            // send changes to server
            postInsUpd();
        });

        t.append(i);
        i.focus();
    };
    // The JS reserved keywords (fun and var names that are not allowed)
    var reserved = {'abstract': true, 'arguments': true, 'boolean': true,
        'break': true, 'byte': true, 'case': true, 'catch': true, 'char': true,
        'class': true, 'const': true, 'continue': true, 'debugger': true,
        'default': true, 'delete': true, 'do': true, 'double': true,
        'else': true, 'enum': true, 'eval': true, 'export': true,
        'extends': true, 'false': true, 'final': true, 'finally': true,
        'float': true, 'for': true, 'function': true, 'goto': true, 'if': true,
        'implements': true, 'import': true, 'in': true, 'instanceof': true,
        'int': true, 'interface': true, 'let': true, 'long': true,
        'native': true, 'new': true, 'null': true, 'package': true,
        'private': true, 'protected': true, 'public': true, 'return': true,
        'short': true, 'static': true, 'super': true, 'switch': true,
        'synchronized': true, 'this': true, 'throw': true, 'throws': true,
        'transient': true, 'true': true, 'try': true, 'typeof': true,
        'var': true, 'void': true, 'volatile': true, 'while': true,
        'with': true, 'yield': true};





    /********************************************************
     * Variable declaration related code
     ********************************************************/
    // store current var name on focus
    $(".variable .var").focus(function () {
        var t = $(this);
        t.data("cur", t.val());
    });

    // no spaces in variable names, blur on enter
    $(".variable .var").keydown(function (event) {
        if (event.which === 32) {
            return false;
        }
        if (event.which === 13) {
            $(event.target).blur();
        }
    });

    // check if we need to update var name on blur
    $(".variable .var, #declaration .var").blur(function () {
        var t = $(this);

        // cleanly exit fields that are not defined yet
        if (t.val() === "" && t.data("cur") === "") {
            return true;
        }

        // error messages for bad names
        if (!t.val().match(/^[_a-zA-Z]([_0-9a-zA-Z]+)?$/)) {
            wr.alert("Bad Variable Name:\n\n" +
                    "Variables can start with an underscore or a letter.\n" +
                    "Then didigts, underscores, and letters are allowed.");
            this.focus();
            return false;
        }

        // Check that the variable name is not a JS keyword
        if (reserved[t.val()]) {
            wr.alert("Bad Variable Name:\n\n" + t.val() +
                    "\n\nIs a javascript reserved keyword");
            this.focus();
            return false;
        }

        // if we were indeed updated
        if (t.data("cur") !== t.val()) {
            if (wr.state.curvars[t.val()]) {
                wr.alert("Duplicate variable Name: " + t.val() + "\n\n" +
                        "Please change one to keep them unique.");
                t.val(t.data("cur"));
                t.focus();
                return false;
            }
            if (wr.functions[t.val()]) {
                wr.alert("Conflict with function name: " + t.val() + "\n\n" +
                        "Please change your variable name to keep it unique");
                t.val(t.data("cur"));
                t.focus();
                return false;
            }

            var oldn = t.data('cur');
            var newn = t.val();
            var elem = this;

            // set value attribute to newn 
            // otherwise .html() doesn't take it on postVarUpd
            t.attr("value", t.val());

            // remove old name from our vars 
            if (oldn !== "" && wr.state.curvars[oldn] === elem) {
                delete wr.state.curvars[oldn];
            }

            // add new name to our vars 
            wr.state.curvars[newn] = elem;

            // update instructions with old name to new name
            $('.active span.var:contains(' + oldn + ')').text(
                    function (i, s) {
                        return s === oldn ? newn : s;
                    });

            // update param name in signature
            if (t.parent().hasClass("parameter")) {
                // rebuild the params string
                var str = "";
                $(".variables.active .parameter").each(function () {
                    var th = $(this);
                    var type = th.find(".type").text();
                    var name = th.find("input").val();
                    if (name !== "") {
                        if (str === "") {
                            str += type + " " + name;
                        } else {
                            str += ", " + type + " " + name;
                        }
                    }
                });
                $(".active .start .params").text(str);

                // also update the instruction signature on server
                postInsUpd();
            }

            // append another declration field
            if (t.parent().hasClass("bottom")) {
                var p = t.parent();
                p.removeClass("bottom");
                if (t.parent().hasClass("parameter")) {
                    p.after(cloneBlock("#declaration")
                            .addClass("parameter"));
                } else {
                    p.after(cloneBlock("#declaration"));
                }
                var added = p.parent().find(".var:last-child");
                added.focus();
            }

            // AJAX Post variables
            postVarUpd();
        }
    });

    // handle type menu clicks
    $(".type_container .menu_item").click(function () {
        var t = $(this);
        var display = t.parents(".type_container").find(".type");
        var type = t.text();
        var prev = display.text();
        var n = t.parents(".parameter").children("input.var").val();

        // change to new type
        display.text(type);

        // if param also update signature (if we have a name / are declared)
        if (t.parents(".parameter") && n) {
            var oldt = prev + " " + n;
            var newt = type + " " + n;
            var params = $(".active .start .params");
            var ptext = params.text();

            params.text(ptext.replace(new RegExp(oldt), newt));
            // change signature on server
            postInsUpd();
        }

        // change var type on server
        postVarUpd();

        t.parent().hide();
        return false; // so as not to trigger function rename
    });

    // reset type menu hide status & add item highlight
    $(".type").mouseenter(function () {
        var t = $(this);
        var m = t.parent().children(".menu");
        m.find(".menu_item").each(function () {
            if ($(this).text() === t.text()) {
                $(this).addClass("menu_hl");
            }
        });
        m.show();
    });

    // remove item highlight (both type and var menus!)
    $(".menu").mouseenter(function () {
        $(this).children(".menu_hl").removeClass("menu_hl");
    });

    // hide menu when mouse out
    $(".type_container").mouseleave(function () {
        $(this).find(".menu").hide();
    });

    // variable delete handler
    $(".variable .del").click(function () {
        var p = $(this).parent();
        var name = p.children("input").val();
        if (!p.hasClass("inuse")) {
            p.remove();
            delete wr.state.curvars[name];

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

                // change signature on server
                postInsUpd();
            }
            // post var removal to server
            postVarUpd();
        } else {
            wr.alert("Cannot remove variable while in use.");
        }
    });

    // gray out variable deletes if var in use
    $(".variable").mouseenter(function () {
        var t = $(this);
        var name = t.children("input").val();
        var inuse = false;
        $(".active .statement .var").each(function (i, o) {
            if (!inuse && $(o).text() === name) {
                inuse = true;
                t.addClass("inuse");
            }
        });
        if (!inuse && t.hasClass("inuse")) {
            t.removeClass("inuse");
        }
    });





    /********************************************************
     * Statement related code
     ********************************************************/
    var ins_menu = $('#ins_menu');

    // display insertion menu when clicking on a connection block
    $(".connection").click(function (event) {
        // check if we should insert
        if ($('#workspace').hasClass("exec")) {
            // silently inore request to show menu
        } else if (ins_menu.css("display") === "none") {
            ins_menu.css("top", event.pageY);
            ins_menu.css("left", event.pageX);
            ins_menu.show();
            wr.clicked = $(this);
        } else {
            ins_menu.hide();
        }
        return false;
    });

    // hide insertion menu when clicking elsewhere
    $("body").click(function () {
        if (ins_menu.css("display") !== "none") {
            ins_menu.hide();
        }
    });

    // menu clicks trigger insertions based on id clicked
    ins_menu.click(function (event) {
        var t = $(event.target);
        var id = t.attr('id').substr(4);
        if (id && id !== "menu") {
            wr.clicked.before(cloneBlock("#connection"))
                    .before(cloneBlock('#' + id));

            postInsUpd();
        }
    });

    // handle click on variable in statement to edit it
    $("div.var_container > span.var").click(function () {
        var t = $(this);
        t.siblings(".menu").hide();
        inputHere(this, function () {
            // in case it has it
            t.closest(".statement").removeClass("type_error exp_error");
            return true;
        });
    });


    // repopulate var select menu (asgn) on mouse enter
    $(".var_container").mouseenter(function () {
        if ($('#workspace').hasClass('exec')) {
            return false; // don't show if we're executing
        }

        var t = $(this);
        var menu = $(t.children(".menu")[0]);
        var cur = t.find(".var").text();

        menu.empty();
        for (var k in wr.state.curvars) {
            menu.append("<div class='menu_item'>" + k + "</div>");
        }
        // highlight current
        if (cur && cur !== " ") {
            menu.find(".menu_item:contains(" + cur + ")").addClass("menu_hl");
        }
        menu.show();
    });

    // handle var select menu clicks
    $(".var_container .menu").click(function (event) {
        // check to see if the selected var has the right type
        var t = $(this);
        var gp = t.parent().parent();
        var name = $(event.target).text();
        var type = $(wr.state.curvars[name]).siblings(".type_container")
                .find(".type").text();

        if (gp.hasClass("input") && type !== "string" ||
                gp.hasClass("assignment") &&
                !wr.verifyType(gp.children(".exp")[0], type, "silent")) {
            gp.parent().addClass("type_error");
        } else {
            gp.parent().removeClass("type_error");
        }

        // set variable name into var span
        $(this).parent().children("span.var").text(name);
        $(this).hide();

        postInsUpd();
    });

    // hide var select menu if not clicked
    $(".var_container").mouseleave(function () {
        $(this).children(".menu").hide();
    });

    // hook up delete click handlers
    $(".statement .del").click(function (event) {
        event.stopPropagation();
        var p = $(this).parent();
        if (!p.hasClass("statement")) {
            p = p.closest(".statement");
        }
        var pelem = p[0];
        var c = p.prev(); // connector
        if (!pelem.destroy || pelem.destroy()) {
            c.remove();
            p.remove();
        }
        postInsUpd();
    });

    // add confirmation messages if and while stmts
    $(".if, .while").each(function () {
        var t = $(this);
        var p = t.parent()[0];

        p.destroy = function (event) {
            var th = $(this);
            wr.confirm("Are you sure you want to delete this " +
                    t.attr("class") + " statement\n and everything " +
                    "inside it?", function () {
                        var pre = th.prev();
                        pre.detach();
                        th.detach();
                    });
            return false;
        };
    });





    /********************************************************
     * Expression declaration related code
     ********************************************************/
    // output expressions
    $(".output .exp").click(function () {
        inputHere(this, function (t) {
            wr.verifyType(t, "any");
            return true;
        });
    });
    // assignment expressions
    $(".assignment .exp").click(function () {
        var name = $(this).siblings(".var_container").children(".var")
                .text().trim();
        if (name === "") {
            wr.alert("Please select a variable first.");
            return false;
        }
        var type = $(wr.state.curvars[name]).prev().find(".type").text();
        inputHere(this, function (t) {
            wr.verifyType(t, type);
            return true;
        });
    });
    // call expressions
    $(".call .exp").click(function () {
        inputHere(this, function (t) {
            wr.verifyType(t, "any");
            return true;
        });
    });
    // if and while condition expressions
    $(".diamond").click(function (event) {
        event.stopPropagation(); // in case we clicked .exp inside diamond
        var exp = this;
        if ($(this).hasClass("diamond")) {
            exp = $(this).find(".exp")[0];
        }
        inputHere(exp, function (t) {
            wr.verifyType(t, "boolean");
            return true;
        });
    });
    // return expressions
    $(".stop").click(function () {
        var exp = $(this).find(".exp")[0];
        var type = $('.active .start .type').text();
        inputHere(exp, function (t) {
            wr.verifyType(t, type);
            return true;
        });
    });





    /********************************************************
     * Function related code
     ********************************************************/
    // add a function
    $("#add_fun").click(function () {
        // helper to check if the given name can be used
        var checkName = function (n) {
            var good = false;
            if (reserved[n]) {
                wr.alert("Bad Fucntion Name:\n\n" + n +
                        "\n\nIs a javascript reserved keyword");
            } else if (!n.match(/^[_a-zA-Z]([_0-9a-zA-Z]+)?$/)) {
                wr.alert("Bad Function Name:\n\n" +
                        "Functions can start with an underscore or a letter.\n" +
                        "Then didigts, underscores, and letters are allowed.");
            } else if (wr.functions[n]) {
                wr.alert("Duplicate Function Name\n\n" +
                        "Please change the function name to keep it unique.");
            } else if (wr.functions[wr.state.curfun][n]) {
                // should we check for conflicts with variable names
                // in all current functions?
                wr.alert("Conflict found with variable name: " + n + "\n\n" +
                        "Please change the function name to keep it unique.");
            } else {
                good = true;
            }
            return good;
        };

        // helper to process the name 
        var useName = function (n) {
            // append a new instructions area
            var idata = $("<div id='ins_" + n +
                    "' class='instructions'></div>");
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
            var pid = $("h1").data("pid");
            $.ajax({
                "type": "POST",
                "url": pid + "/add/" + n,
                "data": {"idata": idata.html(), "vdata": vdata.html()},
                "dataType": "json",
                "success": function (fid) {
                    if ($.isNumeric(fid)) {
                        // add the function to the HTML
                        wr.functions[n] = {};

                        // append a new function name tab
                        var fname = cloneBlock("#fun-name");
                        fname.find(".name").text(n);
                        fname.data("fid", fid);
                        $("#fun-names").append(fname);

                        // append a new instructions area
                        $("#instructions").append(idata);

                        // append a new variables area
                        var vs = $("<div id='vars_" + n +
                                "' class='variables'></div>");
                        vs.append(vdata);
                        $("#variables").append(vs);

                        // switch to our new function (as defined below)
                        fname.click();
                    }
                }
            });
        };

        var requestName = function () {
            wr.prompt("Name for new function:", function (n) {
                if (checkName(n)) {
                    useName(n);
                } else {
                    return true; // causes prompt to stay on screen
                }
            });
        };
        requestName();
    });

    // switching to a different function
    $(".fun").click(function () {
        var t = $(this);
        var n = t.find(".name").text();

        // deactivate the previous tab, instructions area, variables area
        $(".active").removeClass("active");

        // activate areas for this function
        t.addClass("active");
        $("#vars_" + n).addClass("active");
        $("#ins_" + n).addClass("active");

        // also switch over global vars
        wr.state.curvars = wr.functions[n];
        wr.state.curfun = n;

        window.location.assign("#fun_" + n);
    });

    // renaming a function
    $(".start").click(function () {
        if ($('#workspace').hasClass('exec')) {
            return false; // don't show if we're executing
        }

        var n = $(this).find(".name");
        if (n.text() === "main") {
            wr.alert("Cannot rename function main. \n\n" +
                    "It is needed as entry point for the program.");
            n.text("main");
            return false;

        }
        n.data("cur", n.text());
        inputHere(n.get(0), function (t) {
            var cur = n.data("cur");
            if (cur !== t.val()) {
                var upd = t.val();

                // Check that the function name is not a JS keyword
                if (reserved[t.val()]) {
                    wr.alert("Bad Funtction Name:\n\n" + t.val() +
                            "\n\nIs a javascript reserved keyword");
                    this.focus();
                    return false;
                }

                // make sure it's valid
                if (!upd.match(/^[_a-zA-Z]([_0-9a-zA-Z]+)?$/)) {
                    wr.alert("Bad Function Name:\n\n" +
                            "Functions can start with an underscore or a letter.\n" +
                            "Then didigts, underscores, and letters are allowed.");
                    t.focus();
                    return false;
                }

                // make sure it's not duplicate
                if (wr.functions[upd]) {
                    wr.alert("Duplicate function name, please change it to keep " +
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
                wr.state.curfun = upd;

                // AJAX rename function
                var fid = $(".fun.active").data("fid");
                $.post("../function/" + fid + "/rename", {
                    "name": upd
                }, shouldNotHaveData);
            }
            return true;
        });
    });

    // function delete handler
    $(".rem").click(function () {
        var t = $(this);
        var n = t.parent().children(".name").text();
        if (n === "main") {
            wr.alert("Cannot delete main.\n\n" +
                    "The program cannot start without it.");
            return false;
        }
        wr.confirm("Delete the function: " + n + "?", function () {
            $("#vars_" + n).remove();
            $("#ins_" + n).remove();
            t.parent().remove();
            delete wr.functions[n];
            $("#fun-names .fun")[0].click();

            // AJAX delete function
            var fid = t.parent().data("fid");
            $.post("../function/" + fid + "/delete", shouldNotHaveData);
        });
    });





    /********************************************************
     * Project related code
     ********************************************************/
    // show recent projects
    $("#projects").mouseenter(function () {
        var pid = $("h1").first().data("pid");
        $.ajax({
            "dataType": "json",
            "url": "other_recent",
            "data": {"pid": pid},
            "success": function (data) {
                var row, item;
                var items = $("#recent_proj .menu_item");
                for (var i = 0; i < data.length; i++) {
                    row = data[i];
                    item = items.eq(i);
                    item.text(row['name']);
                    item.data("pid", row['id']);
                }
                // clean up any deleted recents
                if (i < 5) {
                    for (; i < 5; i++) {
                        item = items.eq(i);
                        item.text("-----");
                        item.removeData("pid");
                    }
                }
            }
        });
    });

    // if one of the 'recent' menu items is clicked
    $("#recent_proj .menu_item").click(function () {
        var t = $(this);
        if (t.data("pid")) { // may be a placeholder 
            var pid = t.data("pid");
            window.location.assign(pid);
        }
    });

    // create a new project
    $("#new_proj").click(function () {
        wr.prompt("Project Name:", function (name) {
            if (!name || !name.trim()) {
                wr.alert("Project name appears to be empty.");
                return true; // causes prompt to stay on screen
            }
            name = name.trim();
            if (name.match(/^\d/)) {
                wr.alert("Project name cannot start with a number.");
                return true; // causes prompt to stay on screen
            }
            $.ajax({
                "type": "POST",
                "url": encodeURIComponent(name),
                "success": function (data) {
                    var pid = JSON.parse(data);
                    window.location.assign(pid);
                }
            });
        });
    });

    // show the project list to switch to and/or delete projects
    $("#open_proj").click(function () {
        $("#projects_disp").show();
        $("#hide_proj").show();
        var pd = $("#project_data");

        var goto_proj = function () {
            var tr = $(this);
            window.location.assign("../project/" + tr.data("pid"));
        };

        var del_proj = function (event) {
            event.stopPropagation(); // don't execute tr.click()
            var tr = $(this).closest("tr");
            // Make sure we have at least one project left
            if (pd.find(".proj").length > 1) {
                wr.confirm("Are you sure you wish to delete this project?", function () {
                    var pid = tr.data("pid");
                    $.post(pid + "/delete", shouldNotHaveData);
                    // redirect to most recent if current project deleted
                    if (pid === $("h1").first().data("pid")) {
                        window.location.assign("recent");
                    }
                });
            } else {
                wr.alert("You need to have at least one project.\n\n"
                        + "Cannot delete last remaining project.");
            }
        };

        var getProjects = function (order, direction) {
            $.ajax({
                "dataType": "json",
                "url": "../project",
                "data": {"order": order, "direction": direction},
                "success": function (data) {
                    pd.find(".proj").detach();
                    pd.find(".holder").detach();
                    for (var i = 0; i < data.length; i++) {
                        var proj = data[i];
                        var row = $("<tr pid='" + proj.id + "' class='proj'>");
                        row.append("<td class='pname'>" + proj.name + "</td>");
                        row.append("<td>" + proj.created + "</td>");
                        row.append("<td>" + proj.accessed + "</td>");
                        row.append("<td class='del_btn'>" +
                                "<div class='del'>&times;</div></td>");
                        row.click(goto_proj);
                        pd.append(row);
                    }
                    // always show at least 10 rows
                    if (data.length < 10) {
                        for (var j = data.length; j < 10; j++) {
                            pd.append("<tr class='holder'><td>&nbsp;</td><td>" +
                                    "</td><td></td><td></td></tr>");
                        }
                    }

                    pd.find(".del").click(del_proj);
                }
            });
        };

        // on initial load show projects ordered by created
        getProjects("accessed", "DESC");

        var getSortFun = function (order) {
            return function () {
                var t = $(this);
                var direction = "ASC";
                if (t.hasClass("ASC")) {
                    direction = "DESC";
                }
                $("#project_data .DESC").removeClass("DESC");
                $("#project_data .ASC").removeClass("ASC");
                t.addClass(direction);
                getProjects(order, direction);
            };
        };

        $("#proj_by_name").click(getSortFun("name"));
        $("#proj_by_created").click(getSortFun("created"));
        $("#proj_by_accessed").click(getSortFun("accessed"));
    });


    // hidie the project list
    $("#hide_proj").click(function () {
        $("#projects_disp").hide();
        $("#hide_proj").hide();
    });

    // rename a project
    $("h1").click(function () {
        var t = $(this);
        t.data("cur", t.text());
        inputHere(this, function (input) {
            var upd = input.val().trim();
            if (!upd.match(/^\D/)) {
                wr.alert("Project name cannot start with a number");
                return false;
            } else if (upd !== t.data("cur")) {
                $.post(t.data("pid") + "/rename", {
                    "name": upd
                }, shouldNotHaveData);
            }
            return true;
        });
    });
}());

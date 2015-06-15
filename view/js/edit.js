/* 
 Created on : Juyl 31, 2014, 7:10:01 PM
 Author     : mzijlstra
 */

/*
 * This file contains the code for the edit state, because it is so big I've put
 * effort into creating clearly delinated sections with block comment headers 
 */

var wr; // wr namespace is created inside controls.js

$(function () {
    "use strict";

    /********************************************************
     * Application State Setup Code (after flow chart loaded from DB)
     ********************************************************/
    // build local variable namespaces in wr.functions
    (function () {
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
        wr.curvars = wr.functions['main'];
    })();

    // Setup AJAX Error Handling
    $(document).ajaxError(function (e) {
        alert("Network Error -- please check your connection and try again.");
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
        var fid = $(".fun.active").attr("fid");
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
        var fid = $(".fun.active").attr("fid");
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
        result[0].exec = elem[0].exec;
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
        i = $($("<input type='text' />"));
        var old = t.text().trim();
        i.val(old);
        t.text("_"); // so that block doesn't show (weird)

        // dynamically resize field based on contents
        var resize = function () {
            var length = i.val().length * 7 + 7;
            if (length < 150) {
                length = 150;
            }
            i.css("width", length);
        };
        i.focus(resize);

        // onkeydown resize and also blur when enter is pressed
        i.keydown(function (event) {
            resize();
            if (event.which === 13) {
                this.blur();
            }
        });

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





    /********************************************************
     * Variable declaration related code
     ********************************************************/
    // store current var name on focus
    $(".variable .var").focus(function () {
        var t = $(this);
        t.attr("cur", t.val());
    });

    // no spaces in variable names, blur on enter
    $(".variable .var").keydown(function (event) {
        if (event.which === 32) {
            return false;
        } else if (event.which === 13) {
            $(event.target).blur();
        }
    });

    // check if we need to update var name on blur
    $(".variable .var, #declaration .var").blur(function () {
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
                        "Please change one to keep them unique.");
                this.focus();
                return false;
            } else if (wr.functions[t.val()]) {
                alert("Conflict with function name " + t.val() + "\n" +
                        "Please change your variable name to keep it unique");
                this.focus();
                return false;
            } else {
                var oldn = t.attr('cur');
                var newn = t.val();
                var elem = t.parent().get(0);

                // set value attribute to newn 
                // otherwise .html() doesn't take it on postVarUpd
                t.attr("value", t.val());

                // remove old name from our vars 
                if (oldn !== "" && wr.curvars[oldn] === elem) {
                    delete wr.curvars[oldn];
                }

                // add new name to our vars 
                wr.curvars[newn] = elem;
                wr.curvars[newn] = t.parent().get(0);

                // update instructions with old name to new name
                $('span.var:contains(' + oldn + ')').text(function (i, s) {
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
                    // also update the instruction signature on server
                    postInsUpd();
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

                // AJAX Post variables
                postVarUpd();
            }
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
        m.find(".menu_item").each(function (i, o) {
            if ($(o).text() === t.text()) {
                $(o).addClass("menu_hl");
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

                // change signature on server
                postInsUpd();
            }
            // post var removal to server
            postVarUpd();
        } else {
            alert("Cannot remove variable while in use.");
        }
    });

    // gray out variable deletes if var in use
    $(".variable").mouseenter(function () {
        var t = $(this);
        var name = t.children("input").val();
        var inuse = false;
        $(".statement .var").each(function (i, o) {
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
        // get the amount of variables declared, compatible with old brwsrs
        var size = 0;
        if (Object.keys) {
            size = Object.keys(wr.curvars).length;
        } else {
            for (var k in wr.curvars)
                size++;
        }

        // check if we should insert
        if ($('#workspace').hasClass("exec")) {
            // silently inore request to show menu
        } else if (size === 0) {
            alert("Please declare a variable first.");
            $('.variable .var').focus();
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
        var toLoad = '#' + t.attr('id').substr(4);
        wr.clicked.before(cloneBlock("#connection"))
                .before(cloneBlock(toLoad));

        postInsUpd();
    });

    // repopulate var select menu (asgn) on mouse enter
    $(".var_container").mouseenter(function (event) {
        if ($('#workspace').hasClass('exec')) {
            return false; // don't show if we're executing
        }

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
    $(".var_container .menu").click(function (event) {
        // check to see if the selected var has the right type
        var t = $(this);
        var gp = t.parent().parent();
        var name = $(event.target).text();
        var type = $(wr.curvars[name]).siblings(".type_container")
                .find(".type").text();
        
        if (gp.hasClass("input") && type !== "string" 
                || gp.hasClass("assignment") 
                && !wr.verifyType(gp.children(".exp")[0], type, "silent")) {
            gp.parent().addClass("name_error");
        } else {
            gp.parent().removeClass("name_error");
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
    $(".statement .del").click(function () {
        var p = $(this).parent();
        if (!p.hasClass("statement")) {
            p = p.closest(".statement");
        }
        var pelem = p.get(0);
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
        var p = t.parent().get(0);

        p.destroy = function () {
            return confirm("Are you sure you want to delete this "
                    + t.attr("class") + " statement and everything "
                    + "inside it?");
        };
    });





    /********************************************************
     * Expression declaration related code
     ********************************************************/
    // output expressions
    $(".output .exp").click(function () {
        if ($('#workspace').hasClass('exec')) {
            return false; // don't show if we're executing
        }
        var exp = this;
        inputHere(exp, function (t) {
            return wr.verifyType(t, "string");
        });
    });
    // assignment expressions
    $(".assignment .exp").click(function () {
        if ($('#workspace').hasClass('exec')) {
            return false; // don't show if we're executing
        }
        var name = $(this).siblings(".var_container").children(".var")
                .text().trim();
        if (name === "") {
            alert("Please select a variable first.");
            return false;
        }
        var type = type = $(wr.curvars[name]).prev().find(".type").text();
        inputHere(this, function (t) {
            return wr.verifyType(t, type);
        });
    });
    // if and while condition expressions
    $(".diamond").click(function (event) {
        if ($('#workspace').hasClass('exec')) {
            return false; // don't show if we're executing
        }
        event.stopPropagation(); // in case we clicked .exp inside diamond
        var exp = this;
        if ($(this).hasClass("diamond")) {
            exp = $(this).find(".exp")[0];
        }
        inputHere(exp, function (t) {
            return wr.verifyType(t, "boolean");
        });
    });
    // return expressions
    $(".stop").click(function () {
        if ($('#workspace').hasClass('exec')) {
            return false; // don't show if we're executing
        }
        var exp = $(this).find(".exp")[0];
        var type = $('#ins_' + wr.curfun).find('.start .type').text();
        inputHere(exp, function (t) {
            return wr.verifyType(t, type);
        });
    });





    /********************************************************
     * Function related code
     ********************************************************/
    // add a function
    $("#add_fun").click(function () {

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
                        "Please change the name to keep the functions unique.");
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
            "url": pid + "/" + n,
            "data": {"idata": idata.html(), "vdata": vdata.html()},
            "dataType": "json",
            "success": function (fid) {
                if ($.isNumeric(fid)) {
                    // add the function to the HTML
                    wr.functions[n] = {};

                    // append a new function name tab
                    var fname = cloneBlock("#fun-name");
                    fname.find(".name").text(n);
                    fname.attr("fid", fid);
                    $("#fun-names").append(fname);

                    // append a new instructions area
                    var ins = $("<div id='ins_" + n +
                            "' class='instructions'></div>");
                    ins.append(idata);
                    $("#instructions").append(ins);

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
        wr.curvars = wr.functions[n];
        wr.curfun = n;
    });

    // renaming a function
    $(".start").click(function () {
        if ($('#workspace').hasClass('exec')) {
            return false; // don't show if we're executing
        }

        var n = $(this).find(".name");
        n.attr("cur", n.text());
        inputHere(n.get(0), function (t) {
            var cur = n.attr("cur");
            if (cur === "main") {
                alert("Cannot rename function main");
                n.text("main");
                return false;
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
                wr.curfun = upd;

                // AJAX rename function
                var fid = $(".fun.active").attr("fid");
                $.post("../function/" + fid + "/rename", {
                    "name": upd
                });
            }
            return true;
        });
    });

    // function delete handler
    $(".rem").click(function () {
        var t = $(this);
        var n = t.parent().children(".name").text();
        if (n === "main") {
            alert("Cannot delete main, the program cannot start without it.");
            return false;
        } else if (confirm("Delete the function: " + n + "?")) {
            $("#vars_" + n).remove();
            $("#ins_" + n).remove();
            t.parent().remove();
            delete wr.functions[n];
            $("#fun-names .fun")[0].click();

            // AJAX delete function
            var fid = t.parent().attr("fid");
            $.post("../function/" + fid + "/delete");
            return true;
        }
    });





    /********************************************************
     * Project related code
     ********************************************************/
    $("#new_proj").click(function () {
        var name = prompt("Project Name:");
        $.ajax({
            "type": "POST",
            "url": encodeURIComponent(name),
            "success": function (data) {
                var pid = JSON.parse(data);
                window.location.assign(pid);
            }
        });
    });

    $("#open_proj").click(function () {
        window.location.assign("../project");
    });
});

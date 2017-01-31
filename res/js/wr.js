/* 
 Created on : Jun 21, 2015
 Author     : mzijlstra
 */

/*
 * This is the top level JS file for the application, it contains the 
 * wr global object, and the public function definitions
 */

var wr = {};

$(function () {
    "use strict";

    /*
     * Global variables in the wr namespace
     */
    wr.functions = {'main': {}};// the flowcharts the user has made
    wr.state;                   // set by code in states.js [edit,play,pause]

    // TODO move these two edit state related variables into EDIT state
    wr.curfun = 'main';         // the chart currently being edited
    wr.curvars = wr.functions.main; // the variables for that chart

    // QUESTION Put these into the EXEC state?
    wr.curfrm = -1;             // index of currently executing stack frame
    wr.stack = [];              // will hold call stack when executing (play)
    wr.playing;                 // will hold the timeout variable when playing
    wr.maxrec = 250;            // maximum recursion depth

    /*
     * Functions in the wr namespace, implemented in exec.js
     */
    wr.step;    // executes a single flowchart step
    wr.play;    // continuesly executes steps (until there are no more)
    wr.eval;    // used to evaluate expressions in a specific ~sandboxed context

    /*
     * Functions in the wr namespace, implemented below
     */
    wr.alert;
    wr.prompt;
    wr.confirm;
    wr.iolog;
    wr.verifyType;
    wr.ready;

    /**
     * Helper function used to show an alert (built in alerts can be disabled)
     * 
     * @param {string} text To be displayed in popup window
     * @param {function} click callback when OK button is pressed
     */
    wr.alert = function (text, click) {
        var a = $("#alert");
        var o = $("#overlay");
        a.find(".msg").text(text);
        var doClick = function (evt) {
            if (click) {
                click();

            }
            a.hide();
            if ($("#prompt").css("display") !== "block") {
                o.hide();
            }
            a.off("click", doClick);
            evt.stopPropagation();
        };
        a.on("click", doClick);
        o.show();
        a.show();
    };

    /**
     * Helper function used to show a prompt for input (built in prompt can be
     * disabled, and also has a cancel button, both of which are no good)
     * 
     * @param {string} text To be displayed in popup window
     * @param {function} ok callback when OK button is pressed, is given 
     * the value of the input element inside (the text the user entered)
     * @param {function} cancel callback for when Cancel button is pressed
     */
    wr.prompt = function (text, ok, cancel) {
        var p = $("#prompt");
        var o = $("#overlay");
        var i = p.find("input");
        var bK = $("#prompt_ok");
        var bC = $("#prompt_cancel");

        var hide = function (evt) {
            bK.off("click", doOk);
            bC.off("click", doCancel);
            i.val("");
            p.hide();
            o.hide();
            evt.stopPropagation();
        };

        var doOk = function (evt) {
            if (ok && ok(i.val())) {
                // don't hide if handler returns true
            } else {
                hide();
            }
            evt.stopPropagation();
        };

        var doCancel = function (evt) {
            if (cancel) {
                cancel();
            }
            hide();
            evt.stopPropagation();
        };

        bK.on("click", doOk);
        bC.on("click", doCancel);
        p.find(".msg").text(text);
        o.show();
        p.show();
        i.focus();
    };
    $("#prompt input").on("keydown", function (event) {
        if (event.which === 13) {
            $("#prompt button").click();
        }
    });

    /**
     * Helper function that shows a confirmation popup with OK and Cancel 
     * @param {string} text To be displayed in popup
     * @param {function} ok To be executed when OK is clicked
     * @param {function} cancel To be executed when Cancel is clicked
     */
    wr.confirm = function (text, ok, cancel) {
        var c = $("#confirm");
        var o = $("#overlay");
        var bK = $("#confirm_ok");
        var bC = $("#confirm_cancel");

        var hide = function (evt) {
            bK.off("click", doOk);
            bC.off("click", doCancel);
            c.hide();
            o.hide();
            evt.stopPropagation();
        };

        var doOk = function (evt) {
            if (ok) {
                ok();
            }
            hide();
            evt.stopPropagation();
        };

        var doCancel = function (evt) {
            if (cancel) {
                cancel();
            }
            hide();
            evt.stopPropagation();
        };

        bK.on("click", doOk);
        bC.on("click", doCancel);
        c.find(".msg").text(text);
        o.show();
        c.show();
    };

    /**
     * Helper that puts given text into the output box shown during execution
     * 
     * @param {type} text to be displayed in I/O window
     * @param {type} cname CSS class name to be used for the text
     */
    wr.iolog = function (text, cname) {
        var o = $("#out");
        var add = $("<span>");
        if (typeof text === "string") {
            text = text.replace("\n", "<br />");
        }
        add.html(text);
        if (cname) {
            add.addClass(cname);
        }
        o.append(add);
        o[0].scrollTop = o[0].scrollHeight; // always scroll to bottom
    };




    /**
     * Helper function that is used by both edit.js and exec.js.
     * Verifies that the extracted expression has the given data type.
     * Can also be passed as the blur argument to edit.js inputHere().
     *
     * @param {Element} elem The element that holds the expression
     * @param {string} type  The desired type that the exp should have
     * @param {boolean} [silent] If true only highlight, no alert()
     * @returns {boolean} true if matches desired type
     */
    wr.verifyType = function (elem, type, silent) {
        if (!type) {
            return true;
        }

        var e = $(elem);
        var exp = e.val() || e.text();
        var stmt = e.closest(".statement");

        // create an evaluation context with defaults for current variables
        var defaults = {
            "string": "",
            "number": 1,
            "boolean": true,
            "array": "[]", // TODO not actually an array, but string!
            "object": "{}" // TODO not actually an object, but string!
        };
        var ctx = {};
        var key, vtype;
        // add in functions that return default values based on their type
        for (key in wr.functions) {
            vtype = $('#ins_' + key).find('.start .type').text();
            ctx[key] = "function () { return " + defaults[vtype] + "}";
        }
        // add variables for the function that the elem is inside of
        var fun = $(elem).closest(".instructions").attr("id").substring(4);
        for (key in wr.functions[fun]) {
            vtype = $(wr.functions[fun][key]).prev().find(".type").text();
            ctx[key] = defaults[vtype];
        }

        // new object creations cause problems
        if (exp.match(/^\s*new\s+.*/)) {
            if (exp.match(/^\s*new\s+Array/)) {
                exp = "[]";
            } else {
                exp = "{}";
            }
        }
        // no nice way to determine the types of properties or calls
        if (exp.match(/.+(\.|\[|\().+/)) { // anything containing a dot,[, or (
            stmt.removeClass("type_error exp_error");
            return true;
        }

        // do the actual evaluation
        try {
            var data = wr.eval(exp, ctx);
        } catch (exception) {
            stmt.addClass("exp_error");
            if (!silent) {
                wr.alert("Error in expression, please check syntax.");
            }
            e.find("input").focus();
            return false;
        }

        // check the resulting type
        if (type === "any") {
            stmt.removeClass("type_error exp_error");
            return true;
        }
        var result = typeof data;
        var match = false;
        if (result === 'object') {
            if (type === 'array' && $.isArray(data)) {
                match = true;
            } else if (type === 'object') {
                match = true;
            }
        } else if (result === type) {
            match = true;
        }

        if (!match) {
            stmt.addClass("type_error");
            if (!silent) {
                wr.alert("Your expression has type: " + result +
                        " instead of \nthe expected type: " + type);
            }
            return false;
        }

        // clean up when things go correctly
        stmt.removeClass("type_error exp_error"); // in case it has it
        return true;
    };

    /**
     * Helper function that acts like a 'compile time' check.
     * It is used before executing, and before generating JS code
     * @returns {Boolean} True if everything is ready
     */
    wr.ready = function () {
        // check that everything is good to go ('compile' check)
        var stmts = $("#instructions .statement").get();
        var ready = true;
        for (var i = 0; i < stmts.length; i++) {
            if (!stmts[i].ready()) {
                ready = false;
            }
        }
        return ready;
    };
});
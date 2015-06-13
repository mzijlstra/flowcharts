/* 
 Created on : Jun 9, 2015
 Author     : mzijlstra
 */

/*
 * This is the top level JS file for the application, it contains the 
 * wr global object, and the code for the control buttons that move 
 * the application between the different states
 */


// wr namespace
var wr = {};

$(function () {
    "use strict";

    /*****************************************************
     * These are our global wr namespace vars and funcs
     *****************************************************/
    wr.functions = {'main': {}}; // the flowcharts the user has made
    wr.curfun = 'main';
    wr.curvars = wr.functions.main;
    wr.state; //gets set below by the control buttons [edit,play,pause]
    wr.playing; // will hold the timeout variable when playing
    wr.steps = []; // execution steps (statements, connections, & more)

    /**
     * The function used to take a flowchart execution step
     */
    wr.step = function () {
        var item = wr.steps.pop();

        // scroll executing item to the top of the page
        if (item.nodeType) { // as long as item is an actual DOM element
            var delay = parseFloat($("#delay").text()) * 1000;
            var pos = $(item).offset().top;
            var ins = $("#instructions");
            if (pos > 100) {
                ins.animate({
                    "scrollTop": ins.scrollTop() + (pos - 100)
                }, delay);
            } else if (pos < 70) {
                ins.animate({
                    "scrollTop": ins.scrollTop() + (pos - 70)
                }, delay);
            }
        }

        $(".executing").removeClass("executing");
        item.exec();
    };
    /**
     * This function will evaluate the given expression in the context of the 
     * provided object
     * @param {string} exp The expression we want evaluated
     * @param {object} [ctx] variables with wich code will be evaluated
     * @returns {undefined} The result of the evaluation
     */
    wr.eval = function (exp, ctx) {
        if (!ctx) {
            ctx = {};
        }
        var code = "(function () {\n";
        var key, val;
        for (key in ctx) {
            val = ctx[key];
            code += "var " + key + " = " + val + ";\n";
        }
        code += "return " + exp + ";\n";
        code += "\n})();";

        return $('#sandbox')[0].contentWindow.eval(code);
    };
    /**
     * Verifies that the extracted expression has the given data type.
     * 
     * This function can also be passed as the blur argument to inputHere.
     * Since this is used by different parts I had to put it into the wr obj.
     *
     * @param {Element} elem The element that holds the expression
     * @param {string} type  The desired type that the exp should have
     * @param {boolean} [silent] If true only highlight, no alert()
     * @returns {boolean} true if matches desired type
     */
    wr.verifyType = function (elem, type, silent) {
        var e = $(elem);
        var exp = e.val() || e.text();
        var stmt = e.closest(".statement");

        // create an evaluation context with defaults for current variables
        var defaults = {
            "string": "''",
            "int": "1",
            "float": "0.1",
            "boolean": "true",
            "array": "[]",
            "object": "{}"
        };
        var ctx = {};
        var key, vtype;
        for (key in wr.curvars) {
            vtype = $(wr.curvars[key]).prev().find(".type").text();
            ctx[key] = defaults[vtype];
        }

        // do the actual evaluation
        try {
            var data = wr.eval(exp, ctx);
        } catch (exception) {
            stmt.addClass("exp_error");
            if (!silent) {
                alert("Error in expression, please check syntax.");
            }
            e.find("input").focus();
            return false;
        }

        // check the resulting type
        var result = typeof (data);
        var match = false;
        if (result === 'number') {
            if (type === 'int' && data % 1 === 0) {
                match = true;
            } else if (type === 'float') {
                match = true;
            }
        } else if (result === 'object') {
            if (type === 'array' && data.length) {
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
                alert("Your expression has type: " + result + " instead of \n" +
                        "the expected type: " + type);
            }
            return false;
        }

        // clean up when things go correctly
        stmt.removeClass("type_error exp_error"); // in case it has it
        return true;
    };





    /*****************************************************
     * The 3 different states that the program can be in
     * The code below uses the state pattern for the states
     *****************************************************/
    var play_btn = $("#play_btn");
    var pause_btn = $("#pause_btn");
    var delay_disp = $('#delay_disp');
    var step_btn = $('#step_btn');
    var workspace = $("#workspace");

    // helper functions to switch between states
    var toPlayState = function () {
        pause_btn.css("display", "block");
        play_btn.css("display", "none");
        step_btn.css("display", "none");
        delay_disp.css("display", "block");
        wr.state = states.play;

        // if at beginning or end of executing, start again
        if (wr.steps.length === 0) {
            $($("#ins_main").children().get().reverse()).each(function () {
                wr.steps.push(this);
            });
        }

        $("#instructions").scrollTop(0);

        // start executing
        $(".executing").removeClass("executing");
        var recurse = function () {
            if (wr.steps.length === 0) {
                $('#play_pause').click();
                $("#step_btn").css("display", "none");
                $("#delay_disp").css("display", "block");
            } else if (wr.state.name === "play") {
                wr.step();
                wr.playing = setTimeout(recurse,
                        parseFloat($("#delay").text()) * 1000);
            }
        };
        recurse();
    };
    var toEditState = function () {
        pause_btn.css("display", "none");
        play_btn.css("display", "block");
        step_btn.css("display", "none");
        delay_disp.css("display", "block");
        workspace.removeClass("exec");
        workspace.addClass("edit");

        clearTimeout(wr.playing);
        wr.steps = [];
        wr.state = states.edit;
    };
    var toPauseState = function () {
        pause_btn.css("display", "none");
        play_btn.css("display", "block");
        step_btn.css("display", "block");
        delay_disp.css("display", "none");
        clearTimeout(wr.playing);
        wr.state = states.pause;
    };

    // the different states that application can be in
    var states = {
        "edit": {
            "name": "edit",
            "playpause": function () {
                // check that everything is good to go ('compile' check)
                var stmts = $("#instructions .statement").get();
                var ready = true;
                for (var i = 0; i < stmts.length; i++) {
                    if (!stmts[i].ready()) {
                        ready = false;
                    }
                }
                if (!ready) {
                    alert("Cannot start execution, there are errors in this "
                            +"project\n\nThe problems have been highligted, "
                            +"please check all functions");
                    return;
                }
                // if we're here any error highlights are old / not valid
                $('.type_error, .exp_error, .name_error')
                        .removeClass('type_error exp_error name_error');

                // do css changes to exit edit mode
                workspace.removeClass("edit");
                workspace.addClass("exec");

                // switch to the main function (always first in fun-names)
                $("#fun-names span.fun")[0].click();

                toPlayState();
            },
            "reset": function () {
                // does nothing in this state
            }
        },
        "play": {
            "name": "play",
            "playpause": toPauseState,
            "reset": toEditState
        },
        "pause": {
            "name": "pause",
            "playpause": toPlayState,
            "reset": toEditState
        }
    };

    // we start in the edit state
    wr.state = states.edit;

    // Hook up button clicks that move us between the states
    $("#play_pause").click(function () {
        wr.state.playpause();
    });
    $("#reset").click(function () {
        wr.state.reset();
    });
    $("#step_btn").click(wr.step);





    /*****************************************************
     * The 'compile' check for the different statements
     *****************************************************/
    $(".statement > .start").each(function () {
        $(this).parent()[0].ready = function () {
            return true; // start is always ready
        };
    });
    // stop is only ready if it returns an expression of the correct type
    $(".statement > .stop").each(function () {
        $(this).parent()[0].ready = function () {
            var t = $(this);
            var func = t.closest(".instructions").attr("id").substring(4);
            var type = $('#ins_' + func).find('.start .type').text();
            return wr.verifyType(t.find(".exp")[0], type, "silent");
        };
    });
    // inputs are ready if they have a variable name and it's of type string
    $(".statement > .input").each(function () {
        $(this).parent()[0].ready = function () {
            var t = $(this);
            var func = t.closest(".instructions").attr("id").substring(4);
            var name = t.find(".var").text().trim();
            if (name === "") {
                t.addClass("name_error");
                return false;
            }
            var type = $(wr.functions[func][name]).prev().find(".type").text();
            if (type !== "string") {
                t.addClass("type_error");
                return false;
            }
            return true;
        };
    });
    // outputs are ready if their expression evaluates to a string
    $(".statement > .output").each(function () {
        $(this).parent()[0].ready = function () {
            return wr.verifyType($(this).find(".exp")[0], "string", "silent");
        };
    });
    // assignments are ready if their variable and expression have same type
    $(".statement > .assignment").each(function () {
        $(this).parent()[0].ready = function () {
            var t = $(this);
            // function that the statement is in
            var func = t.closest(".instructions").attr("id").substring(4);
            // name and type of the variable
            var name = t.find(".var").text().trim();
            if (name === "") {
                t.addClass("name_error");
                return false;
            }
            var type = $(wr.functions[func][name]).prev().find(".type").text();
            var exp = t.find(".exp");
            if (exp.text().trim() === "") {
                t.addClass("exp_error");
                return false;
            }
            return wr.verifyType(exp[0], type, "silent");
        };
    });
    // if statements and while statements should have boolean expresssions
    $(".statement > .if, .statement > .while").each(function () {
        $(this).parent()[0].ready = function () {
            return wr.verifyType($(this).find(".exp")[0], "boolean", "silent");
        };
    });

});
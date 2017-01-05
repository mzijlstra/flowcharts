/* 
 Created on : Jun 21, 2015
 Author     : mzijlstra
 */

var wr; // global object declared in wr.js

$(function () {
    "use strict";

    /*****************************************************
     * The 3 different states that the program can be in
     * The code below uses the state pattern for the states
     *****************************************************/
    var play_btn = $("#play_btn");
    var pause_btn = $("#pause_btn");
    var delay_disp = $('#delay_disp');
    var step_btn = $('#step_btn');
    var workspace = $("#workspace");
    var variables = $("#variables");
    var stack = $("#stack");
    var output = $("#output_disp");

    // helper functions to switch between states
    var toPlayState = function () {
        pause_btn.css("display", "block");
        play_btn.css("display", "none");
        step_btn.css("display", "none");
        delay_disp.css("display", "block");
        wr.state = states.play;

        // if we're not executing, start executing main
        if (wr.curfrm === -1) {
            $("#out").empty();
            $(".frame").detach();
            
            // close all previously opened GfxWindow popups 
            wr.eval("$__closePopups()");
            
            // start the execution
            wr.doCall("main");
        }
        wr.play();
    };
    var toEditState = function () {
        pause_btn.css("display", "none");
        play_btn.css("display", "block");
        step_btn.css("display", "none");
        delay_disp.css("display", "block");
        workspace.removeClass("exec");
        workspace.addClass("edit");
        stack.hide();
        variables.show();
        $(".fun").show();
        $("#add_fun").show();
        $("#fun-names").css({"height": "", "padding": "", "border-bottom": ""});

        clearTimeout(wr.playing);
        wr.state = states.edit;

        // clear the stack, and the HTML frames (both data and instruction)
        wr.stack = [];
        wr.curfrm = -1;
        $(".frame").detach();
        variables.show();
        stack.hide();
        output.hide();

        // show main function
        $(".fun").first().click();
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
                if (!wr.ready()) {
                    wr.alert("Cannot start execution,\n" +
                            " there are errors in this project\n\n" +
                            "The problems have been highligted, \n" +
                            " please check all functions");
                    return;
                }
                // if we're here any error highlights are old / not valid
                $('.type_error, .exp_error, .name_error')
                        .removeClass('type_error exp_error name_error');

                // do css changes to exit edit mode
                workspace.removeClass("edit");
                workspace.addClass("exec");
                variables.hide();
                stack.show();
                $("#out").empty();
                output.show();
                $(".fun").hide();
                $("#add_fun").hide();
                $("#fun-names").css({"height": "0px", "padding": "0px",
                    "border-bottom": "none"});

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
            "playpause": function () {
                toPlayState();
                // make sure the correct frame is active 
                $(".active").removeClass("active");
                $("#instructions").children().last().addClass("active");
                $("#stack").children().last().addClass("active");
            },
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
    // and the control to change the delay between steps
    $("#delay_disp").click(function () {
        var t = $(this);
        var delay = $("#delay");
        var input = $("<input>");
        input.val(delay.text());
        input.keyup(function (event) {
            if (event.which === 13) {
                this.blur();
                return true;
            }
            if (input.val().length > 3) {
                input.val(input.val().substr(0, 3));
            }
        });
        input.blur(function () {
            var val = parseFloat(input.val());
            if (val || val === 0.0) {
                delay.text(input.val());
            }
            input.detach();
        });
        t.append(input);
        input.focus();
    });





    /*****************************************************
     * The 'compile' check for the different statements
     * This is used before switching to the play state
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
            // type will be empty for arary and object index
            if (type && type !== "string") {
                t.addClass("type_error");
                return false;
            }
            return true;
        };
    });
    // outputs are always ready (no longer require expression to be string)
    $(".statement > .output").each(function () {
        $(this).parent()[0].ready = function () {
            return true;
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
    // call statements are always ready?
    $(".statement > .call").each(function () {
        $(this).parent()[0].ready = function () {
            return true;
        };
    });
    // if statements and while statements should have boolean expresssions
    $(".statement > .if, .statement > .while").each(function () {
        $(this).parent()[0].ready = function () {
            return wr.verifyType($(this).find(".exp")[0], "boolean", "silent");
        };
    });
});
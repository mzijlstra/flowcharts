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
     * The function used to evaluate code in a sandbox
     * @param {string} code The code we want evaluated
     * @param {string} [id] id of the sandbox to use (defualt: sandbox)
     * @returns {undefined} The result of the evaluation
     */
    wr.eval = function (code, id) {
        if (!id) {
            id = "sandbox";
        }
        return $('#' + id)[0].contentWindow.eval(code);
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
        // TODO check that we are ready to exec (no errors in flowchart!)

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

    // Hook up button clicks
    $("#play_pause").click(function () {
        wr.state.playpause();
    });
    $("#reset").click(function () {
        wr.state.reset();
    });
    $("#step_btn").click(wr.step);
});
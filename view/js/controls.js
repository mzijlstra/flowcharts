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

    wr.functions = {'main': {}};
    wr.curfun = 'main';
    wr.curvars = wr.functions.main;
    wr.state; //gets set below by the control button initialization code
    wr.playing; // will hold the timeout variable when playing
    wr.steps = []; // execution steps (statements, connections, & more)
    wr.step = function () {
        var item = wr.steps.pop();
        $(".executing").removeClass("executing");
        item.exec();
    };

    /*
     * The 3 different states that the program can be in
     * The code below uses the state pattern for the states
     */
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

        // start executing
        $(".executing").removeClass("executing");
        var recurse = function () {
            if (wr.steps.length === 0) {
                $('#play_pause').click();
            } else if (wr.state.name === "play") {
                wr.step();
                var delay = parseFloat($("#delay").text()) * 1000;
                wr.playing = setTimeout(recurse, delay);
            }
        };
        var delay = parseFloat($("#delay").text()) * 1000;
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

    $("#play_pause").click(function () {
        wr.state.playpause();
    });
    $("#reset").click(function () {
        wr.state.reset();
    });
    $("#step_btn").click(wr.step);
});
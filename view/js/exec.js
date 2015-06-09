/* 
 Created on : Jun 9, 2015
 Author     : mzijlstra
 */

/*
 * Execution Code for the different elements
 */

var wr; // wr namespace is created inside controls.js

$(function () {
    "use strict";

    $(".connection, .statement").each(function () {
        this.exec = function () {
            $(this).addClass("executing");
        };
    });

    $(".statement > .input").each(function () {
        $(this).parent()[0].exec = function () {
            var t = $(this);
            t.addClass("executing");
            var input = window.prompt("Please enter input:");

            // second step, assign the input 
            wr.steps.push({"exec": function () {
                    t.find(".var").addClass("executing");
                    // TODO do things with the input
                    //wr.curvars[t.find(".var").text()] = input;
                }});
        };
    });

    $(".statement > .output").each(function () {
        $(this).parent()[0].exec = function () {
            var t = $(this);
            t.addClass("executing");

            // TODO eval expression
            // TODO show result value in exp span?
            var output = $(this).find(".exp").text();

            // second step, show result
            wr.steps.push({"exec": function () {
                    t.find(".io").addClass("executing");
                    window.alert(output);
                }});
        };
    });

    $(".statement > .assignment").each(function () {
        $(this).parent()[0].exec = function () {
            var t = $(this);
            t.addClass("executing");

            // TODO eval expression
            // TODO show result value in exp span?
            var result = $(this).find(".exp").text();

            // second step, assign to variable
            wr.steps.push({"exec": function () {
                    t.find(".var").addClass("executing");
                    // TODO do things with the result
                    //wr.curvars[t.find(".var").text()] = result;
                }});
        };
    });
});
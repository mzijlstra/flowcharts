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

    $(".statement > .if").each(function () {
        $(this).parent()[0].exec = function () {
            var t = $(this);
            t.addClass("executing");

            // TODO eval expression
            var exp = t.find(".exp").first().text();
            exp = true;

            var elems;
            var next = wr.steps.pop(); // connect after if (used in both exits)
            if (exp) {
                // get all the elements on the right branch
                elems = $(document).find(
                        ".statement.executing > .if > table > tbody > tr > .right"
                        ).children().get().reverse();
                
                // TODO FIXME: entrance and exit are one and same when empty

                // setup entrance to the branch
                var absolute_right = elems.pop();
                var first = elems.pop(); // pops first connection in right
                // replace with single entry item 
                elems.push({"exec": function () {
                        t.find(".top_connect").first().addClass("executing");
                        $(first).addClass("executing");
                    }});

                // setup exit from the branch
                var bot_right = elems.shift(); // bot_right_connect
                var last = elems.shift(); // last connection on right side
                // replace with single exit item 
                elems.unshift({"exec": function () {
                        $([next, bot_right, last, absolute_right])
                                .addClass("executing");
                        // find bot_left_connect
                        t.find(".left").first().children().last()
                                .addClass("executing");
                    }});

                $(elems).each(function () {
                    wr.steps.push(this);
                });
            } else {
                elems = t.find(".left").first().children().get().reverse();

                // TODO FIXME: exit of an if inside an if is not clean

                // clean up entry into left branch
                elems.pop(); // remves top_connect
                var absolute_left = elems.pop();

                elems.shift(); // removes bot_left_connect
                var last = elems.shift(); // last connection on left side
                elems.unshift({"exec": function () {
                        $([last, absolute_left, next]).addClass("executing");
                    }});

                $(elems).each(function () {
                    wr.steps.push(this);
                });
            }
        };
    });
    
    $(".statement > .while").each(function () {
        $(this).parent()[0].exec = function () {
            var t = $(this);
            t.addClass("executing");
            
            // TODO eval expression
            var exp = $(t.find(".exp")[0]).text();
            exp = false;

            if (exp) {
                // TODO implement the loop body code
            } else {
                var next = wr.steps.pop();
                wr.steps.push({"exec": function() {
                        t.find(".false_line").addClass("executing");
                        $(next).addClass("executing");
                }});
            }
        };
    });
});
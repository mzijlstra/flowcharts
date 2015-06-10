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
            exp = false;

            var elems;
            if (exp) {
                // get all the elements on the right branch
                elems = $(document).find(
                        ".executing > .if > table > tbody > tr > .right"
                        ).children().get().reverse();

                var absolute_right = elems.pop(); // needed for exit
                var first = elems.pop(); // pops first connection in right
                var bot_right = elems.shift(); // bot_right_connect
                var last = elems.shift(); // may be undefined

                var enter_right = function () {
                    $(first).addClass("executing");
                    t.find(".top_connect").first().addClass("executing");
                };
                var exit_right = function () {
                    $([bot_right, absolute_right])
                            .addClass("executing");
                    $(last).addClass("executing"); // does nothing if undef
                    // find bot_left_connect
                    t.find(".left").first().children().last()
                            .addClass("executing");
                };

                if (elems.length === 0) {
                    // if no statements in branch, do both enter and exit in one
                    wr.steps.push({"exec": function () {
                            enter_right();
                            exit_right();
                        }});
                } else {
                    // setup entrance to the branch
                    // replace with single entry item 
                    elems.push({"exec": function () {
                            enter_right();
                        }});

                    // setup exit from the branch
                    // replace with single exit item 
                    elems.unshift({"exec": function () {
                            exit_right();
                        }});

                    $(elems).each(function () {
                        wr.steps.push(this);
                    });
                }
            } else {
                elems = t.find(".left").first().children().get().reverse();

                // clean up entry into left branch
                elems.pop(); // remves top_connect
                var absolute_left = elems.pop();

                elems.shift(); // removes bot_left_connect
                var last = elems.shift(); // last connection on left side
                elems.unshift({"exec": function () {
                        $([last, absolute_left]).addClass("executing");
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
                // always come back to diamond after entering loop
                wr.steps.push(this);
                
                var elems = t.find(".loop_body").first().children().get()
                        .reverse();
                var first = elems.pop();
                var last = elems.shift(); // may be undefined
                var enter = function () {
                    t.find(".true_connector").first().addClass("executing");
                    $(first).addClass("executing");
                };
                var exit = function () {
                    t.find(".return_line").first().addClass("executing");
                    $(last).addClass("executing"); // does nothing if undef
                };
                if (elems.length === 0) {
                    wr.steps.push({"exec": function () {
                            enter();
                            exit();
                        }});
                } else {
                    elems.push({"exec": function () {
                            enter();
                        }});
                    elems.unshift({"exec": function () {
                            exit();
                        }});
                    $(elems).each(function () {
                        wr.steps.push(this);
                    });
                }
            } else {
                var next = wr.steps.pop();
                wr.steps.push({"exec": function () {
                        t.find(".false_line").addClass("executing");
                        $(next).addClass("executing");
                    }});
            }
        };
    });
});
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
    wr.curfrm = -1; // current stack frame
    wr.stack = []; // will hold call stack 
    wr.state; //gets set below by the control buttons [edit,play,pause]
    wr.playing; // will hold the timeout variable when playing

    /**
     * The function used to take a flowchart execution step
     */
    wr.step = function () {
        var frame = wr.stack[wr.curfrm];
        var item = frame.steps.pop();

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
            // TODO also scroll left-right
        }

        // remove executing highlight in current function
        frame.ins.find(".executing").removeClass("executing");
        item.exec();
    };
    /**
     * The function used to 'play', makes recursive call to itself with timeout
     */
    wr.play = function () {
        if (wr.curfrm < 0 || wr.stack[wr.curfrm].steps.length === 0) {
            // TODO perhaps create some kind of 'completed' state?
            // currently when this is true we cannot click play again
            $('#play_pause').click();
            $("#step_btn").css("display", "none");
            $("#delay_disp").css("display", "block");
        } else {
            wr.step();
            wr.playing = setTimeout(wr.play,
                    parseFloat($("#delay").text()) * 1000);
        }
    };

    /**
     * This function will evaluate the given expression in the context of the 
     * provided object
     * @param {string} exp The expression we want evaluated
     * @param {object} [ctx] variables with wich code will be evaluated
     * @returns {data} The result of the evaluation
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
        code += "})();";

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
            "number": "1",
            "boolean": "true",
            "array": "[]",
            "object": "{}"
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
        if (result === 'object') {
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
    /**
     * Does a call to a flowchart function. Execution is started with a 
     * doCall('main'), after which each 'function call' inside the chart
     * in reality becomes a doCall() of that function
     * @param {type} fname
     * @param {type} args
     */
    wr.doCall = function (fname, args) {
        wr.curfrm += 1;

        // find where we have to return to
        var ret2 = wr.stack[wr.curfrm - 1].ins.find(".executing .exp").first();
        // if we can't find it we aren't the fist call for the expression
        // return so that we can be evaluated later (keeps sequence correct)
        if (!ret2) {
            wr.curfrm -= 1;
            return;
        }

        // clear active from previous items
        $(".active").removeClass("active");

        // create the context for this call
        var ctx = {};
        ctx['$w'] = 'window';
        // add the flowchart functions
        for (key in wr.functions) {
            ctx[key] = 'function () { $w.top.wr.doCall("' + key
                    + '", arguments) }';
        }
        // add the variables for this function
        for (var key in wr.functions[fname]) {
            ctx[key] = 'undefined';
        }
        // set args values
        if (args) {
            $("#vars_" + fname + " .parameter").each(function (i, e) {
                var t = $(e);
                var name = t.children("input").val();
                if (!t.hasClass("bottom") && name !== "") {
                    var val = args[i];
                    if (typeof (val) === "string") {
                        val = '"' + val + '"';
                    }
                    ctx[name] = val;
                }
            });
        }

        // create a copy of the instructions, and make them executable
        var ins = $("#ins_" + fname).clone()
                .attr("id", "frame" + wr.curfrm)
                .addClass("instructions frame");
        makeExecutable(ins);

        // setup the steps for this function call;
        var steps = [];
        $(ins.children().get().reverse()).each(function () {
            steps.push(this);
        });

        // create a HTML stack frame 
        var fdata = $("<div class='frame' id='frame" + wr.curfrm + "'>");
        var label = "<div class='label'>" + fname + "(";
        if (args) {
            for (var i = 0; i < args.length; i++) {
                label += args[i] + ", ";
            }
            label = label.substring(0, label.length - 2);
        }
        label += ")</div>";
        fdata.append(label);
        var v; // add fields for all the variables
        for (key in wr.functions[fname]) {
            v = $("<div class='data'></div>");
            v.append("<span class='vname'>" + key + " : </span>");
            v.append("<span class='vdata' " +
                    "id='f" + wr.curfrm + "_" + key + "'>");
            fdata.append(v);
        }

        wr.stack.push({
            'name': fname,
            'ret2': ret2,
            'ctx': ctx,
            'ins': ins,
            'data': fdata,
            'steps': steps
        });

        // then view these instructions
        fdata.addClass("active");
        $("#stack").append(fdata);
        ins.addClass("active");
        ins.appendTo("#instructions");
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
    var variables = $("#variables");
    var stack = $("#stack");

    // helper functions to switch between states
    var toPlayState = function () {
        pause_btn.css("display", "block");
        play_btn.css("display", "none");
        step_btn.css("display", "none");
        delay_disp.css("display", "block");
        wr.state = states.play;

        // if we're not executing, start executing main
        if (wr.curfrm === -1) {
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
                            + "project\n\nThe problems have been highligted, "
                            + "please check all functions");
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

    /**
     * Sets the 'exec' functions for the different statements 
     * @param {Element} ins instructions element containing statemetns
     */
    var makeExecutable = function (ins) {
        ins.find(".connection").each(function () {
            this.exec = function () {
                $(this).addClass("executing");
            };
        });

        ins.find(".statement > .start").each(function () {
            $(this).parent()[0].exec = function () {
                // TODO have this step visually set the values of the parameters
                $(this).addClass("executing");
            };
        });

        ins.find(".statement > .input").each(function () {
            $(this).parent()[0].exec = function () {
                var t = $(this);
                t.addClass("executing");

                var io = t.find(".io");
                var input = window.prompt("Please enter input:");
                input = '"' + input + '"'; // input is always a string
                io.text(input);
                io.addClass("eval");

                var asgn = t.find(".asgn");
                setTimeout(function () {
                    asgn.addClass("eval");
                }, parseFloat($("#delay").text()) * 500);

                // second step, assign the input 
                var frame = wr.stack[wr.curfrm];
                frame['steps'].push({"exec": function () {
                        var nelem = t.find(".var");
                        nelem.addClass("executing");
                        var name = nelem.text();

                        // place value in the needed locations
                        frame.ctx[name] = input;
                        $("#f" + wr.curfrm + "_" + name).text(input)
                                .parent().addClass("executing");

                        io.text("INPUT");
                        io.removeClass("eval");

                        setTimeout(function () {
                            asgn.removeClass("eval");
                        }, parseFloat($("#delay").text()) * 500);
                    }});
            };
        });

        ins.find(".statement > .output").each(function () {
            $(this).parent()[0].exec = function () {
                var t = $(this);
                t.addClass("executing");
                var frame = wr.stack[wr.curfrm];

                // eval expression and show in exp span
                var exp = t.find(".exp");
                exp.attr("exp", exp.text());
                var result = wr.eval(exp.text(), frame.ctx);

                if (wr.stack[wr.curfrm] === frame) {
                    exp.text('"' + result + '"');
                    exp.addClass("eval");

                    var asgn = t.find(".asgn");
                    setTimeout(function () {
                        asgn.addClass("eval");
                    }, parseFloat($("#delay").text()) * 500);
                }

                // second step, show result
                frame.steps.push({"exec": function () {
                        t.find(".io").addClass("executing");
                        var result = exp.text();
                        exp.text(exp.attr("exp"));
                        exp.removeClass("eval");
                        window.alert(result);

                        setTimeout(function () {
                            asgn.removeClass("eval");
                        }, parseFloat($("#delay").text()) * 500);
                    }});
            };
        });

        ins.find(".statement > .assignment").each(function () {
            $(this).parent()[0].exec = function () {
                var t = $(this);
                t.addClass("executing");
                var frame = wr.stack[wr.curfrm];
                var findex = wr.curfrm; // curfrm may change on exp eval

                // eval expression and show in exp span
                var exp = t.find(".exp");
                exp.attr("exp", exp.text());

                if (wr.stack[wr.curfrm] === frame) {
                    var result = wr.eval(exp.text(), frame.ctx);
                    if (typeof (result) === "string") {
                        result = '"' + result + '"';
                    }
                    exp.text(result);
                    exp.addClass("eval");

                    var asgn = t.find(".asgn");
                    setTimeout(function () {
                        asgn.addClass("eval");
                    }, parseFloat($("#delay").text()) * 500);
                }

                // second step, assign to variable
                frame.steps.push({"exec": function () {
                        var nelem = t.find(".var");
                        nelem.addClass("executing");
                        var name = nelem.text();
                        var result = exp.text();
                        exp.text(exp.attr("exp"));
                        exp.removeClass("eval");

                        // place value in the needed locations
                        frame.ctx[name] = result;
                        $("#f" + findex + "_" + name).text(result)
                                .parent().addClass("executing");

                        setTimeout(function () {
                            asgn.removeClass("eval");
                        }, parseFloat($("#delay").text()) * 500);
                    }});
            };
        });

        ins.find(".statement > .if").each(function () {
            $(this).parent()[0].exec = function () {
                var t = $(this);
                t.addClass("executing");
                var frame = wr.stack[wr.curfrm];

                // eval expression
                var exp = t.find(".exp").first();
                exp.attr("exp", exp.text());
                var result = wr.eval(exp.text(), frame.ctx);
                exp.text(result);
                exp.addClass("eval");

                var resetExp = function () {
                    exp.text(exp.attr("exp"));
                    exp.removeClass("eval");
                };

                // TODO this will not work with function calls
                // true or false cannot be evaluated until after call comes back

                var elems;
                if (result) {
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
                        resetExp();
                    };

                    if (elems.length === 0) {
                        // if no statements in branch, do enter and exit in one
                        frame.steps.push({"exec": function () {
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
                            frame.steps.push(this);
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
                            resetExp();
                        }});

                    $(elems).each(function () {
                        frame.steps.push(this);
                    });
                }
            };
        });

        ins.find(".statement > .while").each(function () {
            $(this).parent()[0].exec = function () {
                var t = $(this);
                t.addClass("executing");
                var frame = wr.stack[wr.curfrm];

                // eval expression
                var exp = t.find(".exp").first();
                exp.attr("exp", exp.text());
                var result = wr.eval(exp.text(), frame.ctx);
                exp.text(result);
                exp.addClass("eval");

                var resetExp = function () {
                    exp.text(exp.attr("exp"));
                    exp.removeClass("eval");
                };

                // TODO this will not work with function calls
                // true or false cannot be evaluated until after call comes back

                if (result) {
                    // always come back to diamond after entering loop
                    frame.steps.push(this);

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
                        resetExp();
                    };
                    if (elems.length === 0) {
                        frame.steps.push({"exec": function () {
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
                            frame.steps.push(this);
                        });
                    }
                } else {
                    var next = frame.steps.pop();
                    frame.steps.push({"exec": function () {
                            t.find(".false_line").addClass("executing");
                            $(next).addClass("executing");
                            resetExp();
                        }});
                }
            };
        });

        ins.find(".statement > .stop").each(function () {
            $(this).parent()[0].exec = function () {
                var t = $(this);
                t.addClass("executing");
                var frame = wr.stack[wr.curfrm];

                // eval expression and show in exp span
                var exp = t.find(".exp");
                exp.attr("exp", exp.text());
                var result = wr.eval(exp.text(), frame.ctx);
                if (typeof (result) === "string") {
                    result = '"' + result + '"';
                }
                exp.text(result);
                exp.addClass("eval");


                wr.curfrm -= 1;
                frame.ins.detach();
                frame.data.detach();
                wr.stack.pop();
                if (wr.curfrm !== -1) {
                    // in reverse order, show that we're back in the previous
                    // function, then put our result in place of the call
                    // and then re-evaluate the expression
                    prev.steps.push({
                        "exec": function () {
                            // TODO eval the expression and if there are no 
                            // calls show the value -- this will also allow
                            // the next step to pick it up                            
                        }
                    });
                    prev.steps.push({
                        "exec": function () {
                            var name = frame.name;
                            var elem = frame.ret2;  
                            var exp = elem.text();

                            // FIXME there are some edge cases that could cause
                            // problems: e.g. sting arguments containing )
                            var re = new Regex(name + "([^)]*)");
                            elem.text(exp.replace(re, result));
                        }
                    });
                    prev.steps.push({
                        "exec": function () {
                            // show the previous call 
                            var prev = wr.stack[wr.curfrm];
                            prev.ins.addClass("active");
                            prev.data.addClass("active");
                        }
                    });


                } else {
                    frame.steps.push({
                        "exec": function () {
                            alert("Execution completed");
                        }
                    });
                }

                // TODO clean up stack frame and return value to previous frame
                // return can be done by adding a step to the frame below it 
                // which does a search and replace on the currently execting
                // expression to put the return value in place of the call

                // 1) wait to show return highlighted
                // 2) destroy this frame and return to previous frame
                // 3) have a step on revious frame that puts return value in exp
            };
        });
    };
});
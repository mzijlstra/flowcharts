/* 
 Created on : Jun 9, 2015
 Author     : mzijlstra
 */

var wr; // wr namespace declared in wr.js

$(function () {
    "use strict";

    /**
     * Helper that puts given text into the output box shown during execution
     * 
     * @param {type} text to be displayed in I/O window
     * @param {type} cname CSS class name to be used for the text
     */
    // Should I put this onto the global wr object? I only need it here
    var iolog = function (text, cname) {
        var add = $("<span>");
        if (typeof text === "string") {
            text = text.replace("\n", "<br />");
        }
        add.html(text);
        if (cname) {
            add.addClass(cname);
        }
        var o = $("#out");
        o.append(add);
        o[0].scrollTop = o[0].scrollHeight; // always scroll to bottom
    };

    var stringify = function (val) {
        if (typeof val === "object" && !$.isArray(val) &&
                typeof val.toString === "function") {
            return val.toString();
        } else {
            return JSON.stringify(val);
        }
    };

    /**
     * The function used to take a flowchart execution step
     */
    wr.step = function () {
        var frame = wr.stack[wr.curfrm];
        var item = frame.steps.pop();

        /**
         * Helper function to scroll left and right. Wrote this because
         * jQuery.animate() seems to have a delay for scrollLeft
         * @param {Element} elem the 'window' element that has the scollbar
         * @param {int} dest where we want to scroll to
         * @param {int} duration in millis how long we want to take
         */
        var horizScroll = function (elem, dest, duration) {
            var e = $(elem);
            var cur = e.scrollLeft();
            var ftime = 17; // 25 gives 40 fps
            var frames = duration / ftime;
            var amount = dest - cur;
            var perframe = amount / frames;
            var step = 0;
            var doAnimFrame = function () {
                elem.scrollLeft += perframe;
                step += 1;
                if (step < frames) {
                    setTimeout(doAnimFrame, ftime);
                }
            };
            doAnimFrame();
        };

        // scroll executing item to keep it in view
        if (item.nodeType) { // as long as item is an actual DOM element
            var dur = parseFloat($("#delay").text()) * 1000;
            var i = $(item);
            var posTop = i.offset().top;
            var posLeft = i.offset().left;
            var ins = $("#instructions");
            if (posTop > 100) {
                ins.animate({
                    "scrollTop": ins.scrollTop() + (posTop - 100)
                }, dur);
            } else if (posTop < 70) {
                ins.animate({
                    "scrollTop": ins.scrollTop() + (posTop - 70)
                }, dur);
            }
            if (posLeft > 400) {
                horizScroll(ins[0], ins.scrollLeft() + (posLeft - 400), dur);
            } else if (posLeft < 300) {
                horizScroll(ins[0], ins.scrollLeft() + (posLeft - 300), dur);
            }
        }

        // remove executing highlight in current function
        frame.ins.find(".executing").removeClass("executing");
        frame.data.find(".executing").removeClass("executing");
        try {
            var res = !item.exec();
            return res;
        } catch (exception) {
            $(".executing").addClass("exp_error");
            iolog(exception, "err");
            return false;
        }
    };

    /**
     * The function used to 'play' (continuesly step) 
     * makes recursive call to itself with timeout
     */
    wr.play = function () {
        if (wr.curfrm < 0 || wr.stack[wr.curfrm].steps.length === 0) {
            $('#play_pause').click();
            $("#step_btn").css("display", "none");
            $("#delay_disp").css("display", "block");
        } else {
            if (wr.step()) {
                wr.playing = setTimeout(wr.play,
                        parseFloat($("#delay").text()) * 1000);
            }
        }
    };

    /**
     * This function will evaluate the given expression in the context of the 
     * provided object
     * @param {string} exp The expression we want evaluated
     * @param {object} [ctx] variables with wich code will be evaluated
     * @param {object} [sys] system items: the window obj and other funcs
     * @returns {data} The result of the evaluation
     */
    wr.eval = function (exp, ctx, sys) {
        if (!ctx) {
            ctx = {};
        }
        if (!sys) {
            sys = {};
        }
        var code = "$w = window;\n(function () {\n";
        var key, val;

        // place system vars directly into code without escape
        for (key in sys) {
            val = sys[key];
            code += "var " + key + " = " + val + ";\n";
        }

        // create variables for the context vars 
        for (key in ctx) {
            val = ctx[key];
            // for objects we need the actual reference 
            if (wr.state.name !== "edit" && typeof val === "object") {
                code += "var " + key + " = $w.top.wr.stack[" + wr.curfrm +
                        "].ctx." + key + "\n";
            } else {
                code += "var " + key + " = " + stringify(val) + ";\n";
            }
        }

        // execute the expression 
        if (exp.match(/^await /)) {
            code += "var $r = " + exp.substring(6, exp.length) + ";\n";
        } else {
            code += "var $r = " + exp + ";\n";
        }

        // update the values in the context (apply side effects)
        if (wr.state.name !== 'edit') {
            for (key in ctx) {
                code += "$w.top.wr.stack[" + wr.curfrm + "].ctx." +
                        key + " = " + key + ";\n";
            }
        }

        code += "return $r;\n";
        code += "})();";

        var result = $('#sandbox')[0].contentWindow.eval(code);

        // show side effects / accidental updates as well
        if (wr.state.name !== 'edit') {
            for (key in ctx) {
                val = ctx[key];
                if (typeof val === "object" && !$.isArray(val) &&
                        typeof val.toString === "function") {
                    val = val.toString();
                } else {
                    val = stringify(val);
                }
                $("#f" + wr.curfrm + "_" + key).text(val);
            }
        }

        return result;
    };

    /**
     * Helper that sets the 'exec' function for the different statements 
     * @param {Element} ins instructions element containing the statemetns
     */
    var makeExecutable = function (ins) {
        ins.find(".connection").each(function () {
            this.exec = function () {
                $(this).addClass("executing");
            };
        });

        ins.find(".statement > .start").each(function () {
            $(this).parent()[0].exec = function () {
                $(this).addClass("executing");
                $(this).find(".params").addClass("executing");
                var frame = wr.stack[wr.curfrm];
                $("#vars_" + frame.name + " .parameter").each(function () {
                    var t = $(this);
                    var name = t.children("input").val();
                    if (!t.hasClass("bottom") && name !== "") {
                        var val = frame.ctx[name];
                        var elem = $("#f" + wr.curfrm + "_" + name);
                        elem.text(val);
                        elem.parent().addClass("executing");
                    }
                });
            };
        });

        ins.find(".statement > .input").each(function () {
            $(this).parent()[0].exec = function () {
                var t = $(this);
                t.addClass("executing");

                var io = t.find(".io");
                var asgn = t.find(".asgn");
                var delay = parseFloat($("#delay").text());
                var input = null;
                var disp = null;

                var processInput = function (inp) {
                    iolog(inp + "<br />", "in");
                    input = inp; // input is always a string
                    disp = stringify(inp);
                    io.text('"' + input + '"');
                    io.addClass("eval");

                    setTimeout(function () {
                        asgn.addClass("eval");
                    }, delay * 500);

                    // continue playing (now that we have input)
                    if (wr.state.name === "play") {
                        setTimeout(wr.play, delay * 1000 + 1);
                    }
                };

                wr.prompt("Please enter input:", processInput, function () {
                    processInput("");
                });

                // second step, assign the input 
                var frame = wr.stack[wr.curfrm];
                frame.steps.push({"exec": function () {
                        var nelem = t.find(".var");
                        nelem.addClass("executing");
                        var name = nelem.text();

                        // place value in the needed locations
                        var found = name.match(/^(\w+)(\[|\.)(\w+)/);
                        if (found) { // assignment into array or object
                            name = found[1];
                            var index = wr.eval(found[3], frame.ctx, frame.sys);
                            frame.ctx[name][index] = input;
                            disp = stringify(frame.ctx[name]);
                        } else {
                            frame.ctx[name] = input;
                        }
                        $("#f" + wr.curfrm + "_" + name)
                                .text(disp)
                                .parent().addClass("executing");

                        io.text("INPUT");
                        io.removeClass("eval");

                        setTimeout(function () {
                            asgn.removeClass("eval");
                        }, delay * 500);
                    }});
                return true; // stop playing (wait for input)
            };
        });

        ins.find(".statement > .output").each(function () {
            $(this).parent()[0].exec = function () {
                var t = $(this);
                t.addClass("executing");
                var frame = wr.stack[wr.curfrm];

                // eval expression 
                var exp = t.find(".exp");
                if (!exp.attr("exp")) {
                    exp.attr("exp", exp.text());
                }
                var result = wr.eval(exp.text(), frame.ctx, frame.sys);

                // exit if there was a doCall() in the exp
                if (wr.stack[wr.curfrm] !== frame) {
                    return;
                }

                // otherwise show the result, and line up the next steps
                exp.text(result);
                exp.addClass("eval");

                var asgn = t.find(".asgn");
                setTimeout(function () {
                    asgn.addClass("eval");
                }, parseFloat($("#delay").text()) * 500);

                // second step, show result
                frame.steps.push({"exec": function () {
                        t.find(".io").addClass("executing");
                        var result = exp.text();
                        exp.text(exp.attr("exp"));
                        exp.removeClass("eval");
                        iolog(result, "out");

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

                // eval expression 
                var exp = t.find(".exp");
                if (!exp.attr("exp")) {
                    exp.attr("exp", exp.text());
                }

                var result;
                // result object may be stored in element from call return
                if (exp[0].result && typeof exp[0].result === "object") {
                    result = exp[0].result;
                } else {
                    result = wr.eval(exp.text(), frame.ctx, frame.sys);
                    exp[0].result = result;
                }

                // exit if there was a doCall() in the exp
                if (wr.stack[wr.curfrm] !== frame) {
                    return;
                }

                // otherwise show the result, and line up the next steps
                var disp = stringify(result);
                if (typeof result === "object" && !$.isArray(result) &&
                        typeof result.toString === "function") {
                    disp = result.toString();
                }
                exp.text(disp);
                exp.addClass("eval");

                var asgn = t.find(".asgn");
                setTimeout(function () {
                    asgn.addClass("eval");
                }, parseFloat($("#delay").text()) * 500);

                // second step, assign to variable
                frame.steps.push({"exec": function () {
                        var nelem = t.find(".var");
                        var name = nelem.text();

                        var found = name.match(/^(\w+)(\[|\.)(\w+)/);
                        if (found) { // assignment into array or object
                            name = found[1];
                            var index = wr.eval(found[3], frame.ctx, frame.sys);
                            frame.ctx[name][index] = exp[0].result;
                            disp = stringify(frame.ctx[name]);
                        } else {
                            frame.ctx[name] = exp[0].result;
                        }

                        nelem.addClass("executing");
                        exp.text(exp.attr("exp"));
                        exp.removeClass("eval");

                        // place value in the needed locations
                        var var_disp = $("#f" + findex + "_" + name);
                        if (exp[0].result !== undefined) {
                            var_disp.text(disp);

                            // clear exp[0].result
                            delete exp[0].result;
                        }
                        var_disp.parent().addClass("executing");


                        setTimeout(function () {
                            asgn.removeClass("eval");
                        }, parseFloat($("#delay").text()) * 500);
                    }});
            };
        });

        ins.find(".statement > .call").each(function () {
            $(this).parent()[0].exec = function () {
                var t = $(this);
                t.addClass("executing");
                var frame = wr.stack[wr.curfrm];

                // eval expression 
                var exp = t.find(".exp");
                if (!exp.attr("exp")) {
                    exp.attr("exp", exp.text());
                }

                var result = wr.eval(exp.text(), frame.ctx, frame.sys);

                // exit if there was a doCall() in the exp
                if (wr.stack[wr.curfrm] !== frame) {
                    return;
                }

                exp.addClass("eval");

                setTimeout(function () {
                    exp.removeClass("eval");
                    exp.text(exp.attr("exp"));
                }, parseFloat($("#delay").text()) * 1000);
            };
        });

        ins.find(".statement > .if").each(function () {
            $(this).parent()[0].exec = function () {
                var t = $(this);
                t.addClass("executing");
                var frame = wr.stack[wr.curfrm];

                // eval expression
                var exp = t.find(".exp").first();
                if (!exp.attr("exp")) {
                    exp.attr("exp", exp.text());
                }
                var result = wr.eval(exp.text(), frame.ctx, frame.sys);

                // exit if there was a doCall() in the exp
                if (wr.stack[wr.curfrm] !== frame) {
                    return;
                }

                // show result, and line up next steps
                exp.text(result);
                exp.addClass("eval");

                var resetExp = function () {
                    exp.text(exp.attr("exp"));
                    exp.removeClass("eval");
                };

                var elems;
                var last;
                if (result) {
                    // get all the elements on the right branch
                    elems = $(document).find(
                            ".active .executing > .if > table > tbody > tr > .right"
                            ).children().get().reverse();

                    var absolute_right = elems.pop(); // needed for exit
                    var first = elems.pop(); // pops first connection in right
                    var bot_right = elems.shift(); // bot_right_connect
                    last = elems.shift(); // may be undefined

                    // the exit elem is .bot_left_connect and is also used to 
                    // scroll the chart left while executing large charts
                    var exit_elem = t.find(".left").first().children().last();

                    var enter_right = function () {
                        $(first).addClass("executing");
                        t.find(".top_connect").first().addClass("executing");
                    };
                    var exit_right = function () {
                        $([bot_right, absolute_right])
                                .addClass("executing");
                        $(last).addClass("executing"); // does nothing if undef
                        // find bot_left_connect
                        exit_elem.addClass("executing");
                        resetExp();
                    };

                    if (elems.length === 0) {
                        // if no statements in branch, do enter and exit in one
                        exit_elem[0].exec = function () {
                            enter_right();
                            exit_right();
                        };
                        frame.steps.push(exit_elem[0]);
                    } else {
                        // setup entrance to the branch
                        // replace with single entry item 
                        elems.push({"exec": function () {
                                enter_right();
                            }});

                        // setup exit from the branch
                        // replace with single exit item 
                        exit_elem[0].exec = function () {
                            exit_right();
                        };
                        elems.unshift(exit_elem[0]);

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
                    last = elems.shift(); // last connection on left side
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
                if (!exp.attr("exp")) {
                    exp.attr("exp", exp.text());
                }
                var result = wr.eval(exp.text(), frame.ctx, frame.sys);

                // exit if there was a doCall() in the exp
                if (wr.stack[wr.curfrm] !== frame) {
                    return;
                }

                // show result, and line up next steps
                exp.text(result);
                exp.addClass("eval");

                var resetExp = function () {
                    exp.text(exp.attr("exp"));
                    exp.removeClass("eval");
                };

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

        /**
         * Helper function put a return value in the place of a function call
         * @param {string} exp expression to modify
         * @param {string} fname name of the function call to replace
         * @param {string} value to replace the call with
         * @returns {string} modified expression
         */
        var replaceCall = function (exp, fname, value) {
            var start = exp.indexOf(fname);
            var begin = exp.substr(0, start);

            // find the opening paren -- should be right after fname
            var i = exp.indexOf('(', start);
            var pstack = [];
            pstack.push(i);
            i++;

            // helper to skip string args
            var findStringClose = function (delim) {
                while (exp[i] !== delim) {
                    i++;
                }
            };

            // look for closing paren
            while (pstack.length !== 0 && i < exp.length) {
                if (exp[i] === ')') {
                    pstack.pop();
                } else if (exp[i] === '(') {
                    pstack.push(i);
                } else if (exp[i] === '"') {
                    i++;
                    findStringClose('"');
                } else if (exp[i] === "'") {
                    i++;
                    findStringClose("'");
                }
                i++;
            }
            // if we did not find it
            if (pstack.length !== 0) {
                wr.alert("Error Invalid function call\n\n" +
                        "Please show this error to your professor,\n" +
                        "anlong with the expression you wrote.");
                throw "Invalid function call, unable to find ')' for " +
                        fname + " in expression: " + exp;
            }

            // reconstruct string with replacement
            var end = exp.substring(i, exp.length);
            return begin + value + end;
        };

        ins.find(".statement > .stop").each(function () {
            $(this).parent()[0].exec = function () {
                var t = $(this);
                t.addClass("executing");
                var frame = wr.stack[wr.curfrm];

                // eval expression and show in exp span
                var exp = t.find(".exp");
                if (!exp.attr("exp")) {
                    exp.attr("exp", exp.text());
                }
                var result = wr.eval(exp.text(), frame.ctx, frame.sys);
                var disp = stringify(result);
                exp.text(disp);
                exp.addClass("eval");
                wr.curfrm -= 1;

                if (wr.curfrm !== -1) {
                    var pframe = wr.stack[wr.curfrm];
                    var pstmt = frame.ret2.closest(".statement").first();

                    // in reverse order, show that we're back in the previous
                    // function, then put our result in place of the call
                    // and then re-execute the original statement 
                    pframe.steps.push(pstmt[0]);
                    pframe.steps.push({
                        "exec": function () {
                            var exp = frame.ret2;
                            pstmt.addClass("executing");
                            var cur = exp.text();
                            exp.result = result;
                            exp.text(replaceCall(cur, frame.name, disp));
                        }
                    });
                    pframe.steps.push({
                        "exec": function () {
                            // remove function return was inside of
                            frame.ins.detach();
                            frame.data.detach();
                            wr.stack.pop();

                            // show function return goes back to
                            pstmt.addClass("executing");
                            pframe.ins.addClass("active");
                            pframe.data.addClass("active");
                        }
                    });


                } else {
                    // we're at the end of main 
                    wr.curfrm = 0;
                    frame.steps.push({
                        "exec": function () {
                            iolog("\n- Execution complete, click edit or play " +
                                    "to continue -", "done");
                            frame.data.detach();
                            wr.stack.pop();
                            wr.curfrm -= 1;
                            if (wr.state.name === "play") {
                                $("#play_pause").click();
                            }
                            return true; // stops execution
                        }
                    });
                }
            };
        });
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
        if (wr.curfrm === wr.maxrec) {
            throw "Maximum recursion depth reached";
        }

        // find where we have to return to (if we're not main starting up)
        var ret2 = false;
        if (wr.curfrm !== 0) {
            ret2 = wr.stack[wr.curfrm - 1].ins.find(".executing .exp").first();
            // if we can't find it we aren't the fist call for the expression
            // return so that we can be evaluated later (keeps sequence correct)
            if (!ret2.length) {
                wr.curfrm -= 1;
                return;
            }
        }

        // create the system and variables context for this call
        var sys = {};
        // add the flowchart functions to the system context
        for (var key in wr.functions) {
            sys[key] = 'function () { $w.top.wr.doCall("' + key +
                    '", arguments) }';
        }

        // add the variables for this function to the regular context
        var ctx = {};
        for (var key in wr.functions[fname]) {
            ctx[key] = 'undefined';
        }
        // set args values
        if (args) {
            $("#vars_" + fname + " .parameter").each(function (i, e) {
                var t = $(e);
                var name = t.children("input").val();
                if (!t.hasClass("bottom") && name !== "") {
                    ctx[name] = args[i];
                }
            });
        }

        // create a copy of the instructions, make executable, and add to doc
        var ins = $("#ins_" + fname).clone()
                .attr("id", "frameI" + wr.curfrm)
                .addClass("instructions frame");
        makeExecutable(ins);
        $("#instructions").append(ins);

        // create the HTML view of the stack frame and add it to the document
        var fdata = $("<div class='frame' id='frameD" + wr.curfrm + "'>");
        fdata.append("<span class='cornerb'><span class='cornerw'></span></span>");
        var label = "<div class='flabel'>" + fname + "(";
        if (args) {
            for (var i = 0; i < args.length; i++) {
                label += stringify(args[i]) + ", ";
            }
            label = label.substring(0, label.length - 2);
        }
        label += ")</div>";
        fdata.append(label);
        var vars = $("<table class='data'>");
        var v; // add fields for each of the variables
        for (key in wr.functions[fname]) {
            v = $("<tr>");
            v.append("<td class='vname'>" + key + "</td>");
            v.append("<td class='vdata' " +
                    "id='f" + wr.curfrm + "_" + key + "'>");
            vars.append(v);
        }
        // add ability to switch and look at other frames
        fdata.click(function () {
            if (wr.state.name !== "pause") {
                $("#play_pause").click();
            }
            $(".active").removeClass("active");
            var fnum = $(this).attr("id").match(/\d+/)[0];
            $("#frameD" + fnum).addClass("active");
            $("#frameI" + fnum).addClass("active");
        });
        fdata.append(vars);
        $("#stack").prepend(fdata);

        // setup the steps for this function call;
        var steps = [];
        $(ins.children().get().reverse()).each(function () {
            steps.push(this);
        });

        // have the first step be switching to the new flow chart
        steps.push({
            "exec": function () {
                // clear active from previous items
                $(".active").removeClass("active");
                fdata.addClass("active");
                ins.addClass("active");
                ins.find(".statement").first().addClass("executing");
            }
        });

        // finish by putting our new frame onto the stack
        wr.stack.push({
            'name': fname,
            'ret2': ret2,
            'ctx': ctx,
            'sys': sys,
            'ins': ins,
            'data': fdata,
            'steps': steps
        });
    };
});
/* 
 Created on : Jun 21, 2015
 Author     : mzijlstra
 */

var wr = (function (wr) {
    "use strict";

    /*****************************************************
     *          --- Flowcharts States ---
     * Can be in 3 different states: edit, play, pause 
     * The code below uses the state pattern for the states
     *****************************************************/

    // private variables for different HTML elements used in this view
    var play_btn;
    var pause_btn;
    var workspace;
    var variables;
    var stack;
    var output;

    // initailize them once document is ready
    $(function() {
        play_btn = $("#play_btn");
        pause_btn = $("#pause_btn");
        workspace = $("#workspace");
        variables = $("#variables");
        stack = $("#stack");
        output = $("#output_disp");    
    });

    // helper functions to switch between states
    var toPlayState = function () {
        pause_btn.css("display", "block");
        play_btn.css("display", "none");
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
        workspace.removeClass("exec");
        workspace.addClass("edit");
        stack.hide();
        variables.show();
        $(".fun").show();
        $("#add_fun").show();
        $("#fun-names").css({"height": "", "padding": "", "border-bottom": ""});

        clearTimeout(wr.playing);
        wr.state = states.edit;

        // find which function we're executing
        var goto = $(".fun").first();
        if (wr.stack.length) {
            var fun = wr.stack[wr.curfrm].name;
            $("#fun-names .name").each(function (i, e) {
                if ($(e).text() === fun) {
                    goto = $(e);
                }
            });
        }

        // clear the stack, and the HTML frames (both data and instruction)
        wr.stack = [];
        wr.curfrm = -1;
        $(".frame").detach();
        variables.show();
        stack.hide();
        output.hide();

        // show function we were running now available for edit
        goto.click();
    };
    var toPauseState = function () {
        pause_btn.css("display", "none");
        play_btn.css("display", "block");
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
            },
            // variables specific to the edit state
            "curfun": 'main', // the chart currently being edited
            "curvars": wr.functions.main // the variables for that chart            
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

    return wr;
}(wr));

// on page load, execute setup and hook up event handlers
$(function () {
    // switch to the correct view right after page load
    setTimeout(function () {
        var hash = window.location.hash;
        if (hash) {
            var goto;
            // show the flowchart for given function
            if (hash.substr(0, 5) === "#fun_") {
                var fun = hash.substring(5, hash.length);
                $("#fun-names .name").each(function (i, e) {
                    if ($(e).text() === fun) {
                        goto = $(e);
                    }
                });
            } else {
                // show javascript or images
                goto = $(window.location.hash + "_btn");
            }
            if (goto) {
                goto.click();
            }
        }
    }, 100);


    /************************************************
     *          --- The Flowcharts View --- 
     ************************************************/
    // when clicking the flowcharts btn, switch to the flowcharts view
    $("#flowcharts_btn").click(function () {
        $("#js_code").hide();
        $("#images").hide();
        $("#output_disp").hide();
        $(".activeView").removeClass("activeView");
        $("#flowcharts_btn").addClass("activeView");
        window.location.assign("#");
    });

    // When the user clicks in the instructions area while in play or pause
    $("#functions").click(function (evt) {
        var t = $(evt.target);
        if (wr.state.name === "play") {
            wr.state.playpause();
        } else if (wr.state.name === "pause") {
            if (wr.stack[wr.curfrm] === undefined) {
                // if there is nothing left to execute, go back to edit
                wr.state.reset();
                return;
            }
            // if they click in the general white space 
            // while there is something to execute
            if (t.hasClass("input")
                    || t.hasClass("output")
                    || t.hasClass("assignment")
                    || t.hasClass("diamond")
                    || t.hasClass("call")
                    || t.hasClass("statement")
                    || t.hasClass("connection")) {
                wr.step();
            } else { // otherwise they clicked on something to edit
                wr.state.reset();
            }
        }
    });

    // clicking the play / pause button on the flowcharts view
    $("#play_pause").click(function (evt) {
        wr.state.playpause();
        evt.stopPropagation();
    });

    // the delay control to change the delay between steps
    $("#delay_disp").click(function (evt) {
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
        evt.stopPropagation();
    });

    /*****************************************************
     * The 'compile' check for the different statements;
     * used before switching to the flowcharts play state
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



    /********************************************************
     *          --- The JavaScript View ---
     * Generate JavaScript from flowchart
     * // TODO also generate TypeScript
     * See: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
     * for reference on how to add types
     ********************************************************/
    // setup the editor for the JavaScript view on page load
    if (!wr.editor) {
        var editor = ace.edit("editor");
        editor.setTheme("ace/theme/clouds");
        editor.getSession().setMode("ace/mode/typescript");
        editor.getSession().setUseSoftTabs(true);    
        wr.editor = editor;
        wr.editor.setReadOnly(true);
    }

    $("#edit_js_btn").click(wr.editJS);

    $("#javascript_btn").click(function () {
        if (wr.state.name !== "edit") {
            wr.state.reset();
        }

        if (!wr.ready()) {
            wr.alert("Cannot generate JavaScript,\n there are errors in this " +
                    "project\n\n" +
                    "The problems have been highligted, \n" +
                    " please check all functions");
            return;
        }

        // generates JS code for function based on flowchart
        var genFunc = function (name) {
            // generate function signature
            var code = "function " + name + "(";
            $("#vars_" + name + " .parameter").each(function () {
                var t = $(this);
                var n = t.children("input").val();
                if (!t.hasClass("bottom") && n !== "") {
                    code += n + ", ";
                }
            });
            var len = code.length;
            if (code[len - 1] === " " && code[len - 2] === ",") {
                code = code.substr(0, len - 2);
            }
            var returnType = $("#ins_" + name + " .start .type").text();
            code += ") { /* " + returnType + " */\n";

            // add variable declarations into the function
            var vars = "";
            $("#vars_" + name + " .variable").filter(function () {
                var t = $(this);
                if (t.hasClass("parameter") || t.hasClass("bottom")) {
                    return false;
                }
                return true;
            }).each(function () {
                var t = $(this);
                var n = t.children("input").val();
                var type = t.find(".type").text();
                vars += "    var " + n + "; /* " + type + " */\n";
            });
            code += vars;
            // extra newline to separate vars from instructions
            if (vars) {
                code += "\n";
            }

            // add instructions
            var makeIndent = function (amount) {
                var result = "";
                for (var i = 0; i < amount; i++) {
                    result += "    ";
                }
                return result;
            };
            var addInstruction = function (elem, indent) {
                var t = $(elem);
                var c = makeIndent(indent);
                if (t.children(".start").length) {
                    return "";
                } else if (t.children(".input").length) {
                    c += t.find(".var").text();
                    c += " = prompt('Enter Input: ');\n";
                } else if (t.children(".output").length) {
                    c += "console.log(";
                    c += t.find(".exp").text() + ");\n";
                } else if (t.children(".assignment").length) {
                    c += t.find(".var").text();
                    c += " = ";
                    c += t.find(".exp").text() + ";\n";
                } else if (t.children(".call").length) {
                    c += t.find(".exp").text() + ";\n";
                } else if (t.children(".if").length) {
                    c += "if (" + t.find(".exp").first().text() + ") {\n";
                    t.children(".if").children("table").children("tbody ")
                            .children("tr").children("td.right")
                            .children(".statement").each(
                            function () {
                                c += addInstruction(this, indent + 1);
                            });
                    c += makeIndent(indent);
                    c += "} else {\n";
                    t.find(".left").first().children(".statement").each(
                            function () {
                                c += addInstruction(this, indent + 1);
                            });
                    c += makeIndent(indent);
                    c += "}\n";
                } else if (t.children(".while").length) {
                    c += "while (" + t.find(".exp").first().text() + ") { \n";
                    t.find(".loop_body").first().children(".statement").each(
                            function () {
                                c += addInstruction(this, indent + 1);
                            });
                    c += makeIndent(indent);
                    c += "}\n";
                } else if (t.children(".stop").length) {
                    c += "\n" + makeIndent(indent);
                    c += "return ";
                    c += t.find(".exp").text() + ";\n";
                }
                return c;
            };
            $("#ins_" + name + " > .statement").each(function () {
                var ins = addInstruction(this, 1);
                code += ins;
            });
            // close function
            code += "}\n\n";
            return code;
        };

        var program = "";
        var js = $("#code_from_php").text();
        if (js) {
            program = js;
            $("#flowcharts_btn").hide();
        } else {
            // generate JS from flowcharts
            for (var key in wr.functions) {
                if (key !== "main") {
                    program += genFunc(key);
                }
            }
            program += genFunc("main");
            program += "main(); /* start executing main */\n";    
        }

        // insert and show program code
        editor.setValue(program);
        editor.selection.clearSelection();
        editor.focus();

        $(".activeView").removeClass("activeView");
        $("#javascript_btn").addClass("activeView");
        $("#images").hide();
        $("#js_code").show();
        window.location.assign("#javascript");
    });

    // the play button on the javascript view
    $("#play_js_btn").click(function () {
        var program = editor.getValue();
        $("#out").empty();
        $("#output_disp").show();
        var sandbox = $('#sandbox')[0].contentWindow;
        sandbox.eval("$__closePopups()");
        try {
            sandbox.eval(program);
        } catch (e) {
            wr.iolog(e, "err");
        }
        wr.editor.focus();
    });


    /********************************************************
     *          --- The Images View ---
     ********************************************************/
    $("#images_btn").click(function () {
        if (wr.state.name !== "edit") {
            wr.state.reset();
        }

        $("#js_code").hide();
        $("#output_disp").hide();
        $("#images").show();
        $(".activeView").removeClass("activeView");
        $("#images_btn").addClass("activeView");
        window.location.assign("#images");
    });
});

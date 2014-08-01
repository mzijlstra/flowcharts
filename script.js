/* 
    Created on : Juyl 31, 2014, 7:10:01 PM
    Author     : mzijlstra
*/

// wr namespace
var wr = {
    "block" : function(id) {
        return $(id).clone(true).removeAttr("id");
    }
};

// hook up event handlers
$(function() {

    // display menu when clicking on a connection block
    $(".connection").click(function(event) {
        var menu = $("#menu");
        if (menu.css("display") === "none") {
            menu.css("top", event.pageY);
            menu.css("left", event.pageX);
            menu.css("display", "block");
            wr.clicked = $(this);
        } else {
            menu.css("display", "none");
        }
        return false;
    });

    // hide menu when clicking elsewhere
    $("body").click(function() {
        if ($("#menu").css("display") !== "none") {
            $("#menu").css("display", "none");
        }
    });

    // click menu assignment
    $("#add_asgn").click(function() {
        wr.clicked.after(wr.block("#connection"))
                .after(wr.block("#assignment"));
    });
    
    // click menu if statement
    $("#add_if").click(function() {
        wr.clicked.after(wr.block("#connection"))
                .after(wr.block("#if"));
    });
    
    // click menu while loop
    $("#add_while").click(function() {
        wr.clicked.after(wr.block("#connection"))
                .after(wr.block("#while"));
    });

});
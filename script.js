/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// hook up event handlers
var wr = {
    "block" : function(id) {
        return $(id).clone(true).removeAttr("id");
    }
};

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

    // click assignment
    $("#add_asgn").click(function() {
        wr.clicked.after(wr.block("#connection"));
        wr.clicked.after(wr.block("#assignment"));
    });
    
    // click if statement
    $("#add_if").click(function() {
        wr.clicked.after(wr.block("#connection"));
        wr.clicked.after(wr.block("#if"));
    });
    
    // click while loop
    $("#add_while").click(function() {
        wr.clicked.after(wr.block("#connection"));
        wr.clicked.after(wr.block("#while"));
    });

});
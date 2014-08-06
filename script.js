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

    // menu clicks trigger insertions based on id clicked
    $("#menu").click(function(event) {
        var t = $(event.target);
        var toLoad = '#' + t.attr('id').substr(4);
        wr.clicked.after(wr.block("#connection"))
                .after(wr.block(toLoad));
    });
});
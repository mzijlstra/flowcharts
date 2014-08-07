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
    wr.ins_menu = $('#ins_menu');
    wr.proj_menu = $('#project_menu');

    // display insertion menu when clicking on a connection block
    $(".connection").click(function(event) {
        if (wr.ins_menu.css("display") === "none") {
            wr.ins_menu.css("top", event.pageY);
            wr.ins_menu.css("left", event.pageX);
            wr.ins_menu.css("display", "block");
            wr.clicked = $(this);
        } else {
            wr.ins_menu.css("display", "none");
        }
        return false;
    });

    // hide menu when clicking elsewhere
    $("body").click(function() {
        if (wr.ins_menu.css("display") !== "none") {
            wr.ins_menu.css("display", "none");
        }
    });

    // menu clicks trigger insertions based on id clicked
    $("#ins_menu").click(function(event) {
        var t = $(event.target);
        var toLoad = '#' + t.attr('id').substr(4);
        wr.clicked.after(wr.block("#connection"))
                .after(wr.block(toLoad));
    });
});
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

// hook up event handlers and frequently used elements
$(function() {
	wr.vars = {};
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
    wr.ins_menu.click(function(event) {
        var t = $(event.target);
        var toLoad = '#' + t.attr('id').substr(4);
        wr.clicked.after(wr.block("#connection"))
                .after(wr.block(toLoad));
    });

	// store current value on focus
	$(".variable .var").focus(function() {
		t = $(this);
		t.attr("cur", t.val());
	});

	// no spaces in variable names, blur on enter
	$(".variable .var").keydown(function(event) {
		if (event.which === 32) {
			return false;
		} else if (event.which === 13) {
			$(event.target).blur();
		}
	});

	// check if we need to update on blur
	$(".variable .var").blur(function() {
		t = $(this);

		// error messages for bad names
		if (!t.val().match(/^[_a-zA-Z]([_0-9a-zA-Z]+)?$/)) {
			alert("Bad Variable Name\n\n" +
				"Variables can start with an underscore or a letter.\n" +
				"Then didigts, underscores, and letters are allowed.");
			this.focus();
		} else if (wr.vars[t.val()]) {
			alert("Duplicate variable name " + t.val() +"\n" +
				"Please change one to keep them unique");
			this.focus();
		}

		if (t.attr("cur") !== t.val()) {
			if (t.parent().hasClass("bottom")) {
				p = t.parent();
				p.removeClass("bottom");
				p.after(wr.block("#declaration"));
			}
			if (t.attr("cur") !== "") {
				delete wr.vars[t.attr("cur")];
			}
			wr.vars[t.val()] = t.parent();

			// TODO AJAX Post variables
		}
	});
});

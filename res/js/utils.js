/* 
 Created on : Jul 07, 2015
 Author     : mzijlstra
 */

/**
 * Global constructor function for creating a turtle graphics window
 * @param {int} width
 * @param {int} height
 * @returns {object} reference to the newly created window
 */
var TGWindow = function (width, height) {
    if (!width || typeof (width) !== 'number') {
        width = 400;
    }
    if (!height || typeof (height) !== 'number') {
        height = 300;
    }

    // we may be inside an iframe
    var w = window;
    if (window.top) {
        w = window.top;
    }

    var parent_x = w.innerWidth
            || w.document.documentElement.clientWidth
            || w.document.body.clientWidth;

    var features = "top=250,left=" + (parent_x - width) + ",width=" + width +
            ",height=" + height + ",menubar=0,resizable=0";

    var win = window.open("../turtle", "popup", features);
    win.onload = function () {
        var canvas = win.document.getElementById("canvas");
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
    };
    return win;
};

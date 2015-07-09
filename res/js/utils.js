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
    alert(features);

    var win = window.open("../turtle", "popup", features);
    win.onload = function () {
        win.document.body.style.overflow = "hidden";
        var canvas = win.document.getElementById("canvas");
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        var ctx = canvas.getContext("2d");
        var path = new Path2D();
        path.moveTo(100, 100);
        path.arc(100, 100, 10, 0, Math.PI * 2);
        ctx.fill(path);
        ctx.fillStyle = "#4A4";
        path = new Path2D();
        path.moveTo(100, 88);
        path.arc(100, 88, 4, 0, Math.PI * 2);
        path.moveTo(92, 95);
        path.arc(92, 95, 4, 0, Math.PI * 2);
        path.moveTo(108, 95);
        path.arc(108, 95, 4, 0, Math.PI * 2);
        path.moveTo(95, 108);
        path.arc(95, 108, 4, 0, Math.PI * 2);
        path.moveTo(105, 108);
        path.arc(105, 108, 4, 0, Math.PI * 2);
        ctx.fill(path);
        path = new Path2D();
        path.moveTo(97, 86.5);
        path.lineTo(99, 86.5);
        path.moveTo(101, 86.5);
        path.lineTo(103, 86.5);
        path.moveTo(97, 90);
        path.arc(100, 86, 4, Math.PI / 4, Math.PI / 4 * 3);
        ctx.stroke(path);
    };
    return win;
};

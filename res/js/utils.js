/* 
 Created on : Jul 07, 2015
 Author     : mzijlstra
 */
(function () {
    var createCanvasPopup = function (width, height) {
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

        var parent_x = $(document).width();

        var features = "top=250,left=" + (parent_x - width) + ",width=" +
                (width + 1) + ",height=" + (height + 4) + ",menubar=0";

        var win = window.open(undefined, "popup", features);
        if (!win) {
            throw "Unable to create window -- is the popup blocked?";
        }
        var body = $(win.document.body);
        body.css({"margin": "0"});
        var canvas = $("<canvas id='canvas' width='" + width + "' height='" + 
                height + "'>");
        body.append(canvas);
        return win;
    };

    var createTurtle = function () {
        // Create a turtle display
        var display = $("<canvas width='32' height='32'>");
        display.css({
            "position": "absolute",
            "top": $(this.document).height() / 2 - 30,
            "left": $(this.document).width() / 2 - 30,
            "transform-origin": "30px 30px"
        });
        $(this.document.body).append(display);

        // private variables and functions for object
        var toRad = function (deg) {
            return deg / 180 * Math.PI;
        };
        // TODO make penColor and lineWidth public properties!
        var pen_color = "black";
        var ctx = $(this.document).find("#canvas")[0].getContext('2d');
        ctx.lineWidth = 2;
        ctx.strokeStyle = pen_color;
        var penDown = true;
        var deg = 0;
        var x = $(this.document).width() / 2;
        var y = $(this.document).height() / 2;

        var drawTurtle = function () {
            var ctx = display[0].getContext("2d");
            ctx.clearRect(0, 0, 32, 32);

            // draw body
            ctx.fillStyle = "#882";
            var path = new Path2D();
            path.moveTo(26, 17);
            path.arc(16, 17, 10, 0, Math.PI * 2);
            ctx.fill(path);
            ctx.stroke(path);

            // draw limbs
            ctx.fillStyle = "#4A4";
            path = new Path2D();
            path.moveTo(16, 5);
            path.arc(16, 5, 4, 0, Math.PI * 2);
            path.moveTo(8, 12);
            path.arc(8, 12, 4, 0, Math.PI * 2);
            path.moveTo(24, 12);
            path.arc(24, 12, 4, 0, Math.PI * 2);
            path.moveTo(11, 25);
            path.arc(11, 25, 4, 0, Math.PI * 2);
            path.moveTo(21, 25);
            path.arc(21, 25, 4, 0, Math.PI * 2);
            ctx.fill(path);

            // draw face
            ctx.strokeStyle = "#4A4";
            path = new Path2D();
            path.moveTo(14, 1);
            path.lineTo(18, 1);
            ctx.stroke(path);
            ctx.strokeStyle = "purple";
            ctx.lineWidth = 2;
            path = new Path2D();
            path.moveTo(12, 2);
            path.lineTo(20, 2);
            path.moveTo(20, 4);
            path.lineTo(22, 4);
            ctx.stroke(path);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "black";
            path = new Path2D();
            path.moveTo(13, 2.5);
            path.lineTo(15, 2.5);
            path.moveTo(17, 2.5);
            path.lineTo(19, 2.5);
            path.moveTo(13, 5.5);
            path.lineTo(19, 5.5);
            path.moveTo(16, 5.5);
            path.lineTo(16, 6.5);
            path.moveTo(13, 5.5);
            path.lineTo(13, 4.5);
            path.moveTo(19, 5.5);
            path.lineTo(19, 4.5);
            ctx.stroke(path);
        };
        var drawPenDown = function () {
            var ctx = display[0].getContext("2d");
            var path = new Path2D();
            ctx.fillStyle = "black";
            path.moveTo(30, 28);
            path.lineTo(28, 30);
            path.lineTo(9, 6);
            path.lineTo(11, 4);
            ctx.fill(path);
            path = new Path2D();
            path.moveTo(30, 30);
            path.lineTo(28, 30);
            path.lineTo(30, 28);
            ctx.fillStyle = pen_color;
            ctx.fill(path);
        };
        var drawPenUp = function () {
            var ctx = display[0].getContext("2d");
            ctx.strokeStyle = "rgb(0,0,0,0.5)";
            ctx.lineWidth = 1;
            var path = new Path2D();
            path.moveTo(28, 30);
            path.lineTo(32, 30);
            path.moveTo(30, 28);
            path.lineTo(30, 32);
            ctx.stroke(path);
            ctx.fillStyle = "black";
            path = new Path2D();
            path.moveTo(0, 12);
            path.lineTo(32, 12);
            path.lineTo(32, 15);
            path.lineTo(0, 15);
            ctx.fill(path);
        };
        drawTurtle();
        drawPenDown();

        var turtle = {
            'toString': function () {
                return "[object Turtle]";
            },
            'forward': function (amount) {
                var dx = Math.cos(toRad(deg)) * amount;
                var dy = Math.sin(toRad(deg)) * amount;
                display.css({
                    "top": y + dy - 30,
                    "left": x + dx - 30
                });
                if (penDown) {
                    var path = new Path2D();
                    path.moveTo(x, y);
                    path.lineTo(x + dx, y + dy);
                    ctx.stroke(path);
                }
                x += dx;
                y += dy;
            },
            'rotate': function (degree) {
                deg += degree;
                deg = deg % 360;
                display.css({
                    "transform": "rotate(" + deg + "deg)"
                });
            },
            'penUp': function () {
                penDown = false;
                drawTurtle();
                drawPenUp();
            },
            'penDown': function () {
                penDown = true;
                drawTurtle();
                drawPenDown();
            },
            'penColor': function (color) {
                pen_color = color;
                drawTurtle();
                if (penDown) {
                    drawPenDown();
                } else {
                    drawPenUp();
                }
                ctx.strokeStyle = color;
            },
            'penWidth': function (width) {
                ctx.lineWidth = width;
            },
            'show': function () {
                display.show();
            },
            'hide': function () {
                display.hide();
            },
            'moveTo': function (nx, ny) {
                display.css({
                    "top": ny - 16,
                    "left": nx - 16
                });
                if (penDown) {
                    path = new Path2D();
                    path.moveTo(x, y);
                    path.lineTo(nx, ny);
                    ctx.stroke(path);
                }
                x = nx;
                y = ny;
            },
            'rotateTo': function (degree) {
                deg = degree % 360;
                display.css({
                    "transform": "rotate(" + (deg + 90) + "deg)"
                });

            }
        };
        return turtle;
    };

    /**
     * Global constructor function for creating a turtle graphics window
     * @param {int} width
     * @param {int} height
     * @returns {object} reference to the newly created window
     */
    window.TGWindow = function (width, height) {
        var win = createCanvasPopup(width, height, "../turtle");
        win.document.title = "Turtle Graphics";
        win.createTurtle = createTurtle;
        return win;
    };
    
    /**
     * Single function to create a window and a turtle
     * 
     * @param {int} width
     * @param {int} height
     * @returns {object} reference to the created turtle
     */
    window.TurtleGFX = function(width, height) {
        var win = window.TGWindow(width, height);
        return win.createTurtle();
    };
    
    
    /**
     * Global constructor funfction for an image manipulation window
     * 
     * @param {type} width
     * @param {type} height
     * @param {type} url
     * @returns {Window|Window.ImgWindow.win}
     */
    window.ImgWindow = function (width, height, url) {
        var win = createCanvasPopup(width, height, "../image");
        $(win).load(function () {
            var img = new Image();
            img.src = url;
            img.onload = function () {

            };
        });
        return win;
    };
}());


 
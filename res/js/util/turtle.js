/* 
 Created on : Jul 9, 2015
 Author     : mzijlstra
 */

var createTurtle = function () {
    // Create a turtle display
    var display = $("<canvas width='32' height='32'>");
    display.css({
        "position": "absolute",
        "top": $(document).height() / 2 - 32 / 2,
        "left": $(document).width() / 2 - 32 / 2,
        "transform-origin": "16 16"
    });
    $(document.body).append(display);

    // draw body
    var ctx = display[0].getContext("2d");
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

    var toRad = function(deg) {
        return deg / 180 * Math.PI;
    };
    ctx = $("#canvas")[0].getContext('2d');
    ctx.lineWidth = 2;
    var penDown = true;
    var deg = 270;
    var x = $(document).width() / 2;
    var y = $(document).height() / 2;
    var turtle = {
        'toString': function () {
            return "[object Turtle]";
        },
        'forward': function (amount) {
            var dx = Math.cos(toRad(deg)) * amount;
            var dy = Math.sin(toRad(deg)) * amount;
            display.css({
                "top": y + dy - 16,
                "left": x + dx - 16
            });
            if (penDown) {
                path = new Path2D();
                path.moveTo(x,y);
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
                "transform": "rotate("+(deg+ 90)+"deg)"
            });
        },
        'penUp': function () {
            penDown = false;
        },
        'penDown': function () {
            penDown = true;
        },
        'penColor': function(color) {
            ctx.strokeStyle = color;
        },
        'penWidth': function(width) {
            ctx.lineWidth = width;
        },
        'show': function () {
            display.show();
        },
        'hide': function () {
            display.hide();
        },
        'moveTo': function(nx, ny) {
            display.css({
                "top": ny - 16,
                "left": nx - 16
            });
            if (penDown) {
                path = new Path2D();
                path.moveTo(x,y);
                path.lineTo(nx, ny);
                ctx.stroke(path);
            }
            x = nx;
            y = ny;                        
        },
        'rotateTo': function(degree) {
            deg = degree % 360;
            display.css({
                "transform": "rotate("+(deg+ 90)+"deg)"
            });
            
        }
    };
    return turtle;
};
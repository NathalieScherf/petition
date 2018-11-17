var c = document.querySelector("canvas");

var ctx = c.getContext("2d");
ctx.strokeStyle = "SlateBlue";
ctx.lineWidth = 2;

var currX;
var currY;
var draw;

c.addEventListener("mousedown", function down(e) {
    ctx.beginPath(); //infogad
    currX = e.offsetX;
    currY = e.offsetY;
    //    return currX, currY;
    c.addEventListener(
        "mousemove",
        (draw = function(ev, currX, currY) {
            ctx.moveTo(currX, currY);
            newX = ev.offsetX;
            newY = ev.offsetY;
            ctx.lineTo(newX, newY);
            ctx.stroke();
        })
    );
});

document.addEventListener("mouseup", function() {
    //stop painting
    c.removeEventListener("mousemove", draw);
    console.log("mouse up");
    //signUrl = c.toDataURL();
    //console.log(signUrl);
});
var button = document.getElementById("button");

button.addEventListener("click", function() {
    var emptyInput = document.getElementById("signStroke");
    emptyInput.value = c.toDataURL();
    //    console.log(emptyInput.value);
});

/*will return a string, to be put into the database
as a value of the key signatures
set value when mouse up, done drawing, when clicking the submit button


    setting value of hidden form field*/

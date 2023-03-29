// waits for content being loaded
document.addEventListener("DOMContentLoaded", () => {

    // loads canvas for drawing rects
    var ctx = document.getElementById('canvas').getContext('2d');

    ctx.fillRect(0, 0, 50, 50);
})
var path = document.getElementById('the-path');

var roundTo = function(input, sigdigs) {
    return Math.round(input * Math.pow(10, sigdigs)) / Math.pow(10, sigdigs);
}

var makeSpiralPoints = function(origin, revolutions, pointCount, clockwise, padding) {
    var direction = clockwise ? 1 : -1;
    var circ = padding / (2 * Math.PI);
    var step = (2 * Math.PI * revolutions) / pointCount;
    var points = [],
        angle, x, y;
    for (var i = 0; i <= pointCount; i++) {
        angle = direction * step * i;
        x = roundTo((circ * angle) * Math.cos(angle) + origin.x, 2);
        y = roundTo((circ * angle) * Math.sin(angle) + origin.y, 2);
        points.push(x + " " + y);
    }

    return ('M ' + points.shift() + ' S ' + points.join(' '));
}

path.setAttribute('d', makeSpiralPoints({ x: 75, y: 75 }, 20, 2048, false, 4));
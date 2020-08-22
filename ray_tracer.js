// Ray Tracing experiment

const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

var num_rays = 800;
var num_rects = 5;
var num_circles = 5;
var line_width = 3;
var cone_size = 0.25;

const speed = 10;

var config = {
    type: Phaser.AUTO,
    width: screenWidth,
    height: screenHeight,
    fps: {
        target: 30,
        forceSetTimeOut: true
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    }
};

var game = new Phaser.Game(config);
var rects = [];
var circles = [];
var center, debug_txt, target;
var graphics;

function preload() {
}

function create() {
    graphics = this.add.graphics();
    this.cameras.main.setBackgroundColor(0x0);

    gen_environment();

    center = new Phaser.Geom.Point(this.cameras.main.centerX, this.cameras.main.centerY);
    target = new Phaser.Geom.Point(this.cameras.main.centerX, this.cameras.main.centerY);
    debug_txt = this.add.text(10, 10, 'hello there', { color: '#ddd' });

    // Key Bindings
    this.input.on('pointermove', function (pointer) {
        target.setTo(pointer.x, pointer.y);
    });

    this.input.keyboard.on('keyup-' + 'U', function (event) { num_rays *= 2 });
    this.input.keyboard.on('keyup-' + 'J', function (event) { num_rays = num_rays < 1 ? 0.5 : num_rays / 2 });

    this.input.keyboard.on('keyup-' + 'I', function (event) { num_rects *= 2; gen_environment(); });
    this.input.keyboard.on('keyup-' + 'K', function (event) { num_rects = num_rects <= 0.05 ? 0.5 : num_rects / 2; gen_environment() });

    this.input.keyboard.on('keyup-' + 'O', function (event) { num_circles *= 2; gen_environment() });
    this.input.keyboard.on('keyup-' + 'L', function (event) { num_circles = num_circles <= 0.05 ? 0.5 : num_circles / 2; gen_environment() });

    this.input.keyboard.on('keyup-' + 'Y', function (event) { cone_size = cone_size >= 2 ? 2 : cone_size * 2 });
    this.input.keyboard.on('keyup-' + 'H', function (event) { cone_size = cone_size <= 0.05 ? 0.05 : cone_size / 2 });

    this.input.keyboard.on('keyup-' + 'SPACE', function (event) { gen_environment() });
}

function gen_environment() {
    rects = [];
    circles = [];
    for (var i = 0; i < Math.floor(num_rects); i++) {
        var width = Math.floor((Math.pow(Math.random(), 3)) * 251 + 100);
        var height = Math.floor((Math.pow(Math.random(), 3)) * 251 + 100);

        var x = Math.floor(Math.random() * (screenWidth - width));
        var y = Math.floor(Math.random() * (screenHeight - height));

        var rect = new Phaser.Geom.Rectangle(x, y, width, height);
        var color = new Phaser.Display.Color();
        color.random(50);

        rects.push({ shape: rect, color: color });
    }

    for (var i = 0; i < Math.floor(num_circles); i++) {
        var radius = Math.floor((Math.pow(Math.random(), 3)) * 251 + 100);

        var x = Math.floor(Math.random() * (screenWidth - radius));
        var y = Math.floor(Math.random() * (screenHeight - radius));

        var circle = new Phaser.Geom.Circle(x, y, radius);
        var color = new Phaser.Display.Color();
        color.random(50);

        circles.push({ shape: circle, color: color });
    }
}

function update() {
    var cursors = this.input.keyboard.createCursorKeys();
    var keyW = this.input.keyboard.addKey('W');
    var keyA = this.input.keyboard.addKey('A');
    var keyS = this.input.keyboard.addKey('S');
    var keyD = this.input.keyboard.addKey('D');
    if (keyD.isDown) {
        center.setTo(center.x + speed, center.y);
    }
    if (keyA.isDown) {
        center.setTo(center.x - speed, center.y);
    }
    if (keyW.isDown) {
        center.setTo(center.x, center.y - speed);
    }
    if (keyS.isDown) {
        center.setTo(center.x, center.y + speed);
    }

    debug_txt.setText(
        'Rays: ' + Math.floor(num_rays) + ' (use U + J to change)' +
        '\nCone Size: ' + cone_size + ' (use Y + H to change)' +
        '\nRandomize Shapes: Spacebar' +
        '\nRects: ' + Math.floor(num_rects) + ' (use I + K to change' +
        '\nCircles: ' + Math.floor(num_circles) + ' (use O + L to change');

    redraw();
}

function redraw() {
    graphics.clear();

    var rays = [];
    var render = [];
    const maxDist = Math.sqrt(Math.pow(screenWidth, 2) + Math.pow(screenHeight, 2));
    const rayCount = Math.floor(num_rays);

    const targetAngle = Phaser.Math.Angle.BetweenPoints(center, target);
    const coneSizeRads = cone_size * Math.PI;
    // Generate Rays
    for (var i = 0; i < rayCount; i++) {
        const angle = (coneSizeRads / rayCount * i) + targetAngle - coneSizeRads / 2;
        const dist = maxDist;
        const endPoint = new Phaser.Geom.Point(Math.cos(angle) * dist + center.x, Math.sin(angle) * dist + center.y);
        var ray = new Phaser.Geom.Line(center.x, center.y, endPoint.x, endPoint.y);

        rays.push(ray);
    }

    const light_falloff_dist = 800;
    const lightness_clamp = 0.5
    // Update each ray's endpoint to its closest intersection (if one exists)
    rays.forEach((ray, i) => {
        var ray_color = 0x0;

        // TODO: Avoid repeating code here
        rects.forEach(({ shape, color }) => {
            const rect = shape;
            var intersections = Phaser.Geom.Intersects.GetLineToRectangle(ray, rect);
            if (intersections.length > 0) {
                var closest = intersections.reduce(function (a, b) {
                    distA = Phaser.Math.Distance.BetweenPoints(center, a);
                    distB = Phaser.Math.Distance.BetweenPoints(center, b);
                    return distA > distB ? b : a;
                });
                ray.setTo(center.x, center.y, closest.x, closest.y);

                dist = Phaser.Math.Distance.BetweenPoints(center, closest);
                ratio = Phaser.Math.Clamp(2 * (dist / light_falloff_dist) - 1, -1 * lightness_clamp, 1);

                ray_color =
                    ratio == 1 ?
                        0x0 :
                        color.clone().darken(Math.floor(100 * ratio)).color;
            }
        });

        circles.forEach(({ shape, color }) => {
            const circle = shape;
            var intersections = Phaser.Geom.Intersects.GetLineToCircle(ray, circle);
            if (intersections.length > 0) {
                var closest = intersections.reduce(function (a, b) {
                    distA = Phaser.Math.Distance.BetweenPoints(center, a);
                    distB = Phaser.Math.Distance.BetweenPoints(center, b);
                    return distA > distB ? b : a;
                });
                ray.setTo(center.x, center.y, closest.x, closest.y);

                dist = Phaser.Math.Distance.BetweenPoints(center, closest);
                ratio = Phaser.Math.Clamp(2 * (dist / light_falloff_dist) - 1, -1 * lightness_clamp, 1);

                ray_color =
                    ratio == 1 ?
                        0x0 :
                        color.clone().darken(Math.floor(100 * ratio)).color;
            }
        });

        render[i] = ray_color;
    });

    graphics.lineStyle(line_width, 0xffffff);
    rays.forEach(ray => graphics.strokeLineShape(ray));

    rects.forEach(({ shape, color }) => {
        graphics.lineStyle(line_width, color.color);
        graphics.strokeRectShape(shape);
    });

    graphics.lineStyle(line_width, 0xffffff);
    circles.forEach(({ shape, color }) => {
        graphics.lineStyle(line_width, color.color);
        graphics.strokeCircleShape(shape);
    });

    graphics.fillStyle(0x00ff00);
    graphics.fillCircle(center.x, center.y, 10);

    graphics.fillStyle(0x0000ff);
    graphics.fillCircle(target.x, target.y, 10);

    graphics.lineStyle(10, 0xff0000);
    graphics.strokeRect(screenWidth - render.length, screenHeight - 200, render.length, 200);

    render.forEach((pixel, i) => {
        const xPos = screenWidth - render.length + i;
        graphics.lineStyle(1, pixel);
        graphics.lineBetween(xPos, screenHeight - 200, xPos, screenHeight);
    });
}
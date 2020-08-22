"use strict";

// Ray Tracing experiment
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;
var num_rays = 200;
var num_rects = 5;
var num_circles = 5;
var lineWidth = 3;
var speed = 10;
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
    update: update
  }
};
var game = new Phaser.Game(config);
var rects = [];
var circles = [];
var center, debug_txt;
var graphics;

function preload() {}

function create() {
  graphics = this.add.graphics();
  this.cameras.main.setBackgroundColor(0x0);

  for (var i = 0; i < num_rects; i++) {
    var width = Math.floor(Math.pow(Math.random(), 3) * 251 + 100);
    var height = Math.floor(Math.pow(Math.random(), 3) * 251 + 100);
    var x = Math.floor(Math.random() * (screenWidth - width));
    var y = Math.floor(Math.random() * (screenHeight - height));
    var rect = new Phaser.Geom.Rectangle(x, y, width, height);
    rects.push(rect);
  }

  for (var i = 0; i < num_circles; i++) {
    var radius = Math.floor(Math.pow(Math.random(), 3) * 251 + 100);
    var x = Math.floor(Math.random() * (screenWidth - radius));
    var y = Math.floor(Math.random() * (screenHeight - radius));
    var circle = new Phaser.Geom.Circle(x, y, radius);
    circles.push(circle);
  }

  center = new Phaser.Geom.Point(this.cameras.main.centerX, this.cameras.main.centerY);
  debug_txt = this.add.text(10, 10, 'hello there', {
    color: '#ddd'
  });
  this.input.on('pointermove', function (pointer) {
    center.setTo(pointer.x, pointer.y);
  });
  this.input.keyboard.on('keyup-' + 'W', function (event) {
    num_rays *= 2;
  });
  this.input.keyboard.on('keyup-' + 'S', function (event) {
    num_rays = num_rays < 1 ? 0.5 : num_rays / 2;
  });
}

function update() {
  var cursors = this.input.keyboard.createCursorKeys();

  if (cursors.right.isDown) {
    center.setTo(center.x + speed, center.y);
  }

  if (cursors.left.isDown) {
    center.setTo(center.x - speed, center.y);
  }

  if (cursors.up.isDown) {
    center.setTo(center.x, center.y - speed);
  }

  if (cursors.down.isDown) {
    center.setTo(center.x, center.y + speed);
  }

  debug_txt.setText('Rays: ' + Math.floor(num_rays) + ' (use W + S to change)');
  render();
}

function render() {
  graphics.clear();
  var lines = [];
  var maxDist = Math.sqrt(Math.pow(screenWidth, 2) + Math.pow(screenHeight, 2));
  var rayCount = Math.floor(num_rays);

  for (var i = 0; i < rayCount; i++) {
    var angle = 2.0 * Math.PI / rayCount * i;
    var dist = maxDist;
    var endPoint = new Phaser.Geom.Point(Math.cos(angle) * dist + center.x, Math.sin(angle) * dist + center.y);
    var ray = new Phaser.Geom.Line(center.x, center.y, endPoint.x, endPoint.y);
    lines.push(ray);
  }

  lines.forEach(function (line) {
    line.setTo(center.x, center.y, line.x2, line.y2); // TODO: Avoid repeating code here

    rects.forEach(function (rect) {
      var intersections = Phaser.Geom.Intersects.GetLineToRectangle(line, rect);

      if (intersections.length > 0) {
        var closest = intersections.reduce(function (a, b) {
          distA = Phaser.Math.Distance.BetweenPoints(center, a);
          distB = Phaser.Math.Distance.BetweenPoints(center, b);
          return distA > distB ? b : a;
        });
        line.setTo(center.x, center.y, closest.x, closest.y);
      }
    });
    circles.forEach(function (circle) {
      var intersections = Phaser.Geom.Intersects.GetLineToCircle(line, circle);

      if (intersections.length > 0) {
        var closest = intersections.reduce(function (a, b) {
          distA = Phaser.Math.Distance.BetweenPoints(center, a);
          distB = Phaser.Math.Distance.BetweenPoints(center, b);
          return distA > distB ? b : a;
        });
        line.setTo(center.x, center.y, closest.x, closest.y);
      }
    });
  });
  graphics.lineStyle(lineWidth, 0xffffff);
  lines.forEach(function (ray) {
    return graphics.strokeLineShape(ray);
  });
  graphics.lineStyle(lineWidth, 0xffffff);
  rects.forEach(function (rect) {
    return graphics.strokeRectShape(rect);
  });
  graphics.lineStyle(lineWidth, 0xffffff);
  circles.forEach(function (circle) {
    return graphics.strokeCircleShape(circle);
  });
  graphics.fillStyle(0x0000ff, 1);
  graphics.fillCircle(center.x, center.y, 10);
}
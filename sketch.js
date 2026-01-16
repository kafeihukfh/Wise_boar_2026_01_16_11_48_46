// Stage Light Particles (p5.js)
// Mouse = spotlight position
// Click = ripple pulse
// Keys: [1]/[2] change mode, [C] clear, [S] save image

let particles = [];
let ripples = [];
let mode = 1;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  noStroke();

  // start with a soft background layer
  background(0);

  // create particles
  const N = 900;
  for (let i = 0; i < N; i++) {
    particles.push(new Particle(random(width), random(height)));
  }
}

function draw() {
  // trail / motion blur background
  fill(0, 24);
  rect(0, 0, width, height);

  // spotlight core + halo
  drawSpotlight(mouseX, mouseY);

  // update ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].update();
    ripples[i].display();
    if (ripples[i].dead) ripples.splice(i, 1);
  }

  // update particles
  for (let p of particles) {
    p.update();
    p.display();
  }

  drawHUD();
}

function drawSpotlight(x, y) {
  // halo
  blendMode(ADD);
  for (let r = 220; r > 0; r -= 22) {
    const a = map(r, 220, 0, 10, 85);
    fill(255, 220, 120, a);
    circle(x, y, r);
  }
  // core
  fill(255, 250, 230, 160);
  circle(x, y, 36);
  blendMode(BLEND);
}

function mousePressed() {
  ripples.push(new Ripple(mouseX, mouseY));
}

function keyPressed() {
  if (key === '1') mode = 1;
  if (key === '2') mode = 2;
  if (key === 'c' || key === 'C') background(0);
  if (key === 's' || key === 'S') saveCanvas('stage-light', 'png');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);
}

// ---------- Classes ----------

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(0.2, 1.2));
    this.baseSpeed = random(0.6, 1.9);
    this.seed = random(1000);
    this.size = random(1.2, 3.2);
  }

  update() {
    // flow field via noise
    const t = frameCount * 0.0035;
    const n = noise(this.pos.x * 0.0022, this.pos.y * 0.0022, this.seed + t);
    const ang = n * TWO_PI * 3.2;

    let flow = p5.Vector.fromAngle(ang);

    // spotlight attraction
    let toLight = createVector(mouseX, mouseY).sub(this.pos);
    let d = toLight.mag();
    toLight.normalize();

    // mode 1: gentle pull; mode 2: stronger, more "stage energy"
    let pull = (mode === 1) ? 1.2 : 2.4;
    let falloff = constrain(map(d, 20, 500, 1.0, 0.0), 0, 1);

    let acc = flow.mult(0.35);
    acc.add(toLight.mult(pull * falloff));

    // ripple push (particles get a kick when ripple passes)
    for (let r of ripples) {
      const rd = dist(this.pos.x, this.pos.y, r.pos.x, r.pos.y);
      const band = abs(rd - r.radius);
      if (band < 18) {
        let kick = createVector(this.pos.x - r.pos.x, this.pos.y - r.pos.y);
        kick.normalize();
        kick.mult(map(band, 18, 0, 0.2, 1.2) * (mode === 1 ? 0.35 : 0.7));
        acc.add(kick);
      }
    }

    this.vel.add(acc);
    this.vel.limit(this.baseSpeed + (mode === 2 ? 1.2 : 0.6));
    this.pos.add(this.vel);

    // wrap edges
    if (this.pos.x < -10) this.pos.x = width + 10;
    if (this.pos.x > width + 10) this.pos.x = -10;
    if (this.pos.y < -10) this.pos.y = height + 10;
    if (this.pos.y > height + 10) this.pos.y = -10;
  }

  display() {
    // brightness based on distance to spotlight
    const d = dist(this.pos.x, this.pos.y, mouseX, mouseY);
    const glow = constrain(map(d, 520, 0, 0, 255), 0, 255);

    // slight warm stage color
    const r = 200 + glow * 0.18;
    const g = 140 + glow * 0.22;
    const b = 90 + glow * 0.10;

    blendMode(ADD);
    fill(r, g, b, 35);
    circle(this.pos.x, this.pos.y, this.size * 2.2);
    fill(255, 245, 220, 40);
    circle(this.pos.x, this.pos.y, this.size);
    blendMode(BLEND);
  }
}

class Ripple {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.radius = 0;
    this.speed = random(6.0, 10.5);
    this.life = 255;
    this.dead = false;
  }

  update() {
    this.radius += this.speed;
    this.life -= 3.2;
    if (this.life <= 0) this.dead = true;
  }

  display() {
    blendMode(ADD);
    noFill();
    stroke(255, 220, 150, this.life * 0.6);
    strokeWeight(2);
    circle(this.pos.x, this.pos.y, this.radius * 2);

    stroke(255, 255, 255, this.life * 0.15);
    strokeWeight(8);
    circle(this.pos.x, this.pos.y, this.radius * 2);

    noStroke();
    blendMode(BLEND);
  }
}

function drawHUD() {
  // minimal instructions
  fill(255, 180);
  textSize(13);
  textAlign(LEFT, TOP);
  text(
    `Stage Light Particles
Mouse: spotlight   Click: ripple
[1]/[2] mode  |  [C] clear  |  [S] save`,
    14, 14
  );

  // mode label
  fill(255, 120);
  text(`Mode: ${mode === 1 ? "Soft Pull" : "High Energy"}`, 14, 70);
}

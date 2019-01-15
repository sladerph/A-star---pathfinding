var screen_w = 1500;
var screen_h = 650;
var grid = [];
var grid_w;
var grid_h;
var grid_s = 20;

var closed_set = new Array(); // Already evaluated.
var open = new Array(); // Known but not evaluated yet.

var obstacle_rate = 25; // Percentage of obstacles.

var start_x = 0;
var start_y = 0;
var end_x;
var end_y;

var done = false;

function setup() {
  createCanvas(screen_w, screen_h);
  grid_w = floor(screen_w / grid_s);
  grid_h = floor(screen_h / grid_s);

  createGrid();

  start_x = floor(random(grid_w));
  start_y = floor(random(grid_h));

  end_x = start_x;
  end_y = start_y;
  while (end_x == start_x || end_y == start_y) {
    end_x = floor(random(grid_w));
    end_y = floor(random(grid_h));
  }
  //end_x = grid_w - 1;
  //end_y = grid_h - 1;
  var start = grid[index(start_x, start_y)];
  start.gscore = 0;
  start.evaluateHeuristic();
  start.calculateCost();
  open.push(start);
  
  createObstacles();
  
  //frameRate(5);
}

function draw() {
  background(255);

  for (var y = 0; y < grid_h; y++) {
    for (var x = 0; x < grid_w; x++) {
      var c = grid[index(x, y)];
      if (c) {
        stroke(0);
        fill(255);
        if (cellIsInArray(c, open)) {
          fill(0, 255, 0, 100);
        }
        if (cellIsInArray(c, closed_set)) {
          fill(255, 0, 0, 100);
        }
        if (c.final) {
          fill(255, 255, 0);
        }
        if (c.obstacle) {
          fill(0);
        }
        if (c.x == start_x && c.y == start_y) {
          fill(128, 128, 255);
        }
        if (c.x == end_x && c.y == end_y) {
          fill(255, 0, 0);
        }
        rect(c.x * grid_s, c.y * grid_s, grid_s, grid_s);
      }
    }
  }

  if (open.length > 0 && !done) {
    var ci = selectBestCell(open);
    var cell = open[ci];
    open.splice(ci, 1);
    if (cell.x == end_x && cell.y == end_y) {
      reconstructPath(cell);
      done = true;
    }

    cell.current = true;
    fill(0, 0, 255, 128);
    rect(cell.x * grid_s, cell.y * grid_s, grid_s, grid_s);

    n = findNeighbors(cell);
    for (var i = 0; i < n.length; i++) {
      var next = n[i];
      var cost = cell.gscore + floor(manhattanDistance(cell.x, cell.y, next.x, next.y)) + floor(manhattanDistance(next.x, next.y, end_x, end_y));

      var ok = true;
      for (var j in closed_set) {
        if (closed_set[j] == next && closed_set[j].cost <= cost) {
          ok = false;
        }
      }
      if (!ok) {
        continue;
      }
      for (var j = 0; j < open.length; j++) {
        if (open[j] == next && open[j].cost <= cost) {
          ok = false;
        }
      }
      if (!ok) {
        continue;
      }

      next.evaluateHeuristic();
      next.gscore = cell.gscore + floor(manhattanDistance(cell.x, cell.y, next.x, next.y));
      next.calculateCost();
      next.cameFrom = cell;
      open.push(next);
    }
    cell.current = false;
    closed_set.push(cell);
  }
}

function Node(x, y, cost, heuristic) {
  this.x = x;
  this.y = y;
  this.gscore = 0;
  this.current = false;
  this.final = false;
  this.cameFrom;
  this.obstacle = false;

  if (cost) {
    this.cost = cost;
  } else {
    this.cost = 0;
  }
  if (heuristic) {
    this.heuristic = heuristic;
  } else {
    this.heuristic = 0;
  }

  this.evaluateHeuristic = function() {
    this.heuristic = floor(manhattanDistance(this.x, this.y, end_x, end_y));
  }
  this.calculateCost = function() {
    this.cost = this.gscore + this.heuristic;
  }
}

function reconstructPath(cell) {
  var i = 0;
  while(cell.x != start_x || cell.y != start_y) {
    cell.final = true;
    cell = cell.cameFrom;
    if (i >= 10000) {
      alert("Too many iterations ! Emergency exit !");
      break;
    }
    i++;
  }
}

function findNeighbors(node) {
  var n = [];
  var c = grid[index(node.x - 1, node.y)];
  if (c && !c.obstacle) {
    n.push(c);
  }
  c = grid[index(node.x + 1, node.y)];
  if (c && !c.obstacle) {
    n.push(c);
  }
  c = grid[index(node.x, node.y - 1)];
  if (c && !c.obstacle) {
    n.push(c);
  }
  c = grid[index(node.x, node.y + 1)];
  if (c && !c.obstacle) {
    n.push(c);
  }
  return n;
}

function index(x, y) {
  if (x < 0 || y < 0 || x > grid_w - 1 || y > grid_h - 1) {
    return -1;
  }
  return x + y * grid_w;
}

function createGrid() {
  for (var y = 0; y < grid_h; y++) {
    for (var x = 0; x < grid_w; x++) {
      grid[index(x, y)] = new Node(x, y);
    }
  }
}

function cellIsInArray(cell, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (cell == arr[i]) {
      return true;
    }
  }
  return false;
}

function manhattanDistance(ax, ay, bx, by) {
  return abs(bx - ax) + abs(by - ay);
}

function selectBestCell(open) {
  var best = 0;
  for (var c in open) {
    if (open[c].cost < open[best].cost) {
      best = c;
    }
  }
  return best;
}

function createObstacles() {
  var nb = (grid_w * grid_h * obstacle_rate) / 100;
  var i;
  
  while (nb > 0) {
    var cell = grid[floor(random(grid_w * grid_h))];
    
    if (!cell.obstacle) {
      if (cell.x == start_x && cell.y == start_y) {
        continue;
      }
      if (cell.x == end_x && cell.y == end_y) {
        continue;
      }
      cell.obstacle = true;
      nb--;
    }
    
    if (i > 10000) {
      alert("Too many iterations ! Exiting loop...");
      break;
    }
    i++;
  }
}

// LOL.
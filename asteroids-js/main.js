//frames per sec
const FPS = 30;
const FRICTION = 0.7; //f coeff 0-1
const SHIP_SIZE = 30;//height of ship in px
const N_ASTEROIDS = 3;//initial num of aster
const TURN_SPEED = 360; // turn speed(deg/s)
const SPEED = 5; //accel
const ROIDS_SIZE = 100; // max init size(px)
const ROIDS_SPD = 50; //max init speed(px/s)
const ROIDS_VERT = 10; //avg num of sides on each asteroids
const ROIDS_JAG = 0.3;//jaggedness of asteroids 0 = no 1 = many

const INVINCIBILITY_DUR = 3;//ship will be impervious to crashes for the alloted time
const BLINK_DUR = 0.1;
const SHIP_EXPLODE_DUR = 0.3; // duration of ship explosion
const LASER_MAX = 10; //max num of lasers on screen at once
const LASER_SPD = 500; //speed of laser, px/s
//Query Select the canvas
const LASER_DIST = 0.6; //max dist of laser
const LASER_EXPLODE_DUR = 0.1; // duration of laser explosion
const TEXT_FADE_TIME = 2.5;
const TEXT_SIZE = 40;//text font size
const GAME_LIVES = 3; //initial lives
const ROID_PTS_LGE = 20;//points for destroying a large asteroid
const ROID_PTS_MED = 50;//points for destroying a medium asteroid
const ROID_PTS_SML = 100;//points for destroying a small asteroid
const SAVE_HS_KEY = "hi-score";//save key of local high score storage

let canv = document.querySelector(".gameCanvas");
let ctx = canv.getContext("2d");

//set up parameters
let level,lives,asteroids,ship,text,textAlpha,score, highScore;
newGame();




//event listener
document.addEventListener("keydown",keyDown);
document.addEventListener("keyup",keyUp);

//loop
setInterval(update, 1000 / FPS);

//create asteroids belt
function createBelt(){
  asteroids = [];
  let x,y;
  //loop num of aste
  for(let i = 0; i < N_ASTEROIDS + level;i++){
    do{
      x = Math.floor(Math.random() * canv.width);
      y = Math.floor(Math.random() * canv.height);

    } while(distBetweenPoints(ship.x,ship.y,x,y) < ROIDS_SIZE * 2 + ship.r);//only draw when asteroids are at a distance from the ship
    
    asteroids.push(newAsteroid(x,y, Math.ceil(ROIDS_SIZE / 2)));
  }
}

//destroy asteroid function
function destroyAsteroid(index){
  //grab props
  let x = asteroids[index].x;
  let y = asteroids[index].y;
  let r = asteroids[index].r;

  //split asteroids to two(when big/original size)
  if(r == Math.ceil(ROIDS_SIZE / 2)){
    asteroids.push(newAsteroid(x,y, Math.ceil(ROIDS_SIZE / 4)));
    asteroids.push(newAsteroid(x,y, Math.ceil(ROIDS_SIZE / 4)));
    score += ROID_PTS_LGE;
  }else if (r == Math.ceil(ROIDS_SIZE / 4)){
    asteroids.push(newAsteroid(x,y, Math.ceil(ROIDS_SIZE / 8)));
    asteroids.push(newAsteroid(x,y, Math.ceil(ROIDS_SIZE / 8)));
    score+= ROID_PTS_MED;
  }else{
    score+= ROID_PTS_SML;
  }
  //check high score
  if(score > highScore){
    highScore = score;
    localStorage.setItem(SAVE_HS_KEY,highScore);
  }

  //destroyy
  asteroids.splice(index,1);
  //newLevel when all destroyed
  if(asteroids.length == 0){
    level++;
    newLevel();
  }

}

//euclidean distance between th
function distBetweenPoints(x1,y1,x2,y2){
 return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2))
}


function drawShip(x,y,a, color = "white"){
  ctx.strokeStyle = color;
  ctx.lineWidth = SHIP_SIZE / 20;
  ctx.beginPath();
  ctx.moveTo( //ship - front
  x + 4/3 * ship.r * Math.cos(a),
  y - 4/3 * ship.r * Math.sin(a)
  );
  ctx.lineTo( //left-back of ship
  x - ship.r * (2/3*Math.cos(a) + Math.sin(a)),
  y + ship.r * (2/3*Math.sin(a) - Math.cos(a))

  );
  ctx.lineTo( //right-back of ship
  x - ship.r * (2/3* Math.cos(a) - Math.sin(a)),
  y + ship.r * (2/3* Math.sin(a) + Math.cos(a))

  );
  ctx.closePath();
  ctx.stroke();
}
function explodeShip(){
  ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
}
function gameOver(){
  ship.dead = true;
  text = "Game Over";
  textAlpha = 1.0;
}



//key down(pressed)
function keyDown(e){
  if(ship.dead){
    return;
  }
  switch(e.keyCode){
    case 32://space bar, shoot laser
      shootLaser();
      break;
    case 37://left arrow, rotate left
      ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
      break;
    case 38:
      ship.forward = true;//up arrow
      break;
    case 39:
      ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;//rotate right
      break;    
  }

}
//keyup key released
function keyUp(e){
  if(ship.dead){
    return;
  }
  switch(e.keyCode){
    case 32://space bar released, can shoot, system is semi-auto
      ship.canShoot = true;
      break;
    case 37://left arrow released
      ship.rot = 0;

      break;
    case 38://up released, stop forward
      ship.forward = false;
      break;
    case 39:
      ship.rot = 0;//right arrow released
      break;    
  }


}

function newAsteroid(x,y,r){
  let lvlMult = 1 + 0.1 * level
  let roid = {
    x: x,
    y: y,
    xv: Math.random() * ROIDS_SPD * lvlMult / FPS *(Math.random() < 0.5 ? 1 : -1),
    yv: Math.random() * ROIDS_SPD * lvlMult / FPS *(Math.random() < 0.5 ? 1 : -1),
    r: r,
    a: Math.random() * Math.PI * 2,//rad
    vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
    offs: []


  };
  //create the vertex offsets array
  for(let i = 0 ; i < roid.vert;i++){
    roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
  }
  return roid;
}


function newGame(){
  //Ship Object
  level = 0;
  lives = GAME_LIVES;
  ship = newShip();
  score = 0;

  //get hs from storage
  let scoreKey = localStorage.getItem(SAVE_HS_KEY);
  if(scoreKey == null){
    highScore = 0;
  }else{
    highScore = parseInt(scoreKey);
  }
  //setup asteroids
  //let asteroids = [];
  newLevel();
  //createBelt();
}
function newLevel(){
  text = "Level " + (level + 1);
  textAlpha = 1.0;
  createBelt();
}





function newShip(){
  return{
    x: canv.width / 2,
    y: canv.height / 2,
    r: SHIP_SIZE / 2,
    a: Math.PI / 2,
    canShoot: true,
    explodeTime: 0,
    blinkNum: Math.ceil(INVINCIBILITY_DUR/BLINK_DUR),
    blinkTime: Math.ceil(BLINK_DUR * FPS),
    lasers: [],
    rot: 0,
    forward: false,
    dead: false,
    forw:{
      x:0,
      y:0
    }
  }
}

function shootLaser(){
  //create laser object
  if(ship.canShoot && ship.lasers.length < LASER_MAX){
    ship.lasers.push({
      x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
      y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
      xv: LASER_SPD * Math.cos(ship.a)/FPS,
      yv: -LASER_SPD * Math.sin(ship.a)/FPS,
      dist: 0,
      explodeTime: 0
    });
  }
  //stop shooting
  ship.canShoot = false;
}

function update(){
  let blinkOn = ship.blinkNum % 2 == 0;
  //if greater than 0 ship is exploding
  let exploding = ship.explodeTime > 0;
  //generate space
  ctx.fillStyle = "black";
  ctx.fillRect(0,0,canv.width,canv.height);

  //forward or boost
  if(ship.forward && !ship.dead){
    ship.forw.x += SPEED * Math.cos(ship.a) / FPS;
    ship.forw.y -= SPEED * Math.sin(ship.a) / FPS;
    //draw the exhaust
    if(!exploding && blinkOn){
      ctx.fillStyle = "red"
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = SHIP_SIZE / 10;
      ctx.beginPath();
      ctx.moveTo( //rear left
        ship.x - ship.r * (2/3*Math.cos(ship.a) + 1/2*Math.sin(ship.a)),
        ship.y + ship.r * (2/3*Math.sin(ship.a) - 1/2*Math.cos(ship.a))
      );
      ctx.lineTo( //rear mid
        ship.x - ship.r * (5/3*Math.cos(ship.a)),
        ship.y + ship.r * (5/3*Math.sin(ship.a))

      );
      ctx.lineTo( //right-back of ship
        ship.x - ship.r * (2/3* Math.cos(ship.a) - 1/2* Math.sin(ship.a)),
        ship.y + ship.r * (2/3* Math.sin(ship.a) + 1/2* Math.cos(ship.a))

      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else { // frict in play
    ship.forw.x -= FRICTION * ship.forw.x / FPS;
    ship.forw.y -= FRICTION * ship.forw.y / FPS;

  }

  //generate ship shpe is triagle
  if(!exploding){
      if(blinkOn && !ship.dead ){
        drawShip(ship.x,ship.y,ship.a);
        // ctx.strokeStyle = "white";
        // ctx.lineWidth = SHIP_SIZE / 20;
        // ctx.beginPath();
        // ctx.moveTo( //ship - front
        // ship.x + 4/3 * ship.r * Math.cos(ship.a),
        // ship.y - 4/3 * ship.r * Math.sin(ship.a)
        // );
        // ctx.lineTo( //left-back of ship
        // ship.x - ship.r * (2/3*Math.cos(ship.a) + Math.sin(ship.a)),
        // ship.y + ship.r * (2/3*Math.sin(ship.a) - Math.cos(ship.a))
  
        // );
        // ctx.lineTo( //right-back of ship
        // ship.x - ship.r * (2/3* Math.cos(ship.a) - Math.sin(ship.a)),
        // ship.y + ship.r * (2/3* Math.sin(ship.a) + Math.cos(ship.a))
  
        // );
        // ctx.closePath();
        // ctx.stroke();
      }

      //handle blinking
      if(ship.blinkNum > 0){
        //reduce blink time
        ship.blinkTime--;
        //reduce blink num
        if(ship.blinkTime == 0){
          ship.blinkTime = Math.ceil(BLINK_DUR * FPS);
          ship.blinkNum--;
        }
      }

  }else{
    //draw explosion
    ctx.fillStyle = 'darkred';
    ctx.beginPath();
    ctx.arc(ship.x,ship.y,ship.r * 1.7,0,Math.PI*2,false);
    ctx.fill();
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(ship.x,ship.y,ship.r * 1.4,0,Math.PI*2,false);
    ctx.fill();
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.arc(ship.x,ship.y,ship.r * 1.1,0,Math.PI*2,false);
    ctx.fill();
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(ship.x,ship.y,ship.r * 0.8,0,Math.PI*2,false);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(ship.x,ship.y,ship.r * 0.5,0,Math.PI*2,false);
    ctx.fill();
  }
  

  
  //draw laser
  for(let i = 0; i < ship.lasers.length; i++){
    
    if(ship.lasers[i].explodeTime == 0){
      ctx.fillStyle = "salmon";
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x,ship.lasers[i].y,SHIP_SIZE / 15,0,Math.PI * 2,false);
      ctx.fill();
    }else{
      //draw expl
      ctx.fillStyle = "orangered";
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x,ship.lasers[i].y,ship.r * 0.75,0,Math.PI * 2,false);
      ctx.fill();
      ctx.fillStyle = "salmon";
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x,ship.lasers[i].y,ship.r * 0.5,0,Math.PI * 2,false);
      ctx.fill(); 
      ctx.fillStyle = "pink";
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x,ship.lasers[i].y,ship.r * 0.25,0,Math.PI * 2,false);
      ctx.fill(); 
            
    }
    
  }
  //draw game text
  if(textAlpha >= 0){
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255," + textAlpha + ")";
    ctx.font = "small-caps" + TEXT_SIZE + "px devaju sans mono";
    ctx.fillText(text,canv.width/2,canv.height * 0.75);
    textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);

  } else if(ship.dead){
    //After the gameover fades, restart game
    newGame();
  }

  //draw lives
  let lifeColour;
  for(let i = 0; i < lives; i++){
    lifeColour = exploding && i == lives - 1 ? "red" : "white";
    drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2,SHIP_SIZE, Math.PI/2,lifeColour);
  }
  //draw score
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = TEXT_SIZE + "px devaju sans mono";
  ctx.fillText(score,canv.width - SHIP_SIZE / 2,SHIP_SIZE);
  
  //draw high score
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = (TEXT_SIZE * 0.75) + "px devaju sans mono";
  ctx.fillText("Hi " + highScore,canv.width - canv.width / 2,SHIP_SIZE);


  //detect laser hit asteroids
  let ax,ay,ar,lx,ly;
  for(let i = asteroids.length - 1 ; i >= 0; i--){
    //grab the asteroid props
    ax = asteroids[i].x;
    ay = asteroids[i].y;
    ar = asteroids[i].r;

    //loop over the lasers
    for(let j = ship.lasers.length - 1; j >=0;j--){

      //get laser props
      lx = ship.lasers[j].x;
      ly = ship.lasers[j].y;

      //detect hits
      if(ship.lasers[j].explodeTime==0 &&distBetweenPoints(ax,ay,lx,ly) < ar){
        //remove lasers
        //ship.lasers.splice(j,1);
        //destroy asteroids and activate       
        destroyAsteroid(i);
        ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS);
        break;
      }
    }
  }
  

  //generate asteroids
  
  let x,y,r,a,vert,offs;
  for(let i = 0; i<asteroids.length;i++){
    ctx.strokeStyle = "slategrey";
    ctx.lineWidth = SHIP_SIZE / 20;

    //get asteroids properties
    x = asteroids[i].x;
    y = asteroids[i].y;
    r = asteroids[i].r;
    a = asteroids[i].a;
    vert = asteroids[i].vert;
    offs = asteroids[i].offs;


    //draw a path
    ctx.beginPath();
    ctx.moveTo(
      x + r * offs[0] * Math.cos(a),
      y + r * offs[0]*Math.sin(a)
    );

    //draw polygon
    for(let j = 1; j < vert; j++){
      ctx.lineTo(
        x + r * offs[j]*Math.cos(a + j * Math.PI * 2 / vert),
        y + r * offs[j]*Math.sin(a + j * Math.PI * 2 / vert),
      );

    }
    ctx.closePath();
    ctx.stroke();
    
  }
  

  //check for asteroid collisions with ship
  if(!exploding){
    if(ship.blinkNum == 0 && !ship.dead){
      for(let i = 0; i < asteroids.length;i++){
        if(distBetweenPoints(ship.x,ship.y,asteroids[i].x,asteroids[i].y) < asteroids[i].r + ship.r ){
          explodeShip();
          destroyAsteroid(i);
          break;
        }
      }
    }

    //rotate ship
    ship.a += ship.rot;
    //move ship
    ship.x += ship.forw.x;
    ship.y += ship.forw.y;
  }else{
    ship.explodeTime--;


      if(ship.explodeTime == 0){
        lives--;
        if(lives == 0){
          gameOver();
        } else {
          ship = newShip();
        }
        
      }
  }
  //safe area
  if(ship.x< 0 - ship.r){//far left
    ship.x = canv.width + ship.r;

  }else if(ship.x > canv.width + ship.r){//far right
    ship.x= 0 - ship.r;
  }
  if(ship.y < 0 - ship.r){//botton
    ship.y = canv.height + ship.r;

  }else if(ship.y > canv.height + ship.r){//top
    ship.y= 0 - ship.r;
  }

  //move lasers
  for(let i = ship.lasers.length - 1; i >= 0;i--){
    //check dist travveled
    
    if(ship.lasers[i].dist > LASER_DIST * canv.width){
      ship.lasers.splice(i,1);
      continue;
    }
    //explosion
    if(ship.lasers[i].explodeTime > 0){
      ship.lasers[i].explodeTime--;
      //destroy laser
      if(ship.lasers[i].explodeTime == 0){
        ship.lasers.splice(i,1);
        continue;
      }

    }else{
      //mve the laser
      ship.lasers[i].x += ship.lasers[i].xv;
      ship.lasers[i].y += ship.lasers[i].yv;

      //calculate dist traelle
      ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv,2)+Math.pow(ship.lasers[i].yv,2));

    }
    
    //handle safe area/edge o screen
    if(ship.lasers[i].x < 0){
      ship.lasers[i].x = canv.width;
    }else if(ship.lasers[i].x > canv.width){
      ship.lasers[i].x = 0;
    }

    if(ship.lasers[i].y < 0){
      ship.lasers[i].y = canv.height;
    }else if(ship.lasers[i].y > canv.height){
      ship.lasers[i].y = 0;
    }
  }
  //Move asteroids
  for(let i = 0; i < asteroids.length;i++){
    //move asteroid
    asteroids[i].x += asteroids[i].xv;
    asteroids[i].y += asteroids[i].yv;
    //manage edge of screen (asteroids going out the edge of screen)
    if(asteroids[i].x < 0 - asteroids[i].r){
      asteroids[i].x = canv.width + asteroids[i].r;
    }else if(asteroids[i].x > canv.width + asteroids[i].r){
      asteroids[i].x = 0 - asteroids[i].r;
    }
    if(asteroids[i].y < 0 - asteroids[i].r){
      asteroids[i].y = canv.height + asteroids[i].r;
    }else if(asteroids[i].y > canv.height + asteroids[i].r){
      asteroids[i].y = 0 - asteroids[i].r;
    }

  }





}
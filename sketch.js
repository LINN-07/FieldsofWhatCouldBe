//种地
// 麦田；绳状下垂（物理 重力 软堆）神经网络一样的白色病变（确保背景0）、循环、不可逆 + 自动刷新

let stalks = [];//麦子
let fungusRoots = [];//病变
let horizony;
let bgDark = 0;
let lastCycle = 0;
let cycleInterval = 25 * 1000;//循环事件/25秒

let permanentDead = [];//早割死亡不再生长
let windSound;//声效



//声音preload
function preload() {
  soundFormats('mp3');
  windSound = loadSound('bbcwind.mp3');
}


function setup() {
  createCanvas(windowWidth, windowHeight);//https://p5js.org/reference/p5/createCanvas/
  horizonY = height * 0.6;
  initField();//初始化麦田
  frameRate(60);//？/-/

  windSound.loop(); // 循环播放风声//https://p5js.org/reference/p5.sound/p5.SoundLoop/
  windSound.setVolume(0.5);//初始音量
}

function draw() { //aaaaaaaaaaaaaa
  background(0);
  stroke(lerp(255, 0, bgDark / 255));//白-黑
  strokeWeight(2);
  line(0, horizonY, width, horizonY);////地平线////

////////*声音的空间控制
  let distFromCenter = abs(mouseX - width / 2);
  let maxDist = width / 2;
  let vol = map(distFromCenter, 0, maxDist, 1, 0.1);
  let pan = map(mouseX, 0, width, -1, 1);

  windSound.setVolume(vol);
  windSound.pan(pan);


  for (let s of stalks) {
    s.grow();
    s.display();
  }

  updateFungus();

  // 条件刷新：定时或全部割掉//？
  let allCut = stalks.every(s => s.state === 'cut' || s.state === 'diseased');
  if (millis() - lastCycle > cycleInterval || allCut) {
    resetField();
    lastCycle = millis();

  }
}

function initField() {
  stalks = [];
  let count = 160;
  for (let i = 0; i < count; i++) {
    let x = map(i, 0, count - 1, width * 0.05, width * 0.95);
    let s = new Stalk(x);
    if (permanentDead[i]) {
      s.state = 'diseased';
      s.height = 0;
    }
    stalks.push(s);
  }

  // 病变
  fungusRoots = [];
  if (random() < 0.1) {
    let num = int(random(2, 5));//（随机数量）
    for (let i = 0; i < num; i++) {//执行一组操作


      //构建神经root
      let root = {
        x: random(width),
        y: horizonY, // 在地平线
        branches: []//发散式
      };
      for (let j = 0; j < 40; j++) {//每个根40个分支
        let angle = random(TWO_PI);//0-2pi的随机角度
        let r = random(10, 140);//大小，10-140像素

        //终点坐标！利用三角函数
        root.branches.push({
          x: root.x + cos(angle) * r,
          y: root.y + sin(angle) * r,
          age: random(30)//？
        });
      }
      fungusRoots.push(root);
    }
  }
}
//////麦子//？
//https://p5js.org/reference/p5/class/
//https://p5js.org/reference/p5/if/
//
          class Stalk {
  constructor(x) {
    this.x = x;
    this.baseY = horizonY;
    this.height = 0;
    this.maxH = 120;
    this.age = 0;
    this.state = 'growing';
    this.cutEarly = false;
    this.decay = 0;
    this.opacity = 255;
    this.cuttable = true;
    this.dropSegments = [];
    for (let i = 0; i < 10; i++) {
      this.dropSegments.push({ xoff: random(TWO_PI), y: 0 });
    }
  }

  ///////https://happycoding.io/tutorials/p5js/animation
  grow() {
    if (this.state === 'growing') {
      this.height = map(this.age, 0, sec2frame(20), 0, this.maxH, true);//20秒，1200
      if (this.age > sec2frame(20)) this.state = 'harvestable';//20秒
    } else if (this.state === 'harvestable' && this.age > sec2frame(25)) {//25秒内枯萎
      this.state = 'withered';
    }
//////////////////////////////////////
    if (this.state === 'cut') {
      for (let seg of this.dropSegments) {//下坠
        seg.y = min(seg.y + random(0.5, 1.5), 60);//重力模拟
      }
      this.opacity = max(this.opacity - 2, 0);//逐渐消失（透明度调整）
    }

    this.age++;//年龄up**
  }


  //曲线的那些东西///////////////////////////////
  display() {
    push();
    stroke(255, this.opacity);
    strokeWeight(1);
    let sway = sin(frameCount * 0.05 + this.x * 0.01) * PI / 60;
    let hover = dist(mouseX, mouseY, this.x, this.baseY - this.height) < 80 ? (mouseX - this.x) / 400 : 0;
    let ang = sway + hover;

    if (this.state !== 'cut' && this.state !== 'harvested') {
      let x2 = this.x + sin(ang) * this.height;
      let y2 = this.baseY - cos(ang) * this.height;
      line(this.x, this.baseY, x2, y2);
    } else if (this.state === 'cut') {
      beginShape();
      let x = this.x;
      let y = this.baseY;
      curveVertex(x, y); 
      curveVertex(x, y);
      
      for (let seg of this.dropSegments) {
        let dx = sin(seg.xoff + frameCount * 0.05) * 2; // 横向的扰动
        x += dx;
        y += seg.y / this.dropSegments.length; //！
        curveVertex(x, y);
      }
      
      curveVertex(x, y); // ！！！
      curveVertex(x, y);
      endShape();
      
      }
    }
  
  }



  //鼠标
  //点击播放mp3
function mousePressed() {
    userStartAudio(); // 
    if (windSound && !windSound.isplaying()) {//避免每次点击都播放/////////
      windSound.loop();
    }

}
  



function mouseReleased() {

}


//割麦子
//https://p5js.org/reference/p5/mouseDragged/
function mouseDragged() {
  for (let i = 0; i < stalks.length; i++) {
    let s = stalks[i];
    let d = dist(mouseX, mouseY, s.x, s.baseY - s.height);//麦子顶端与鼠标的距离
    if ((s.state === 'harvestable' || s.state === 'growing') && d < 20 && s.cuttable) {
      s.state = 'cut';
      s.cuttable = false;//防止多次切割
      if (s.age < sec2frame(20)) {
        s.cutEarly = true;//割早了，记录下来
        permanentDead[i] = true;//不再重生
      }
    }
  }
}










//？病变
function updateFungus() {
  noFill();
  stroke(255, 100);
  for (let f of fungusRoots) {
    for (let b of f.branches) {
      if (b.age > 0) b.age--;
      else {
        line(f.x, f.y, b.x, b.y);
        for (let s of stalks) {
          if (s.state !== 'diseased' && dist(s.x, s.baseY - s.height, b.x, b.y) < 20) {
            s.state = 'diseased';
          }
        }
      }
    }
  }
  bgDark = constrain(map(fungusRoots.length, 0, 10, 0, 255), 0, 255);
}











function sec2frame(sec) {
  return int(sec * 60);
}

function resetField() {
  bgDark = 0;
  if (permanentDead.length < stalks.length) {
    permanentDead = stalks.map(s => s.cutEarly || permanentDead[stalks.indexOf(s)]);
  }
  initField();
}









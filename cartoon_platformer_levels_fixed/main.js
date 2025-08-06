
const WIDTH = 800;
const HEIGHT = 600;

class Preload extends Phaser.Scene {
  constructor(){ super('Preload'); }
  preload() {
    const txt = this.add.text(WIDTH/2, HEIGHT/2, 'Загрузка...', { fontFamily:'Arial', fontSize: 28, color:'#fff'}).setOrigin(0.5);

    // Basic load/error diagnostics
    this.load.on('filecomplete', (key, type) => {
      console.log('[OK] loaded:', key, type);
    });
    this.load.on('loaderror', (file) => {
      console.error('[ERR] load error:', file ? file.key : '(unknown)');
      this.add.text(WIDTH/2, HEIGHT/2+40, 'Ошибка загрузки: ' + (file ? file.key : 'unknown'), {fontFamily:'Arial', fontSize:16, color:'#ff8080'}).setOrigin(0.5);
    });

    this.load.image('platform', 'assets/images/platform.png');
    this.load.image('coin', 'assets/images/coin.png');
    this.load.image('enemy', 'assets/images/enemy.png');
    this.load.image('flag', 'assets/images/flag.png');
    this.load.spritesheet('player', 'assets/images/player_sheet.png', { frameWidth: 32, frameHeight: 48 });

    this.load.image('bg1', 'assets/images/bg1.png');
    this.load.image('bg2', 'assets/images/bg2.png');
    this.load.image('bg3', 'assets/images/bg3.png');
  }
  create(){
    this.scene.start('Level1');
  }
}

class BaseLevel extends Phaser.Scene {
  constructor(key, bgKey, layout) {
    super(key);
    this.bgKey = bgKey;
    this.layout = layout;
    this.score = 0;
  }

  create() {
    this.add.image(WIDTH/2, HEIGHT/2, this.bgKey).setDepth(-1);
    this.physics.world.gravity.y = 900;

    this.platforms = this.physics.add.staticGroup();
    this.layout.platforms.forEach(p => {
      const tile = this.platforms.create(p.x, p.y, 'platform');
      tile.setScale(p.scaleX || 1, p.scaleY || 1).refreshBody();
    });

    this.player = this.physics.add.sprite(80, 450, 'player');
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);

    this.anims.create({ key: 'idle', frames: [ { key: 'player', frame: 0 } ], frameRate: 6 });
    this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });

    this.coins = this.physics.add.group({ allowGravity: false });
    this.layout.coins.forEach(c => { this.coins.create(c.x, c.y, 'coin'); });

    this.enemies = this.physics.add.group({ bounceX: 1, bounceY: 0, collideWorldBounds: true });
    this.layout.enemies.forEach(e => {
      const en = this.enemies.create(e.x, e.y, 'enemy');
      en.setVelocityX(e.vx || 60);
      en.body.setSize(26, 18).setOffset(3,12);
    });

    this.goal = this.physics.add.staticSprite(this.layout.goal.x, this.layout.goal.y, 'flag');

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.coins, this.platforms);

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.goal, this.tryFinish, null, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.scoreText = this.add.text(16,16, 'Монеты: 0', { fontFamily: 'Arial', fontSize: 22, color: '#ffffff' }).setScrollFactor(0);
    this.hintText = this.add.text(16,44, 'Собери все монеты и доберись до флага →', { fontFamily: 'Arial', fontSize: 18, color: '#ffffff' });

    // Camera follow (optional)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0,0,WIDTH,HEIGHT);
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    this.score += 1;
    this.scoreText.setText('Монеты: ' + this.score);
  }

  hitEnemy(player, enemy) {
    this.cameras.main.shake(200, 0.01);
    player.setVelocity(0,0);
    player.setX(80);
    player.setY(450);
  }

  tryFinish() {
    if (this.coins.countActive(true) === 0) {
      this.completeLevel();
    }
  }

  completeLevel() {
    this.add.rectangle(WIDTH/2, HEIGHT/2, 400, 140, 0x000000, 0.6).setDepth(10);
    this.add.text(WIDTH/2, HEIGHT/2, 'Уровень пройден!', { fontFamily:'Arial', fontSize: 28, color:'#fff'}).setOrigin(0.5).setDepth(11);
    this.time.delayedCall(800, () => this.scene.start(this.nextKey));
  }

  update() {
    const speed = 200;
    const jump = 380;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.anims.play('run', true);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.anims.play('run', true);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play('idle', true);
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-jump);
    }
  }
}

class Level1 extends BaseLevel {
  constructor() {
    super('Level1','bg1',{
      platforms: [
        {x:400,y:580},{x:150,y:480},{x:650,y:420},
        {x:300,y:340},{x:500,y:280},{x:200,y:220},{x:700,y:180}
      ],
      coins: [{x:150,y:440},{x:650,y:380},{x:300,y:300},{x:500,y:240},{x:200,y:180}],
      enemies: [{x:600,y:380,vx:70}],
      goal: {x:740,y:140}
    });
    this.nextKey = 'Level2';
  }
}
class Level2 extends BaseLevel {
  constructor() {
    super('Level2','bg2',{
      platforms: [
        {x:400,y:580},{x:250,y:500},{x:550,y:500},
        {x:150,y:400},{x:400,y:350},{x:650,y:300},{x:300,y:200},{x:550,y:160}
      ],
      coins: [{x:250,y:460},{x:550,y:460},{x:150,y:360},{x:400,y:310},{x:650,y:260},{x:300,y:160}],
      enemies: [{x:240,y:470,vx:90},{x:560,y:470,vx: -90}],
      goal: {x:560,y:120}
    });
    this.nextKey = 'Level3';
  }
}
class Level3 extends BaseLevel {
  constructor() {
    super('Level3','bg3',{
      platforms: [
        {x:400,y:580},{x:200,y:520},{x:600,y:520},
        {x:100,y:420},{x:300,y:360},{x:500,y:300},{x:700,y:240},
        {x:400,y:180},{x:620,y:140}
      ],
      coins: [{x:200,y:480},{x:600,y:480},{x:100,y:380},{x:300,y:320},{x:500,y:260},{x:700,y:200},{x:400,y:140}],
      enemies: [{x:190,y:490,vx:100},{x:610,y:490,vx:-110},{x:500,y:260,vx:120}],
      goal: {x:620,y:100}
    });
    this.nextKey = 'Win';
  }
}
class Win extends Phaser.Scene {
  constructor(){ super('Win'); }
  create() {
    this.add.image(WIDTH/2, HEIGHT/2, 'bg3').setDepth(-1);
    this.add.text(WIDTH/2, HEIGHT/2-20, 'Победа!', { fontFamily:'Arial', fontSize: 42, color:'#fff'}).setOrigin(0.5);
    this.add.text(WIDTH/2, HEIGHT/2+20, 'Нажми любую клавишу, чтобы сыграть снова', { fontFamily:'Arial', fontSize: 18, color:'#fff'}).setOrigin(0.5);
    this.input.keyboard.once('keydown', () => this.scene.start('Level1'));
  }
}

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: 'game',
  physics: { default: 'arcade', arcade: { gravity: { y: 900 }, debug: false } },
  scene: [Preload, Level1, Level2, Level3, Win]
};

new Phaser.Game(config);

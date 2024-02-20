export default class PlayerOdie extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, sprite) {
        super(scene, x, y, sprite); 
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enable(this);

        this.init();
        this.animatePlayer();   
    }

    init(){
        this
        //.setBounce(0.2)
        //.setCollideWorldBounds(true)
        //.setGravityY(300)
        .setScale(0.2)
        .setDepth(2)
        //.body.setSize(35,66,35,30); // custom mask => setSize(width, height, XinSprite, YinSprite)
    }

    animatePlayer() {        
        this.anims.create({
            key: 'DOWN',
            frames: this.anims.generateFrameNumbers('odie', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: 'UP',
            frames: this.anims.generateFrameNumbers('odie', { start: 8, end: 11 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'RIGHT',
            frames: this.anims.generateFrameNumbers('odie', { start: 4, end: 7 }),
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: 'LEFT',
            frames: this.anims.generateFrameNumbers('odie', { start: 4, end: 7 }),
            frameRate: 6,
            repeat: -1
        });        

        this.anims.create({
            key: 'IDLE',
            frames: [{ key: 'odie', frame: 0 }],
            frameRate: 10,
        });

    }
}
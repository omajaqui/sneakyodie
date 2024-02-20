import { Component, OnInit } from '@angular/core';
import Phaser from 'phaser';

//importar clases
import Inicio from './scenes/inicio.js';

//servies
import { ComunService } from 'src/app/services/comun.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

    phaserGame: Phaser.Game;
    config: Phaser.Types.Core.GameConfig;

    isMobile = navigator.userAgent.indexOf("Mobile");

    constructor(
        public comunSer: ComunService,        
    ) {
        //console.log(this.isMobile);

        if (this.isMobile == -1) {
            this.isMobile = navigator.userAgent.indexOf("Tablet");
        }
        //console.log(this.isMobile);
        if (this.isMobile == -1) {
            this.config = {
                type: Phaser.AUTO,
                width: 480,
                height: 640,
                physics: {
                    default: 'arcade'
                },
                parent: 'game',
                backgroundColor: '#148FCB',
                scene: [Inicio]
            };
        } else {
            this.config = {
                type: Phaser.AUTO,
                /* width: window.innerWidth,
                height: window.innerHeight, */
                width: '100hv', //384
                height: '100hv', //576

                /* scale: {
                    width: 384,
                    height: 576,
                    parent: 'game',
                    mode: Phaser.Scale.CENTER_BOTH,
                    //autoCenter: Phaser.Scale.CENTER_HORIZONTALLY
                    //autoCenter: Phaser.Scale.CENTER_BOTH
                }, */


                physics: {
                    default: 'arcade'
                },
                parent: 'game',
                backgroundColor: '#148FCB',
                scene: [Inicio]
            };
        }        
    }

    ngOnInit(): void {
        this.phaserGame = new Phaser.Game(this.config);
    }

}

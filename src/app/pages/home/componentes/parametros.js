export default class Parametros{
    constructor(scene) {
        this.relatedScene = scene;
    }

    init(){       
        this.arrayPosGrid = [];
        this.arrayRutaMovimiento = [];
        this.posInicial = 0;
        this.posDestino = 0;

        this.jugadorEnMovimiento = false;
        this.animarUP = false;
        this.animarDown = false;
        this.animarLeft = false;
        this.animarRight = false;
    }

    preload(){        
    }
}
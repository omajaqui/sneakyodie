//Componenstes Globales
import Carga_imagenes from "../componentes/cargar_imagenes.js";
import Parametros from "../componentes/parametros.js";
import PlayerOdie from "../clases/playerOdie.js";

//utilidades phaser
import AlignGrid from '../util/alignGrid.js';
import Align from '../util/align.js';
import UIBlock from '../util/UIBlock.js';

export default class Inicio extends Phaser.Scene {
    _ = Object.create(this.constructor.prototype);

    constructor(config){        
        super(config);
        this.imagenes = new Carga_imagenes(this);
        this.parametros = new Parametros(this);
    }
    init(){
        //console.log("load scena inicio");
        this.width = this.sys.game.canvas.width;
        this.height = this.sys.game.canvas.height;
        this.parametros.init();
        this.rand = Math.floor(Math.random() * (1000 - 1) + 1);

        
    }

    preload() {
        this.load.path = './assets';               
        this.imagenes.preload(); 
    }

    async create() {
        await this.adminMapa();

        this.camino = this.physics.add.group();    
        await this.adminInpust();   //asigna las teclas que contralaran el juego 

        this.configGrid = {
            scene:this,
            rows:12,
            cols:8,
            height: this.height,
            width: this.width,
        }
        //console.log(this.configGrid)
        this.aGrid = new AlignGrid(this.configGrid);
        //this.aGrid.showNumbers();

        this.controlDimensiones();        

        this.cloud = this.physics.add.image(0,0,'cloud');
        this.player = new PlayerOdie(this,0,0,'odie');

        //posicionar ojetos por indice del grid
        this.aGrid.placeAtIndex(86,this.player);
        //Align.scaleToGameW(this.player,.2)
        this.player.y = this.player.y-((this.aGrid.ch/2)-1);
    }

    adminMapa(){
        return new Promise(resolve => {
            //cargar tilemap
            this.mapa = this.make.tilemap({key: 'mapa_odie'});
            this.tileAssets = this.mapa.addTilesetImage('Room_Builder_free_48x48','build_interiores');
            this.tileObjetos = this.mapa.addTilesetImage('Interiors_free_48x48','Interiors');

            //Agregar capas del tileset
            this.layer_murosExt = this.mapa.createLayer('muros_exterior',this.tileAssets, 0, 0);
            this.layer_paredes = this.mapa.createLayer('paredes',this.tileAssets, 0, 0);
            this.layer_pisos = this.mapa.createLayer('pisos',this.tileAssets, 0, 0);
            this.layer_decoracion = this.mapa.createLayer('decoracion',this.tileObjetos, 0, 0);

            //tamaño de capas
            this.layer_murosExt.setDisplaySize(this.width,this.height);
            this.layer_paredes.setDisplaySize(this.width,this.height);
            this.layer_pisos.setDisplaySize(this.width,this.height);
            this.layer_decoracion.setDisplaySize(this.width,this.height);

            resolve(true);
        });
    }

    adminInpust(){
        return new Promise(resolve =>{
            let self = this;
            this.input.mouse.disableContextMenu();
            this.input.on('pointerup', async function (pointer){
                if (pointer.leftButtonReleased()) {
                    self.pararJugador();
                    await self.delay(100);
                    self.touch();
                }
            }); 
            resolve(true);
        });
    }
    async touch(){
        let pointer = this.input.activePointer;
        this.posInicial = await this.obtenerPos(this.player.x, this.player.y)
        this.posDestino = await this.obtenerPos(pointer.worldX,pointer.worldY);
        console.log(this.posInicial)
        console.log(this.posDestino)
        this.rutaMovimiento();
    }

    async obtenerPos(x,y){
        return new Promise(resolve =>{
            let pos = 0;
            //encontrar pos en el grid basado en las cordenadas del touch
            this.arrayPosGrid.forEach((item) =>{
                if(
                    item.minX < x &&
                    item.maxX > x &&
                    item.minY < y &&
                    item.maxY > y
                ){
                    pos = item.posGrid;
                    return pos;
                }
            });
            resolve(pos);            
        });
    }

    controlDimensiones(){
        /* console.log(this.configGrid);
        console.log(this.aGrid.cw);
        console.log(this.aGrid.ch); */

        let arrayIndex = [];
        let x = 0;
        let y = 0;

        //recorrer this.configGrid.rows
        for(let r=0; r<this.configGrid.rows; r++){
            //recorrer las columnas
            for(let c=0; c<this.configGrid.cols; c++){ 
                let index = 0;
                if(r == 0){
                    index = c;
                }else if(r == 1){
                    index = c+8;
                }else{
                    index = (r*8) + c;
                }
                let noDisponibles = [
                    0,1,2,3,4,5,6,7,   //bordes no pueden ser elegibles
                    15,23,31,39,47,55,63,71,79,87,95,
                    8,16,24,32,40,48,56,64,72,80,88,
                    89,90,91,92,93,94             
                ];
                
                let disponible = (noDisponibles.includes(index))? 'N' : 'S';
                let obj = {
                    minX: x,
                    maxX: x+this.aGrid.cw,
                    minY: y,
                    maxY: y+this.aGrid.ch,
                    posGrid: index,
                    row: r,
                    col: c,
                    disponible
                }
                arrayIndex.push(obj);
                x += this.aGrid.cw; // 46.875
            }
            x = 0;
            y +=this.aGrid.ch; // 55.583333333333336
        }
        //console.log(arrayIndex);
        this.arrayPosGrid = arrayIndex;
    }

    async rutaMovimiento(){
        this.arrayRutaMovimiento = [];   

        if((this.posInicial != this.posDestino) && this.arrayPosGrid[this.posDestino]['disponible'] == 'S'){
            this.arrayRutaMovimiento = await this.calcularMejorRuta();
            if(this.arrayRutaMovimiento.length > 0){
                if(this.jugadorEnMovimiento){
                    await this.delay(500)
                    await this.pararJugador();
                }                
                await this.trazarMovimiento();
                this.controlMovimientosPersonaje();
            }
        }
        
    }

    calcularMejorRuta(){
        return new Promise(async(resolve) =>{
            this.verticalDir = '';
            this.horizontalDir = '';

            this.iActual  = this.arrayPosGrid[this.posInicial];
            this.iDestino = this.arrayPosGrid[this.posDestino];

            //validar si la pos de destino esta en una row por encima,igual o por debajo a la inicial
            if(this.iDestino.row > this.iActual.row){
                this.verticalDir = 'D';
            }else if(this.iDestino.row == this.iActual.row){
                this.verticalDir = '';
            }else if(this.iDestino.row < this.iActual.row){
                this.verticalDir = 'U';
            }

            //validar si la pos de destino esta en una col menor,igual o superior a la inicial
            if(this.iDestino.col > this.iActual.col){
                this.horizontalDir = 'R';
            }else if(this.iDestino.col == this.iActual.col){
                this.horizontalDir = '';
            }else if(this.iDestino.col < this.iActual.col){
                this.horizontalDir = 'L';
            }

            console.log('verticalDir '+this.verticalDir);
            console.log('horizontalDir '+this.horizontalDir);

            let posMov = this.posInicial;
            let arrayRuta = [];
            let nroMov = 0;

            //validar movimiento vertical
            if(this.horizontalDir == ''){
                //al entrar aqui se deduce que el movimiento será solo vertical
                if(this.verticalDir == 'U'){ //movimiento hacia arraba
                    while(posMov > this.posDestino){
                        nroMov++;
                        if(this.arrayPosGrid[posMov-8]['disponible'] == 'S'){
                            let posicion = posMov-8;
                            let cordenadas = await this.obtenerCordenadas(posicion);
                            let obj = {
                                pos: posicion,
                                movimiento: nroMov,
                                x: cordenadas.x,
                                y: cordenadas.y,
                                direccion: 'U'
                            }
                            arrayRuta.push(obj);
                        }else{
                            console.log("rutaVertical bloqueada");
                            break;
                        }
                        posMov -=8;
                    }                    
                }

                if(this.verticalDir == 'D'){ //movimiento hacia abajo
                    while(posMov < this.posDestino){
                        nroMov++;
                        if(this.arrayPosGrid[posMov+8]['disponible'] == 'S'){
                            let posicion = posMov+8;
                            let cordenadas = await this.obtenerCordenadas(posicion);
                            let obj = {
                                pos: posicion,
                                movimiento: nroMov,
                                x: cordenadas.x,
                                y: cordenadas.y,
                                direccion: 'D'
                            }
                            arrayRuta.push(obj);
                        }else{
                            console.log("rutaVertical bloqueada");
                            break;
                        }
                        posMov +=8;
                    }   
                }                
            }

            //validar movimiento horizontal
            if(this.verticalDir == ''){
                //al entrar aqui se deduce que el movimiento será solo horizontal
                if(this.horizontalDir == 'L'){ //movimiento hacia la izquierda
                    while(posMov > this.posDestino){
                        nroMov++;
                        if(this.arrayPosGrid[posMov-1]['disponible'] == 'S'){
                            let posicion = posMov-1;
                            let cordenadas = await this.obtenerCordenadas(posicion);
                            let obj = {
                                pos: posicion,
                                movimiento: nroMov,
                                x: cordenadas.x,
                                y: cordenadas.y,
                                direccion: 'L'
                            }
                            arrayRuta.push(obj);
                        }else{
                            console.log("ruta Horizozal hacia la izquierda bloqueada");
                            break;
                        }
                        posMov -=1;
                    }                    
                }

                if(this.horizontalDir == 'R'){ //movimiento hacia la derecha
                    while(posMov < this.posDestino){
                        nroMov++;
                        if(this.arrayPosGrid[posMov+1]['disponible'] == 'S'){
                            let posicion = posMov+1;
                            let cordenadas = await this.obtenerCordenadas(posicion);
                            let obj = {
                                pos: posicion,
                                movimiento: nroMov,
                                x: cordenadas.x,
                                y: cordenadas.y,
                                direccion: 'R'
                            }
                            arrayRuta.push(obj);
                        }else{
                            console.log("ruta Horizontal hacia la derecha bloqueada");
                            break;
                        }
                        posMov +=1;
                    }   
                }
            }

            //validar movimiento en L 
            if(this.verticalDir != '' && this.horizontalDir != ''){
                let rutaCompleta = 'N';
                let hastaEsquina = 'N';
                let dirInicio = 'Vertical';

                //validar movimiento iniciando verticalmente
                let respuesta = await this.validarMovimientoEnL(dirInicio);
                console.log(respuesta);
                if(respuesta.rutaCompleta == 'S' && respuesta.ruta.length>0){
                    arrayRuta = respuesta.ruta;
                }

                 
            }

            //console.log(arrayRuta);
            resolve(arrayRuta);
        });
    }

    trazarMovimiento(){
        return new Promise(async(resolve)=>{        
            this.camino.clear(true,true);       
            //recorrer array con ruta
            this.arrayRutaMovimiento.forEach(async (item, i)=>{
                let sprite = '';
                let spriteInicio = '';
                let spriteFin = '';
                let pos = item.pos;

                //ruta vertical
                if(this.horizontalDir == '' && this.verticalDir != '' ){                
                    sprite = 'camino_ruta_V';
                    spriteInicio = (this.verticalDir == 'U')? 'camino_point_U' : 'camino_point_D';
                    spriteFin    = (this.verticalDir == 'U')? 'camino_point_D' : 'camino_point_U'; 
                }

                //ruta horizontal
                if(this.verticalDir == '' && this.horizontalDir != ''){
                    sprite = 'camino_ruta_H';
                    spriteInicio = (this.horizontalDir == 'L')? 'camino_point_L' : 'camino_point_R';
                    spriteFin    = (this.horizontalDir == 'L')? 'camino_point_R' : 'camino_point_L';
                }

                //ruta en L
                if(this.verticalDir != '' && this.horizontalDir != '' ){
                    switch(item.direccion){
                        case 'U':
                        case 'D':
                            sprite = 'camino_ruta_V';
                            spriteInicio = (item.direccion == 'U')? 'camino_point_U' : 'camino_point_D';
                            //spriteFin    = (this.horizontalDir == 'L')? 'camino_point_R' : 'camino_point_L';
                        break;

                        case 'L':
                        case 'R':
                            sprite = 'camino_ruta_H';
                            spriteInicio = (item.direccion == 'L')? 'camino_point_L' : 'camino_point_R';
                        break;
                    }

                    //detectar si en el siguiente movimiento cambia la direccion
                    if(i < this.arrayRutaMovimiento.length-1){                        
                        let dirActual   = this.arrayRutaMovimiento[i]['direccion'];
                        let dirSiguiente = this.arrayRutaMovimiento[i+1]['direccion'];

                        if(dirActual != dirSiguiente){
                            if(dirActual=='U' && dirSiguiente == 'R'){ sprite = 'camino_curva_R_D'; }
                            if(dirActual=='U' && dirSiguiente == 'L'){ sprite = 'camino_curva_L_D'; }
                            if(dirActual=='D' && dirSiguiente == 'R'){ sprite = 'camino_curva_R_U'; }
                            if(dirActual=='D' && dirSiguiente == 'L'){ sprite = 'camino_curva_L_U'; }

                            if(dirActual=='L' && dirSiguiente == 'D'){ sprite = 'camino_curva_R_D'; }
                            if(dirActual=='L' && dirSiguiente == 'U'){ sprite = 'camino_curva_R_U'; }
                            if(dirActual=='R' && dirSiguiente == 'D'){ sprite = 'camino_curva_L_D'; }
                            if(dirActual=='R' && dirSiguiente == 'U'){ sprite = 'camino_curva_L_U'; }
                        }
                    }
                }

                if(i == 0){
                    //colocar la imagen de inicio de ruta
                    let corInicio = await this.obtenerCordenadas(this.posInicial);
                    this.camino.create(corInicio.x,corInicio.y,spriteInicio).setScale(0.5);
                }
                if(i == this.arrayRutaMovimiento.length-1){
                    sprite = spriteFin;

                    if(this.verticalDir != '' && this.horizontalDir != '' ){
                        let dirActual   = this.arrayRutaMovimiento[i]['direccion'];
                        switch(dirActual){
                            case 'U': sprite = 'camino_point_D'; break;
                            case 'D': sprite = 'camino_point_U'; break;
                            case 'R': sprite = 'camino_point_L'; break;
                            case 'L': sprite = 'camino_point_R'; break;
                        }
                        
                    }
                }

                //obtener el centro de cordenadas de una celda
                let cordenadas = await this.obtenerCordenadas(pos);
                this.camino.create(cordenadas.x,cordenadas.y,sprite).setScale(0.5); 
            });
            console.log("termina funcion de trazar camino")
            resolve(true);
        }); 
    }

    //obtener cordenadas del centro de la celda segun una pos del grid
    obtenerCordenadas(pos){
        return new Promise(resolve=>{
            let celda = this.arrayPosGrid.find(item => item.posGrid == pos);
            let x = celda.minX + (this.aGrid.cw/2);
            let y = celda.minY + (this.aGrid.ch/2);
            let cordenadas = {x,y}
            resolve(cordenadas);
        });
    }

    //obtener la posicion de doblar en ruta en L
    obtenerPosEsquinaRuta(inicio){
        return new Promise(resolve=>{
            let iEsquina = [];
            if(inicio == 'Vertical'){
                iEsquina = this.arrayPosGrid.find(celda => celda.row == this.iDestino.row && celda.col == this.iActual.col);
            }

            if(inicio == 'Horizontal'){
                iEsquina = this.arrayPosGrid.find(celda => celda.row == this.iActual.row && celda.col == this.iDestino.col);
            }
            resolve(iEsquina);
        });
    }

    //mover al personaje por la ruta calculada
    async controlMovimientosPersonaje(){
        let arrayMoves = [];
        let dir = this.arrayRutaMovimiento[0]['direccion'];

        await this.pararJugador();
        this.jugadorEnMovimiento = true;
        console.log(this.arrayRutaMovimiento);

        //recorrer la ruta y crear nuevo array con grupos de movimientos seguidos, por cada direccion
        this.arrayRutaMovimiento.forEach((item,i)=>{
            if(item.direccion != dir){
                //al entrar aqui se deduce que cambio la direccion
                //insertar obj hasta aqui indicando que se debe hacer recorrido de direccion hasta esta pos-1
                arrayMoves.push(this.arrayRutaMovimiento[i-1]);
                dir = item.direccion;
            }

            if(i == this.arrayRutaMovimiento.length -1){
                let existe = arrayMoves.filter(move => move.pos == item.pos);
                if(existe.length == 0){
                    arrayMoves.push(item);
                }
            }
        });

        console.log(arrayMoves);
        if(arrayMoves.length > 0){
            //reccorrer movimientos y crear tweens
            for(let i in arrayMoves){
                this.animarUP = false;
                this.animarDown = false;
                this.animarLeft = false;
                this.animarRight = false;

                let item = arrayMoves[i];
                let eje = '';
                let cordenadaDestino = '';
                if(!this.jugadorEnMovimiento){
                    break;
                }

                switch(item.direccion){
                    case 'U':
                    case 'D':
                        this.animarUP      = (item.direccion == 'U')? true : false;
                        this.animarDown    = (item.direccion == 'D')? true : false;
                        eje = 'y'
                        cordenadaDestino = item.y;
                    break;

                    case 'L':
                    case 'R':
                        this.animarLeft      = (item.direccion == 'L')? true : false;
                        this.animarRight     = (item.direccion == 'R')? true : false;
                        eje = 'x'
                        cordenadaDestino = item.x;
                    break;
                }

                await this.controlTween(eje,cordenadaDestino,item.movimiento);
                if(i == arrayMoves.length-1){
                    this.pararJugador(false);
                }
            };
        }
    }

    //detener al jugador si se esta moviendo
    pararJugador(detenerTween=true){
        return new Promise(resolve=>{        
            if(this.jugadorEnMovimiento){
                this.jugadorEnMovimiento = false;
                this.animarUP = false;
                this.animarDown = false;
                this.animarLeft = false;
                this.animarRight = false;

                //limpiar ruta trazada
                this.camino.clear(true,true);
                
                //detener movimiento que se este ejecutando
                if(detenerTween && this.tweenMove){
                    this.tweenMove.stop();
                }
            }
            resolve(true);
        });
    }

    delay(ms){
        return new Promise( resolve =>{
            setTimeout(() => {
                resolve(true);
            }, ms);
        });
    }

    controlTween(eje,destino,contador){
        return new Promise(async(resolve) =>{ 
            let time = contador*0.5;

            let configTween = {
                targets: this.player,
                ease: 'Power0',
                duration: time*1000,
                yoyo: false,
                onStart: function () { },
                onComplete: function () { },
                onYoyo: function () {  },
                onRepeat: function () { },
            }

            switch(eje){
                case 'x':
                    configTween.x = destino;                
                break;

                case 'y':
                    configTween.y = destino-((this.aGrid.ch/2)-1);   
                break;
            }

            console.log(configTween);
            this.tweenMove = this.tweens.add(configTween);
            
            await this.delay(time*1000);
            resolve(true);
        });
    }

    async validarMovimientoEnL(dirInicio){
        return new Promise(async(resolve)=>{
            let rutaTotal = [];
            let rutaAEsquina = [];
            let rutaEsquinaDestino = [];
            let control = 0;
            let respuesta = {
                rutaCompleta: 'N',
                hastaEsquina: 'N',
                ruta: []
            };
            
            let posMov = this.posInicial;
            this.iEsquina = await this.obtenerPosEsquinaRuta(dirInicio);
            console.log(this.iEsquina);

            //validar si es posible moverse hasta la esquina y de la esquina a la pos final
            if(dirInicio == 'Vertical'){
                //obteber ruta from to
                control = (this.verticalDir=='U')? -8 : 8;
                rutaAEsquina = await this.obtenerRutaFromTo(this.posInicial,this.iEsquina.posGrid,control,this.verticalDir);
                console.log(rutaAEsquina);
                if(rutaAEsquina.length>0){
                    respuesta.hastaEsquina = 'S';
                    control = (this.horizontalDir=='R')? 1 : -1;
                    //validar si es posible moviento desde la esquina hasta la pos destino
                    rutaEsquinaDestino = await this.obtenerRutaFromTo(this.iEsquina.posGrid,this.posDestino,control,this.horizontalDir);
                    console.log(rutaEsquinaDestino);
                    if(rutaEsquinaDestino.length>0){
                        //al entrar aqui se deduce que es posible la ruta tipo L iniciando verticalmente
                        
                        //consolidar ruta completa
                        rutaTotal = rutaAEsquina.concat(rutaEsquinaDestino);
                        respuesta.rutaCompleta = 'S';
                        respuesta.ruta = rutaTotal;

                    }else{
                        //al entrar aqui se deduce que no es posible la ruta tipo L iniciando verticalmente
                        //devolver respuesta indicando que se debe validar la ruta tipo L iniciando horizontalmente
                    }
                }else{
                    //al entrar aqui se deduce que no es posible la ruta tipo L iniciando verticalmente
                    //validar la ruta en L iniciando horizontalmente
                    //devolver respuesta indicando que se debe validar la ruta tipo L iniciando horizontalmente
                }                
            }
            

            resolve(respuesta);
        });
    }

    obtenerRutaFromTo(posFrom,posTo,control,direccion){
        return new Promise(async(resolve)=>{
            let ruta = [];
            let nroMov = 0;
            if(control < 0){
                control = control *-1;
                while(posFrom > posTo){
                    nroMov++;
                    if(this.arrayPosGrid[posFrom-control]['disponible'] == 'S'){
                        let posicion = posFrom-control;
                        let cordenadas = await this.obtenerCordenadas(posicion);
                        let obj = {
                            pos: posicion,
                            movimiento: nroMov,
                            x: cordenadas.x,
                            y: cordenadas.y,
                            direccion
                        }
                        ruta.push(obj);
                    }else{
                        ruta = [];
                        console.log("no se puede llegar a la esquina iniciando hacia arriba");
                        break;
                    }
                    posFrom -= control;
                }
            } 

            if(control > 0){
                while(posFrom < posTo){
                    nroMov++;
                    if(this.arrayPosGrid[posFrom+control]['disponible'] == 'S'){
                        let posicion = posFrom+control;
                        let cordenadas = await this.obtenerCordenadas(posicion);
                        let obj = {
                            pos: posicion,
                            movimiento: nroMov,
                            x: cordenadas.x,
                            y: cordenadas.y,
                            direccion
                        }
                        ruta.push(obj);
                    }else{
                        ruta = [];
                        console.log("no se puede llegar a la esquina iniciando hacia arriba");
                        break;
                    }
                    posFrom += control;
                }
            }

            resolve(ruta);
        });
    }

    update() {

        //cambiar animaciones del jugador dependiendo su direccion
        if(this.jugadorEnMovimiento){
            if(this.animarUP){
                this.player.anims.play('UP',true);
            }else if(this.animarDown){
                this.player.anims.play('DOWN',true);
            }else if(this.animarLeft){
                this.player.anims.play('LEFT',true);
                this.player.flipX = true;
            }else if(this.animarRight){
                this.player.anims.play('RIGHT',true);
                this.player.flipX = false;
            }
        }else{
            this.player.anims.play('IDLE',true);
        }
    }
    
}

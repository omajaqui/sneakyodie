export default class Carga_imagenes{
    constructor(scene) {
        this.relatedScene = scene;
    }

    preload(){
        this.relatedScene.load.path = './assets';
        //this.rand = Math.floor(Math.random() * (1000 - 1) + 1);
        this.relatedScene.load
            .image('player',"/img/player/1.png")
            .image('cloud',"/img/objects/cloud.png")
            .image('camino_curva_L_D',"/img/camino/curva_L_D.png")
            .image('camino_curva_L_U',"/img/camino/curva_L_U.png")
            .image('camino_curva_R_D',"/img/camino/curva_R_D.png")
            .image('camino_curva_R_U',"/img/camino/curva_R_U.png")
            .image('camino_point_D',"/img/camino/point_D.png")
            .image('camino_point_L',"/img/camino/point_L.png")
            .image('camino_point_R',"/img/camino/point_R.png")
            .image('camino_point_U',"/img/camino/point_U.png")
            .image('camino_ruta_H',"/img/camino/ruta_H.png")
            .image('camino_ruta_V',"/img/camino/ruta_V.png")

            .image('build_interiores',"/img/mapas/Interiors_free/48x48/Room_Builder_free_48x48.png")
            .image('Interiors',"/img/mapas/Interiors_free/Interiors_free_48x48.png")

            .spritesheet('odie', "/img/player/spriteSheet_can_175x260.png", { frameWidth: 175, frameHeight: 260 })
            .tilemapTiledJSON('mapa_odie',"/img/mapas/scene_1/mapa_odie.json"); 
        ; 
    }
}
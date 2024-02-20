import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ComunService {

  avance_juego: any[] = [];
  version = 0;

  constructor() {
    this.generarAutoVersion();
  }

  async generarAutoVersion(){
    let rand = Math.floor(Math.random() * (1000 - 1) + 1);
    //console.log(rand);
    this.version = rand;
  }
}

import { Injectable } from '@angular/core';
import { apiHost } from '../../globals';
import { SpinnerService } from '../spinner/spinner.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  currentGame: string = '';
  socket?: WebSocket;

  constructor(
    public spinner: SpinnerService,
    private router: Router,
  ) { }

  async connect() {
    this.spinner.showSpinner();
    this.socket = new WebSocket(`ws://${apiHost}/api/websocket`);
    this.socket.addEventListener('open', (_e) => {
      console.log("Connected to websocket")
      this.spinner.hideSpinner();
    });
    setTimeout(() => {
      if (this.socket?.readyState == this.socket?.CONNECTING) {
        this.socket?.close();
        this.spinner.hideSpinner();
        Swal.fire({
          icon: 'error',
          title: 'Connection error',
        });
      }
    }, 10000);
  }


  async newLobby(username: string) {
    console.log("Creating new lobby", this.socket);
    this.socket?.send(`createLobby ${username}`);
    this.socket?.addEventListener('message', this.receivedNewLobbyRes.bind(this));
  }

  receivedNewLobbyRes(e: MessageEvent<any>) {
    this.socket?.removeEventListener('message', this.receivedNewLobbyRes);
    console.log("Got lobby creation result", e);
    this.currentGame = e.data.split(' ')[1];
    this.router.navigateByUrl('/lobby/' + this.currentGame);
  }
}

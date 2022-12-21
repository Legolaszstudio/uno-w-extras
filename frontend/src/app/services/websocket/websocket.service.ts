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
  currentId: number = -1;
  socket?: WebSocket;
  connected = false;

  constructor(
    public spinner: SpinnerService,
    private router: Router,
  ) { }

  async connect() {
    this.spinner.showSpinner();
    this.socket = new WebSocket(`ws://${apiHost}/api/websocket`);
    this.socket.addEventListener('open', (_e) => {
      console.log("Connected to websocket");
      this.connected = true;
      this.spinner.hideSpinner();
    });
    setTimeout(() => {
      if (
        this.socket?.readyState == this.socket?.CONNECTING ||
        this.socket?.readyState == this.socket?.CLOSED ||
        this.socket?.readyState == this.socket?.CLOSING
      ) {
        this.connected = true;
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
    (this.socket as any)?.removeAllListeners();
    console.log("Got lobby creation result", e);
    this.currentGame = e.data.split(' ')[1];
    localStorage.setItem('currentGame', this.currentGame);
    localStorage.setItem('currentId', '1');
    this.router.navigateByUrl('/lobby/' + this.currentGame);
  }

  async getGameState(gameID: string, callback: any) {
    this.socket?.send(`getGameState ${gameID}`);
    this.socket?.addEventListener('message', callback);
  }

  async getPlayers(): Promise<{
    id: number;
    username: string;
    avatarColor: string;
  }[]> {
    this.socket?.send(`getPlayers ${this.currentGame}`);
    this.players = undefined;
    this.socket?.addEventListener('message', this.receivedPlayers.bind(this));
    while (this.players == null) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.players;
  }

  players?: [];
  async receivedPlayers(e: MessageEvent<any>) {
    (this.socket as any)?.removeAllListeners();
    this.players = JSON.parse(e.data.split(' ')[1]);
  }
}

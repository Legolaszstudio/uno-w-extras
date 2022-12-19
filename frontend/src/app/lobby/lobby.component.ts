import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SpinnerService } from '../services/spinner/spinner.service';
import { take } from 'rxjs';
import Swal from 'sweetalert2';
import { WebsocketService } from '../services/websocket/websocket.service';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit {
  players: {
    id: number;
    username: string;
    avatarColor: string;
  }[] = [];
  gameId = '';

  constructor(
    private route: ActivatedRoute,
    private spinner: SpinnerService,
    public websocket: WebsocketService,
    public router: Router,
  ) { }

  goHome(): void {
    this.router.navigateByUrl('/');
    Swal.fire({
      icon: 'error',
      title: 'Érvénytelen ID vagy a játék már elkezdődött',
    });
  }

  ngOnInit() {
    this.spinner.showSpinner();
    this.route.params.pipe(take(1)).subscribe(async (params) => {
      const gameID = params['id'];
      this.gameId = gameID;
      if (gameID == null) {
        this.goHome();
        return;
      }
      while (!this.websocket.connected) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      this.websocket.getGameState(gameID, this.gameStateRetrieved.bind(this));
    });
  }

  async gameStateRetrieved(e: MessageEvent<any>) {
    (this.websocket.socket as any)?.removeAllListeners();
    if (e.data.split(' ')[1] != '0') {
      this.spinner.hideSpinner();
      this.goHome();
      return;
    }
    this.websocket.currentGame = this.gameId;
    let username: any;
    if (this.websocket.currentGame != localStorage.getItem('currentGame')) {
      this.spinner.hideSpinner();
      // player is connecting to new lobby
      const result = await Swal.fire({
        title: "Mi a neved?",
        html: `<input id="username" type="text" class="swal2-input" placeholder="Név">`,
        showCancelButton: true,
        preConfirm: () => {
          const usernameInput = document.getElementById('username');
          const value = (usernameInput as HTMLInputElement)?.["value"] ?? '';
          if (value.length < 3 || value.length > 20) {
            alert("A névnek 3 és 20 karakter között kell lennie!");
            return false;
          }
          // No need to check username for dups, cause you are the only one in the lobby
          return value.replaceAll(' ', '_');
        }
      });
      if (result.isConfirmed) {
        username = result.value;
        this.websocket.socket?.send(`joinLobby ${username} ${this.gameId}`);
        localStorage.setItem('currentGame', this.gameId);
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        this.goHome();
        return;
      }
    } else {
      this.websocket.socket?.send(`recoLobby ${this.gameId}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      this.websocket.currentId = parseInt(localStorage.getItem('currentId') ?? '0');
    }
    this.players = await this.websocket.getPlayers();

    if (this.websocket.currentId == -1) {
      localStorage.setItem('currentId', this.players[this.players.length - 1].id.toString());
      this.websocket.currentId = this.players[this.players.length - 1].id;
    }

    this.spinner.hideSpinner();
    (this.websocket.socket as any)?.removeAllListeners();
    this.websocket.socket?.addEventListener('message', this.handleNewUsersJoining.bind(this));
  }

  handleNewUsersJoining(e: any) {
    if (e.data.startsWith('userJoined')) {
      console.log('User joined', {
        id: -1,
        username: e.data.split(' ')[1],
        avatarColor: e.data.split(' ')[2],
      });
      this.players.push({
        id: -1,
        username: e.data.split(' ')[1],
        avatarColor: e.data.split(' ')[2],
      });
    }
  }
}

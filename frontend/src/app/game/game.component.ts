import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { WebsocketService } from '../services/websocket/websocket.service';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import anime from 'animejs/lib/anime.es.js';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  currentPlayer = 1;
  players: {
    id: number;
    username: string;
    avatarColor: string;
    noOfCards: number;
    cards: string[];
  }[] = [];
  playersWithoutMe: {
    id: number;
    username: string;
    avatarColor: string;
    noOfCards: number;
    cards: string[];
  }[] = [];
  myCards: string[] = [];
  stack: string[] = [];

  constructor(
    public websocket: WebsocketService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.route.params.pipe(take(1)).subscribe(async (params) => {
      if (this.websocket.currentGame == '' || this.websocket.currentId == -1) {
        this.router.navigateByUrl('/lobby/' + params['id']);
        return;
      }

      while (!this.websocket.connected) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      this.websocket.socket?.addEventListener('message', this.weGotALetter.bind(this));
      this.websocket.socket?.send(`getPlayers ${this.websocket.currentGame}`);
      this.websocket.socket?.send(`getCurrentPlayer ${this.websocket.currentGame}`);
      this.websocket.socket?.send(`getStack ${this.websocket.currentGame}`);
    });
  }

  async weGotALetter(event: any) {
    const msg = event.data as string;
    if (msg.startsWith("players: ")) {
      const players = JSON.parse(msg.split(' ')[1]);
      this.players = players.map((player: any) => ({
        id: player.id,
        username: player.username,
        avatarColor: player.avatarColor,
        noOfCards: player.cards?.length ?? 0,
        cards: player.cards,
      }));
      this.playersWithoutMe = this.players.filter(player => player.id != this.websocket.currentId);
      const tempMyCards = this.players.filter(player => player.id != this.websocket.currentId)[0].cards;
      tempMyCards.sort((a, b) => {
        if (a == b) {
          return 0;
        }

        a = a.replace('+', 'p');
        b = b.replace('+', 'p');

        if (a.startsWith("p") || a.startsWith("z") || a.startsWith("k") || a.startsWith("s")) {
          if (b.startsWith("p") || b.startsWith("z") || b.startsWith("k") || b.startsWith("s")) {
            if (a.length <= 4 && b.length <= 4) {
              return a.localeCompare(b);
            }
          }
        }
        return a.length > 4 ? 1 : -1;
      });
      this.myCards = tempMyCards;
    } else if (msg.startsWith("currentPlayer: ")) {
      this.currentPlayer = parseInt(msg.split(' ')[1]);
    } else if (msg.startsWith("currentStack: ")) {
      this.stack = JSON.parse(msg.split(' ')[1]);
    }
    this.cdr.detectChanges();
  }

  cardStrToImgPath(card: string) {
    if (card.startsWith("p") || card.startsWith("z") || card.startsWith("k") || card.startsWith("s")) {
      if (card.length <= 4) {
        return `assets/Cards/${card[0]}/${card.substring(1)}.jpg`;
      }
    }
    return `assets/Cards/spec/${card}.png`;
  }
}

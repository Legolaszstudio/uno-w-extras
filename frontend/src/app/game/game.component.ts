import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { WebsocketService } from '../services/websocket/websocket.service';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import anime from 'animejs/lib/anime.es.js';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  currentPlayer = 1;
  lastPlayer = 1;
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

  canPutCard(card: string): boolean {
    let currentCard = this.stack[this.stack.length - 1] ?? 'p0';
    const originalTopCard = currentCard;
    currentCard = currentCard.replaceAll('-', '+');

    // Get the color part of question cards
    if (currentCard.startsWith('color_')) {
      currentCard = currentCard.split('color_')[1];
    } else if (currentCard.startsWith('+4_')) {
      currentCard = currentCard.split('+4_')[1];
    }

    if (currentCard.length > 4) {
      // You can put anything on special cards
      return true;
    }

    if (card.startsWith('color') || card.startsWith('+4')) {
      // You may color or +4 anything
      return true;
    }

    if (card.includes('+') && currentCard.includes('+')) {
      return true;
    } else if (currentCard.includes('+') && card.length <= 4) {
      // You may only put plus cards on plus cards (except special cards) or colored cards
      if (!originalTopCard.includes('+') && currentCard[0] == card[0]) {
        return true;
      }
      return false;
    }

    if (currentCard.length <= 4 && card.length <= 4) {
      if (currentCard[0] == card[0] || currentCard.substring(1) == card.substring(1)) {
        return true;
      }
    }

    if (card.length > 4) {
      // Special cards can be put on anything
      return true;
    }

    return false;
  }

  async pullCard() {
    if (this.websocket.currentId != this.currentPlayer) {
      Swal.fire({
        toast: true,
        icon: 'error',
        position: 'bottom',
        timerProgressBar: true,
        timer: 3000,
        title: `Most nem te jössz!`,
        showConfirmButton: false,
      });
      return;
    }

    if (this.myCards.some(card => this.canPutCard(card))) {
      const result = await Swal.fire({
        icon: 'warning',
        title: `Van még lapod, amivel játszhatnál!`,
        text: 'Biztosan húzol?',
        showCancelButton: true,
        confirmButtonText: `Igen`,
        cancelButtonText: `Nem`,
      });
      if (!result.isConfirmed) return;
    }

    this.websocket.socket?.send(`pullCard ${this.websocket.currentGame} ${this.websocket.currentId}`);
  }

  async putCard(card: string) {
    if (this.websocket.currentId != this.currentPlayer) {
      Swal.fire({
        toast: true,
        icon: 'error',
        position: 'bottom',
        timerProgressBar: true,
        timer: 3000,
        title: `Most nem te jössz!`,
        showConfirmButton: false,
      });
      return;
    }

    if (!this.canPutCard(card)) {
      Swal.fire({
        toast: true,
        icon: 'error',
        position: 'bottom',
        timerProgressBar: true,
        timer: 3000,
        title: `Ilyet nem csinálhatsz!`,
        showConfirmButton: false,
      });
      return;
    }

    if (card == '+4' || card == 'color') {
      const result = await Swal.fire({
        icon: 'question',
        title: 'Milyen színt kérsz?',
        html: `
        <select name="colors" id="colorPicker">
          <option value="k">Kék</option>
          <option value="z">Zöld</option>
          <option value="p">Piros</option>
          <option value="s">Sárga</option>
        </select>
        `,
        allowEscapeKey: false,
        allowOutsideClick: false,
        preConfirm: () => {
          return (document.getElementById('colorPicker') as HTMLSelectElement)?.value;
        }
      });
      card += '_' + result.value;
    }

    this.websocket.socket?.send(`putCard ${this.websocket.currentGame} ${this.websocket.currentId} ${card}`);
    const usedCard = this.myCards.indexOf(card);
    this.myCards.splice(usedCard, 1);
  }

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
      await new Promise(resolve => setTimeout(resolve, 100));
      this.websocket.socket?.send(`getCurrentPlayer ${this.websocket.currentGame}`);
      this.websocket.socket?.send(`getStack ${this.websocket.currentGame}`);
      this.websocket.socket?.send(`getPlayers ${this.websocket.currentGame}`);
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
      const tempMyCards = this.players.filter(player => player.id == this.websocket.currentId)[0].cards;
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

      await new Promise(resolve => setTimeout(resolve, 500));
      if (
        this.stack[this.stack.length - 1].includes('+') &&
        this.currentPlayer == this.websocket.currentId
      ) {
        // Putting a +2 or +4 on another +2 or +4 is allowed
        if (this.myCards.some(x => x.includes('+'))) {
          // FIXME: Disable pullcard
          return;
        }

        // FIXME: REEDEM TOKEN IS IDE JÖN

        // Handle + stack
        let i = this.stack.length - 1;
        let summa = 0;
        while (i >= 0 && this.stack[i].includes('+')) {
          summa += parseInt(this.stack[i].split('+')[1][0]);
          i--;
        }
        this.currentPlayer = -2;
        await this.websocket.socket?.send(`pullCard ${this.websocket.currentGame} ${this.websocket.currentId} ${summa}`);
        Swal.fire({
          title: 'HÚZZ FEL SZERENCSÉTLEN!',
          text: `Húzz ${summa} lapot!`,
        });
      }
    } else if (msg.startsWith("currentPlayer: ")) {
      this.currentPlayer = parseInt(msg.split(' ')[1]);
    } else if (msg.startsWith("currentStack: ")) {
      this.stack = JSON.parse(msg.split(' ')[1]);
    } else if (msg.startsWith("lastPlayer: ")) {
      this.lastPlayer = parseInt(msg.split(' ')[1]);
    }
    this.cdr.detectChanges();
  }

  cardStrToImgPath(card: string) {
    card = card.replaceAll('-', '+');
    if (card.startsWith("p") || card.startsWith("z") || card.startsWith("k") || card.startsWith("s")) {
      if (card.length <= 4) {
        return `assets/Cards/${card[0]}/${card.substring(1)}.jpg`;
      }
    }
    return `assets/Cards/spec/${card}.png`;
  }

  public onmouseL(event: Event) {
    if (event.target == null) return;
    (event.target as HTMLElement).style.zIndex = "10"
    anime({
      targets: event.target,
      translateY: {
        value: -100,
        duration: 400,
        easing: 'easeInOutSine'
      },
      scale: {
        value: 1.25,
        duration: 400,
        easing: 'easeInOutSine'
      },
    });

  }
  public onmouseoutL(event: Event) {
    (event.target as HTMLElement).style.zIndex = "0"
    anime({
      targets: event.target,
      translateY: {
        value: 0,
        duration: 400,
        easing: 'easeInOutSine'
      },
      scale: {
        value: 1,
        duration: 400,
        easing: 'easeInOutSine'
      },
      delay: 250
    });

  }

}

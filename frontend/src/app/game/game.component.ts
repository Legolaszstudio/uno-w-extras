import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { WebsocketService } from '../services/websocket/websocket.service';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import anime from 'animejs/lib/anime.es.js';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { apiSite } from '../globals';
import { DOCUMENT } from '@angular/common';

const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

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
  redeeming = false;

  constructor(
    public websocket: WebsocketService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private httpClient: HttpClient,
    @Inject(DOCUMENT) private document: Document
  ) { }

  canPutCard(card: string): boolean {
    let currentCard = this.stack[this.stack.length - 1] ?? 'p0';
    const originalTopCard = currentCard;
    currentCard = currentCard.replaceAll('-', '+');

    if (card == "redeemtoken") {
      // You cannot put a redeem card down
      return false;
    }

    // Get the color part of question cards
    if (currentCard.startsWith('color_')) {
      currentCard = currentCard.split('color_')[1];
    } else if (currentCard.startsWith('+4_')) {
      currentCard = currentCard.split('+4_')[1];
    }

    if (currentCard == 'semmi' && this.myCards.length == 1) {
      // Semmit nem lehet utols??k??nt lerakni
      return false;
    }

    if (currentCard.length > 4) {
      // You can put anything on special cards
      return true;
    }

    if (card.startsWith('color') || card.startsWith('+4')) {
      // You may color or +4 anything
      return true;
    }

    if (card.includes('+') && (currentCard.includes('+') || originalTopCard.includes('+'))) {
      return true;
    } else if (currentCard.includes('+') && card.length <= 4) {
      // You may only put plus cards on plus cards (except special cards) or colored cards
      if (!originalTopCard.includes('+') && currentCard[0] == card[0]) {
        return true;
      }
      return false;
    }

    if (currentCard.length <= 4 && card.length <= 4) {
      if ((currentCard[0] == card[0] || currentCard.substring(1) == card.substring(1)) && !originalTopCard.includes('+')) {
        return true;
      }
    }

    if (card.length > 4 && !originalTopCard.includes('+')) {
      // Special cards can be put on anything except plus cards
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
        title: `Most nem te j??ssz!`,
        showConfirmButton: false,
      });
      return;
    }

    if (this.stack[this.stack.length - 1].includes('+')) {
      // Accept faith instead of putting another + card
      let i = this.stack.length - 1;
      let summa = 0;
      while (i >= 0 && this.stack[i].includes('+')) {
        summa += parseInt(this.stack[i].split('+')[1][0]);
        i--;
      }

      const result = await Swal.fire({
        icon: 'warning',
        title: `N??velhetn??d a t??tet a k??vetkez?? sz??m??ra!`,
        text: `Biztosan h??zol ${summa} lapot?`,
        showCancelButton: true,
        confirmButtonText: `Igen`,
        cancelButtonText: `Nem`,
      });
      if (!result.isConfirmed) return;
      this.websocket.socket?.send(`pullCard ${this.websocket.currentGame} ${this.websocket.currentId} ${summa}`);
      return;
    }

    if (this.myCards.some(card => this.canPutCard(card))) {
      const result = await Swal.fire({
        icon: 'warning',
        title: `Van m??g lapod, amivel j??tszhatn??l!`,
        text: 'Biztosan h??zol?',
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
        title: `Most nem te j??ssz!`,
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
        title: `Ilyet nem csin??lhatsz!`,
        showConfirmButton: false,
      });
      return;
    }

    if (card == '+4' || card == 'color') {
      const result = await Swal.fire({
        icon: 'question',
        title: 'Milyen sz??nt k??rsz?',
        html: `
        <select name="colors" id="colorPicker">
          <option value="k">K??k</option>
          <option value="z">Z??ld</option>
          <option value="p">Piros</option>
          <option value="s">S??rga</option>
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

    if (card == "baratpuszt") {
      let nextPlayerId = this.websocket.currentId + 1;
      if (nextPlayerId >= this.players.length) {
        nextPlayerId = 1;
      }
      const nextPlayer = this.players[nextPlayerId - 1].username;

      const result = await Swal.fire({
        icon: 'question',
        title: `Mennyit h??zzon fel ${nextPlayer}?`,
        html: `
        <input type="number" id="numberPicker" class="swal2-input" min="1" max="10" value="5">
        `,
        allowEscapeKey: false,
        allowOutsideClick: false,
        preConfirm: () => {
          let result: string | number = (document.getElementById('numberPicker') as HTMLSelectElement)?.value;
          try {
            result = parseInt(result);
          } catch (e) {
            alert("Adj meg egy sz??mot 1 ??s 10 k??z??tt!")
            return false;
          }

          if (result < 1 || result > 10 || isNaN(result)) {
            alert("Adj meg egy sz??mot 1 ??s 10 k??z??tt!")
            return false;
          }

          return result;
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

  /** Returns `true` if redeemed */
  async handleRedeem() {
    console.trace('handleRedeem()');
    this.redeeming = true;
    const questionB64 = await this.httpClient.get(`${apiSite}/api/rndQuestion`, { responseType: 'text' }).toPromise();
    if (questionB64 == null) return;
    const binary = atob(questionB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const questionObj: { question: string, answers: string[] } = JSON.parse(String.fromCharCode(...new Uint16Array(bytes.buffer)));
    const rightAnswer = questionObj.answers[0];
    const answers = questionObj.answers;
    (this.document as any).swal = Swal;
    shuffleArray(answers);
    await Swal.fire({
      showConfirmButton: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      allowOutsideClick: false,
      title: `Redeem: ${questionObj.question}`,
      html: `
        <div class="column">
          <div class="row">
            <button class="cp quizBtn red" onclick="document.answer = '${answers[0]}'; document.swal.close()">
              <p>${answers[0]}</p>
            </button>
            <button class="cp quizBtn green" onclick="document.answer = '${answers[1]}'; document.swal.close()">
              <p>${answers[1]}</p>
            </button>
          </div>
          <div class="row">
            <button class="cp quizBtn blue" onclick="document.answer = '${answers[2]}'; document.swal.close()">
              <p>${answers[2]}</p>
            </button>
            <button class="cp quizBtn yellow" onclick="document.answer = '${answers[3]}'; document.swal.close()">
              <p>${answers[3]}</p>
            </button>
          </div>
        </div>
      `,
    });
    const answer: string = (this.document as any).answer;
    if (answer == rightAnswer) {
      // Hurray, you are right
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        icon: 'success',
        title: 'Ez most meg??sztad!',
        timer: 3000,
        timerProgressBar: true,
      });
      this.redeeming = false;
      return true;
    } else {
      // You are wrong
      this.redeeming = false;
      return false;
    }
  }

  async handlePullCards() {
    // Handle + stack
    let summa = 0;
    let i = this.stack.length - 1;
    if (this.stack[this.stack.length - 1] == 'redeemtoken') {
      i--;
    }
    if (this.stack[i].startsWith('baratpuszt_')) {
      summa += parseInt(this.stack[i].split('_')[1]);
    }
    while (i >= 0 && this.stack[i].includes('+')) {
      summa += parseInt(this.stack[i].split('+')[1][0]);
      i--;
    }
    this.currentPlayer = -2;
    await this.websocket.socket?.send(`pullCard ${this.websocket.currentGame} ${this.websocket.currentId} ${summa}`);
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      icon: 'warning',
      title: 'Rossz lehet neked',
      text: `H??zt??l ${summa} lapot!`,
      timer: 3000,
      timerProgressBar: true,
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
        this.stack[this.stack.length - 1].startsWith('baratpuszt_') &&
        this.currentPlayer == this.websocket.currentId && !this.redeeming
      ) {
        if (this.myCards.includes('redeemtoken')) {
          // if you have it, then you must use it
          const usedCard = this.myCards.indexOf('redeemtoken');
          this.myCards.splice(usedCard, 1);
          this.websocket.socket?.send(`putCard ${this.websocket.currentGame} ${this.websocket.currentId} redeemtoken`);
          if (await this.handleRedeem()) {
            return;
          }
        }

        const noOfCards = parseInt(this.stack[this.stack.length - 1].split('_')[1]);

        this.currentPlayer = -2;
        await this.websocket.socket?.send(`pullCard ${this.websocket.currentGame} ${this.websocket.currentId} ${noOfCards}`);

        if (noOfCards > 4) {
          let playerBeforeId = this.websocket.currentId - 1;
          if (playerBeforeId <= 0) {
            playerBeforeId = this.players.length;
          }
          const playerBefore = this.players[playerBeforeId - 1].username;

          Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            icon: 'warning',
            title: `${playerBefore} megsz??vatott (${noOfCards} lap)!`,
            text: `Ezt nem hagyn??m a helyedben!`,
            timer: 3500,
            timerProgressBar: true,
          });
        } else {
          Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            icon: 'warning',
            title: 'Rossz lehet neked',
            text: `H??zt??l ${noOfCards} lapot!`,
            timer: 3000,
            timerProgressBar: true,
          });
        }

        return;
      }

      if (
        this.stack[this.stack.length - 1].includes('+') &&
        this.currentPlayer == this.websocket.currentId && !this.redeeming
      ) {
        if (this.myCards.includes('redeemtoken')) {
          // if you have it, then you must use it
          const usedCard = this.myCards.indexOf('redeemtoken');
          this.myCards.splice(usedCard, 1);
          this.websocket.socket?.send(`putCard ${this.websocket.currentGame} ${this.websocket.currentId} redeemtoken`);
          if (await this.handleRedeem()) {
            return;
          }
        } else if (this.myCards.some(x => x.includes('+'))) {
          // Putting a +2 or +4 on another +2 or +4 is allowed
          return;
        }
        await this.handlePullCards();
        return;
      }

      if (
        this.stack[this.stack.length - 1] == 'redeemtoken' &&
        this.currentPlayer == this.websocket.currentId &&
        this.lastPlayer == this.websocket.currentId && !this.redeeming
      ) {
        if (!(await this.handleRedeem())) {
          await this.handlePullCards();
        }
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
    if (card.startsWith("baratpuszt")) {
      card = card.replaceAll('_', '').replaceAll('-', '').replaceAll('+', '');
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

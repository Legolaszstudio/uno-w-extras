import { Component } from '@angular/core';
import { WebsocketService } from '../services/websocket/websocket.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  constructor(
    public websocketService: WebsocketService,
  ) { }
  
  Settings() {}

  Information(){
    Swal.fire({
      title: 'Szabályok:',
      html: '<p style="text-align: justify;">Minden játékos 7 kártyalapot kap. A megmaradó kártyákat az asztal közepére helyezzük és a legfelső kártyát mindenki számára látható módon megfordítjuk. A játékosok a kártyákat szín, ill. számozás szerint sorba rendezik.A játék célja: elsőként lerakni valamennyi lapot. Körönként a játékos egyszerre csak egy lapot tehet le, ha éppen van egy illeszkedő lapja. Ha egyik lapja sem illeszthető, akkor húznia kell egy lapot a csomagból.A játékos csak akkor tehet le egy lapot, ha a pakli tetején felfordított kártyával azonos színű, azonos számú vagy azonos szimbólumú kártyája van.Ha a játékos nem tud lapot tenni, akkor húznia kell egyet a csomagból és a következő játékosra kerül a sor.Az akciókártyák akkor játszhatók ki, ha a játékosnak nincs több számozott kártyája vagy amikor a játékos ezt szükségesnek ítéli.</p><ul><li style="text-align: left;">A `wildcards` -okat bármilyen lapra le lehet rakni.</li><li style="text-align: left;">Amikor felhúztál egy vagy több lapot akkor már nem rakhatsz abban a körben le lapot.</li><li style="text-align: left;">Vannak különleges lapok:</li></ul><ol><li style="text-align: left;">~Semmi~: Ezt a kártyát bármire le tudod rakni, de konkrét semmire sem jó, viszont utolsó lapként nem tehető le. (4 lap összesen)</li><li style="text-align: left;">~Barátság Pusztító~: Ennél a kártyánál te mondod meg hogy mennyit húzzon fel a következő körben jövő játékos 1-10 lap között. (2 lap összesen)</li><li style="text-align: left;">~Reedem token~: Megszabadít a felhúzásoktól, ha tudsz válaszolni egy kérdésre (nem számít bele a lapjaid számába) (4 lap összesen)</li><li style="text-align: left;">~Isten Szaggató~: Ha megkapod és leteszed (bármire lerakhatod) ezt a lapot akkor számodra vége a játéknak de az esélye hogy megkapod a lapot az 0,000001%. (1 lap összesen)</li><li style="text-align: left;">~Szovjet Demokrácia~: Ha ezt a kártyát valaki leteszi akkor, mindenkinek annyi kártyát kell felhúznia hogy annyi kártyája legyen mindenkinek mint amennyi a legtöbb kártyát birtokloéval. (4 lap összesen)</li><li style="text-align: left;">~UrbinTurbina~: Elfújja két random lapodat a süllyesztőbe ha leteszed.(A cisco áldásával), (4 lap összesen)</li><li style="text-align: left;">~RickRoll~: Míg mindenki a zenét hallgatja addig te jössz egy kör erejéig. (2 lap összesen)</li><li style="text-align: left;">~Tolvaj Dokkmunkás~: Kiválaszthatod hogy melyik lapot szeretnéd az opponent playertől/játékostól. (4 lap összesen)</li><li style="text-align: left;">~Pakli Csere~: Mindenki jobbra adja a saját pakliját a másiknak. (4 lap összesen)</li><li style="text-align: left;">~Pride Card~: Ezzel a kártyával kiválaszthatod hogy egy adott játékosnál milyen színű kártya lehet. (annyi lap ahány játékos van))</li></ol>',
      width: 1000,
      padding: '3em',
      color: '#716add',
    });
  }

  async newLobby() {
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
        return value;
      }
    });
    if (result.isConfirmed) {
      const username = result.value as string;
      this.websocketService.newLobby(username);
    }
  }
}
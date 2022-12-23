# Backend

Lobby owner is always with id `1`.

### Redis keys

Every game has a unique id, usually made of 5 random characters. This id is used as a key in redis to store the game state.

`key` - 0 if lobbby, 1 if ingame

`key:users` - list of all users with props in JSON:
```json
[
    {
        "id": 1,
        "username": "Sanyika",
        "avatarColor": "#ffa550",
        "cards": [
            "p10",
            "z9",
            "k+2"
        ]
    },
    ...
]
```

`key:currentPlayer` - id of the currently choosing user

`key:cardsInCirculation` - list of cards in circulation (aka waiting to be put down or already put down) in JSON:
```json
[
    "r9",
    "r8",
    "y2",
    "urbina",
    "semmi",
]
```

`key:stack` - list of cards in the stack (contains last 10 cards, or more if `+` cards were used), JSON, 0 is the oldest
```json
[
    "r9", // 0 -> oldest
    "r8",
    "y2",
    "urbina",
    "semmi", // 4 -> newest
]
```

`key:direction` - 1 if clockwise, -1 if counterclockwise

`key:lastPlayer` - Who put last card down

## Localstorage keys

currentGame - id of the current game
currentId - id of the current user

## Card ids

##### betuk:

- `p`: piros
- `z`: zold
- `k`: kek
- `s`: sarga

betu + `0-9`: 0-9 piros (k0, s9, stb)
betu + `r`: Revers visszafordító
betu + `t`: Tiltó (kimarad egy körből)
betu + `+2`: +2 (két lapot kell húzni)

#### spec kártyák


`color`: szín választó (színt lehet választani, de nem kell húzni lapot)
`+4`: +4 (négy lapot kell húzni és lehet színt kérni)

Semmi: `semmi` 
Barátság Pusztító: `baratpuszt` (1től 10ig)
Reedem token: `reedemtoken`
Isten Szaggató: `istenszagg`
Szovjet Demokrácia: `szovjetd`
UrbinTurbina: `urbina`
RickRoll: `rickroll`
Tolvaj Dokkmunkás: `dokkmunkas`
Pakli Csere: `pcsere`
Pride Card: `pcard`
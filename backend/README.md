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
    },
    ...
]
```

`key:currentUser` - id of the currently choosing user

`key:cardsInCirculation` - list of cards in circulation in JSON:
```json
[
    "red9",
    "red8",
    "yellow2",
    "urbinTurbina",
    "semmi",
]
```

`key:userId:cards` - contains cards a user holds in JSON (duplicates are contained multiple times):
```json
[
    "red9",
    "red8",
    "yellow2",
    "urbinTurbina",
    "semmi",
]
```

## Localstorage keys

currentGameId - id of the current game
currentUserId - id of the current user
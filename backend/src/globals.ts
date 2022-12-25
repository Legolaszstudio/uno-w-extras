export const allCards: string[] = [];

for (const item of ['p', 'z', 'k', 's']) {
    for (let i = 0; i <= 9; i++) {
        allCards.push(item + i);
    }
    for (let i = 0; i < 2; i++) {
        allCards.push(item + '+2');
        allCards.push(item + 't');
        allCards.push(item + 'r');
    }
}

for (let i = 0; i < 4; i++) {
    allCards.push('+4');
    allCards.push('color');
}

// Add all cards again (we have double of everything)
allCards.push(...allCards);

export const specialCards = [
    "semmi",
    "baratpuszt",
    "redeemtoken",
    "szovjetd",
    "urbina",
    "rickroll",
    "dokkmunkas",
    "pcsere",
    "pcard",
];
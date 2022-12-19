import { logger } from "../logger";
import client from "./redis";

const colors = [
    "#D32F2F",
    "#C2185B",
    "#7B1FA2",
    "#512DA8",
    "#303F9F",
    "#1976D2",
    "#0097A7",
    "#00796B",
    "#388E3C", 
    "#AFB42B",
    "#880E4F",
    "#4A148C",
    "#1A237E",
    "#01579B",
    "#006064",
    "#004D40",
    "#1B5E20",
    "#BF360C",
    "#37474F",
    "#64DD17",
    "#E91E63",
    "#AEEA00",
    "#18FFFF",
    "#536DFE",
    "#E040FB",
    "#78909C",
    "#6D4C41",
    "#D500F9"
];


export default async function addUser(key: string, user: string): Promise<{
    id: number;
    username: string;
    avatarColor: string;
}> {
    const result = await client.GET(`${key}:users`) ?? "";
    const resultJSON = JSON.parse(result) as {
        id: number;
        username: string;
        avatarColor: string;
        cards: string[];
    }[];

    const lastId = resultJSON.map((user) => user.id).sort((a, b) => b - a)[0];
    const tempColors = colors.filter((color) => !resultJSON.map((user) => user.avatarColor).includes(color));

    const newUser = {
        id: lastId + 1,
        username: user,
        avatarColor: tempColors[Math.floor(Math.random() * tempColors.length)],
        cards: [],
    };
    resultJSON.push(newUser);

    await client.SET(`${key}:users`, JSON.stringify(resultJSON));

    return newUser;
}
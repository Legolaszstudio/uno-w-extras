import client from "./redis";

export default async function (key: string) {
    const result = await client.GET(`${key}:users`) ?? "";
    const resultJSON = JSON.parse(result) as {
        id: number;
        username: string;
        avatarColor: string;
        cards: string[];
    }[];

    return resultJSON;
}
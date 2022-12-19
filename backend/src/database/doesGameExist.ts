import client from "./redis";

export default async function(key: string): Promise<boolean> {
    const result = await client.GET(key);
    return result !== null;
}
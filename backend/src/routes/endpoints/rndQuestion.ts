import { FastifyReply, FastifyRequest } from "fastify";
import { questionBank } from "../../questionBank";

function toBinary(input: string) {
    const codeUnits = new Uint16Array(input.length);
    for (let i = 0; i < codeUnits.length; i++) {
        codeUnits[i] = input.charCodeAt(i);
    }
    return btoa(String.fromCharCode(...new Uint8Array(codeUnits.buffer)));
}

export default async function (
    request: FastifyRequest,
    reply: FastifyReply
) {
    const randomIndex = Math.floor(Math.random() * questionBank.length);
    const result = JSON.stringify(questionBank[randomIndex]);

    reply.status(200).send(toBinary(result));
}
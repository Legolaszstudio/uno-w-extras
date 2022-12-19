import { FastifyReply, FastifyRequest } from "fastify";

export default async function (
    request: FastifyRequest,
    reply: FastifyReply
) {
    reply.send("Alma");
}
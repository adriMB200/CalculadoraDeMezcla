import { neon } from '@netlify/neon';

export default async () => {
    const sql = neon();

    const posts = await sql`SELECT * FROM posts`;

    return new Response(JSON.stringify(posts), {
        headers: { "Content-Type": "application/json" }
    });
};
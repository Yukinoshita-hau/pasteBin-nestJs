import { createClient } from 'redis';

export async function redisConfig() {
	const client = createClient();
	client.on('error', (err: Error) => {
		console.log(err);
	});

	await client.connect();
	return client;
}

import { createClient } from 'redis';

export async function redisConfig() {
	const client = createClient({
		socket: {
			port: 6379,
			host: '127.0.0.1',
			tls: false,
		},
	});
	client.on('error', (err: Error) => {
		console.log(err);
	});

	await client.connect();
	return client;
}

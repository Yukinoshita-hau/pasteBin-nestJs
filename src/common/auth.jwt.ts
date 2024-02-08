import { sign } from 'jsonwebtoken';

export async function signJWT(email: string, secret: string): Promise<string> {
	return new Promise<string>((res, rej) => {
		sign(
			{
				email,
				iat: Math.floor(Date.now() / 1000),
			},
			secret,
			{
				algorithm: 'HS256',
			},
			(err, token) => {
				if (err) {
					rej(err);
				}
				res(token);
			},
		);
	});
}

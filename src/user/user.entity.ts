import { compare, hash } from 'bcryptjs';

export class User {
	private _password: string;
	constructor(
		private _name: string,
		private _email: string,
		PasswordHash?: string,
	) {
		if (PasswordHash) {
			this._password = PasswordHash;
		}
	}

	get password() {
		return this._password;
	}

	get name() {
		return this._name;
	}

	get email() {
		return this._email;
	}

	async setpassword(newPassword: string, salt: number): Promise<void> {
		this._password = newPassword;
		await this.hashPassword(salt);
	}

	async hashPassword(salt: number): Promise<void> {
		this._password = await hash(this._password, Number(salt));
	}

	async comparePassword(password: string): Promise<boolean> {
		return compare(password, this._password);
	}
}

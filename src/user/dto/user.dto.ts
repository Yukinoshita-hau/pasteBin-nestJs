import { IsEmail, IsString } from 'class-validator';

export class UserDto {
	@IsString({ message: 'incorrect name' })
	name: string;

	@IsEmail({}, { message: 'incorrect email' })
	email: string;

	@IsString({ message: 'incorrect password' })
	password: string;
}

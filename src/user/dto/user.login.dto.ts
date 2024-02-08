import { IsEmail, IsString } from 'class-validator';

export class UserLoginDto {
	@IsEmail({}, { message: 'incorrect email' })
	email: string;

	@IsString({ message: 'incorrect password' })
	password: string;
}

import { IsString } from 'class-validator';
import { UserSchema } from 'src/user/models/user.model';

export class TextDto {
	@IsString({ message: 'incorrect text' })
	text: string;

	@IsString({ message: 'incorrect user' })
	user: UserSchema;
}

import { IsNumber, IsString } from 'class-validator';

export class TextDto {
	@IsString({ message: 'incorrect text' })
	text: string;

	user: string;
	expire_at: Date;

	@IsNumber({}, { message: 'ttl are a number' })
	ttl: number;

	likes: number;
	dislikes: number;
}

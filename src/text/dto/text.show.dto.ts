import { IsString } from 'class-validator';

export class TextShowDto {
	@IsString({ message: 'incorrect id' })
	id: string;
}

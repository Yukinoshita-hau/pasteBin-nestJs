import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { TextDocument } from './text.model/text.model';
import { Model } from 'mongoose';
import { TextDto } from './dto/text.dto';
import { TextShowDto } from './dto/text.show.dto';

@Injectable()
export class TextService {
	constructor(
		@InjectModel('text') private textModel: Model<TextDocument>,
		@InjectModel('text') private userModel: Model<TextDocument>,
		private configSevice: ConfigService,
	) {}

	async createText(text: TextDto): Promise<TextDocument> {
		const newText = new this.textModel(text);
		return newText.save();
	}

	async findByIdText({ id }: TextShowDto): Promise<TextDocument | null> {
		const result = await this.textModel.findById(id);
		if (!result) {
			throw new HttpException('the text was not finded', 401);
		} else {
			return result;
		}
	}
}

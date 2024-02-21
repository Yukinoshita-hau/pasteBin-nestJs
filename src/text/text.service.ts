import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { TextDocument } from './text.model/text.model';
import { Model } from 'mongoose';
import { TextDto } from './dto/text.dto';
import { TextShowDto } from './dto/text.show.dto';
import { AuthInterface } from 'src/common/auth.interface';
import { verify } from 'jsonwebtoken';

@Injectable()
export class TextService {
	constructor(
		@InjectModel('text') private textModel: Model<TextDocument>,
		@InjectModel('user') private userModel: Model<TextDocument>,
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

	async deleteText(token: string, { id }: TextShowDto) {
		const jwtToken = token.split(' ')[1];
		let user: AuthInterface;
		verify(jwtToken, this.configSevice.get('SECRET'), async (err, decoded) => {
			if (typeof decoded !== 'string' && typeof decoded !== 'undefined') {
				user = decoded;
			}
		});

		const text = await this.textModel.findById(id);
		if (!text) {
			throw new HttpException('id text not found', 401);
		}

		const result = await this.userModel.findOne({ email: user.email });

		if (String(result._id) === String(text.user)) {
			return await this.textModel.findByIdAndDelete(id);
		} else {
			throw new HttpException('this text does not belong to you.', 400);
		}
	}

	async updateText(token: string, { id }: TextShowDto, newText: { text: string }) {
		const jwtToken = token.split(' ')[1];
		let user: AuthInterface;
		verify(jwtToken, this.configSevice.get('SECRET'), async (err, decoded) => {
			if (typeof decoded !== 'string' && typeof decoded !== 'undefined') {
				user = decoded;
			}
		});

		const result = await this.userModel.findOne({ email: user.email });

		const text = await this.textModel.findById(id);
		if (!text) {
			throw new HttpException('id text not found', 401);
		}

		if (String(result._id) === String(text.user)) {
			console.log(newText, id);
			return await this.textModel.findByIdAndUpdate(id, newText);
		} else {
			throw new HttpException('this text does not belong to you.', 400);
		}
	}
}

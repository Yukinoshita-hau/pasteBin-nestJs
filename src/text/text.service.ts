import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { TextDocument } from './text.model/text.model';
import { Model } from 'mongoose';
import { TextDto } from './dto/text.dto';
import { AuthInterface } from 'src/common/auth.interface';
import { verify } from 'jsonwebtoken';
import { redisConfig } from 'src/configs/redis.config';
import { yandexCloudstore } from 'src/configs/cloudstore.conf';
import { IYandexCloudstore } from 'src/configs/interfaces/cloudstore.inteface';

@Injectable()
export class TextService {
	private cloudstore: IYandexCloudstore = new yandexCloudstore();
	constructor(
		@InjectModel('text') private textModel: Model<TextDocument>,
		@InjectModel('user') private userModel: Model<TextDocument>,
		private configService: ConfigService,
	) {
		this.cloudstore.setsetting({
			region: configService.get('REGION'),
			credentials: {
				accessKeyId: configService.get('ACCESSKEYID'),
				secretAccessKey: configService.get('SECRETACCESSKEY'),
			},
			endpoint: configService.get('ENDPOINT'),
		});
	}

	async createText(authHeader: string, text: TextDto): Promise<TextDocument> {
		const userId = await this.getIdJwt(authHeader);
		text.user = userId;
		if (text.ttl) {
			text.expire_at = new Date(Date.now() + text.ttl * 1000);
		}
		text.likes = 0;
		text.dislikes = 0;
		const newText = new this.textModel(text);
		await this.cloudstore.addItemIntoBucket('texts', `${String(newText._id)}.txt`, text.text);
		newText.save();
		return newText;
	}

	async findCachedByIdText(id: string): Promise<TextDocument | null> {
		const redis = await redisConfig();
		const text = await redis.get(id);
		if (text) {
			console.log(text);
			return JSON.parse(text) as TextDocument;
		} else {
			const result = await this.findByIdText(id);
			if (result) {
				const userStr = String(result.user);
				result.user = userStr;
				console.log(result);
				await redis.setEx(id, 20, JSON.stringify(result));
				return result;
			}
			return null;
		}
	}

	async findByIdText(id: string): Promise<TextDocument | null> {
		const result = await this.textModel.findById(id);
		const text = await this.cloudstore.readBucketItem('texts', `${result._id}.txt`);
		result.text = text;

		if (!result) {
			throw new HttpException('the text was not finded', 404);
		} else {
			return result;
		}
	}

	async deleteText(token: string, id: string) {
		const jwtToken = token.split(' ')[1];
		let user: AuthInterface;
		verify(jwtToken, this.configService.get('SECRET'), async (err, decoded) => {
			if (typeof decoded !== 'string' && typeof decoded !== 'undefined') {
				user = decoded;
			}
		});

		const text = await this.textModel.findById(id);
		if (!text) {
			throw new HttpException('id text not found', 404);
		}

		const result = await this.userModel.findOne({ email: user.email });

		if (String(result._id) === String(text.user)) {
			return await this.textModel.findByIdAndDelete(id);
		} else {
			throw new HttpException('this text does not belong to you.', 400);
		}
	}

	async updateText(token: string, id: string, newText: { text: string }) {
		const jwtToken = token.split(' ')[1];
		let user: AuthInterface;
		verify(jwtToken, this.configService.get('SECRET'), async (err, decoded) => {
			if (typeof decoded !== 'string' && typeof decoded !== 'undefined') {
				user = decoded;
			}
		});

		const result = await this.userModel.findOne({ email: user.email });

		const text = await this.textModel.findById(id);
		if (!text) {
			throw new HttpException('id text not found', 404);
		}

		if (String(result._id) === String(text.user)) {
			console.log(newText, id);
			return await this.textModel.findByIdAndUpdate(id, newText);
		} else {
			throw new HttpException('this text does not belong to you.', 400);
		}
	}

	async addLike(id: string): Promise<{ likes: number }> {
		await this.textModel.updateOne({ _id: id }, { $inc: { likes: 1 } });
		const text = await this.findByIdText(id);
		if (!text) {
			throw new HttpException('the text was not finded', 404);
		}
		return { likes: text.likes };
	}

	async subtractLike(id: string): Promise<{ likes: number }> {
		await this.textModel.updateOne({ _id: id }, { $inc: { likes: -1 } });
		const text = await this.findByIdText(id);
		if (!text) {
			throw new HttpException('the text was not finded', 404);
		}
		return { likes: text.likes };
	}

	async addDislike(id: string): Promise<{ dislikes: number }> {
		await this.textModel.updateOne({ _id: id }, { $inc: { dislikes: 1 } });
		const text = await this.findByIdText(id);
		if (!text) {
			throw new HttpException('the text was not finded', 404);
		}
		return { dislikes: text.dislikes };
	}

	async subtractDislike(id: string): Promise<{ dislikes: number }> {
		await this.textModel.updateOne({ _id: id }, { $inc: { dislikes: -1 } });
		const text = await this.findByIdText(id);
		console.log(text);
		if (!text) {
			throw new HttpException('the text was not finded', 404);
		}
		return { dislikes: text.dislikes };
	}

	async getIdJwt(token: string): Promise<string> {
		const jwtToken = token.split(' ')[1];
		let userEmail: AuthInterface;
		verify(jwtToken, this.configService.get('SECRET'), async (err, decoded) => {
			if (typeof decoded !== 'string' && typeof decoded !== 'undefined') {
				userEmail = decoded;
			}
		});

		const user = await this.userModel.findOne({ email: userEmail.email });
		return String(user._id);
	}
}

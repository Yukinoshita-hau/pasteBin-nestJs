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
	private cloudstore: IYandexCloudstore = new yandexCloudstore(this.configService);
	constructor(
		@InjectModel('text') private textModel: Model<TextDocument>,
		@InjectModel('user') private userModel: Model<TextDocument>,
		private configService: ConfigService,
	) {}

	async createText(authHeader: string, text: TextDto): Promise<TextDocument> {
		try {
			const userId = await this.getIdJwt(authHeader);
			text.user = userId;
			if (text.ttl) {
				text.expire_at = new Date(Date.now() + text.ttl * 1000);
			}
			if (text.customId) {
				if (text.customId.length < 4 || text.customId.length > 25) {
					throw new HttpException(
						`The customid must be greater than 4 but less than 14 characters`,
						400,
					);
				}
			}
			text.likes = 0;
			text.dislikes = 0;
			text.hashing = false;
			text.views = 0;
			const newText = new this.textModel(text);
			await this.cloudstore.addItemIntoBucket('texts', `${String(newText._id)}.txt`, text.text);
			newText.save();
			return newText;
		} catch (err) {
			if (
				err instanceof Error &&
				err.message === 'The customid must be greater than 4 but less than 25 characters'
			) {
				throw new HttpException(
					`The customid must be greater than 4 but less than 25 characters`,
					400,
				);
			} else {
				if (err instanceof Error) {
					throw new HttpException(`${err.message}`, 400);
				}
			}
		}
	}

	async findCachedByIdText(id: string): Promise<TextDocument | null> {
		try {
			await this.textModel.updateOne({ _id: id }, { $inc: { views: 1 } });
			const redis = await redisConfig();
			const text = await redis.get(id);
			if (text) {
				return JSON.parse(text) as TextDocument;
			} else {
				const result = await this.findByIdText(id);
				if (result && result.hashing) {
					const userStr = String(result.user);
					result.user = userStr;
					await redis.setEx(id, 20, JSON.stringify(result));
					return result;
				}
				return result;
			}
		} catch (err) {
			throw new HttpException(`this text was not found`, 404);
		}
	}

	async findByIdText(id: string): Promise<TextDocument | null> {
		try {
			let result;
			if (await this.textModel.findOne({ customId: id })) {
				result = await this.textModel.findOne({ customId: id });
			} else {
				result = await this.textModel.findById(id);
			}
			const text = await this.cloudstore.readBucketItem('texts', `${result._id}.txt`);
			result.text = text;
			if (result.views > 500) {
				result.hashing = true;
			}
			return result;
		} catch (err) {
			throw new HttpException(`this text was not found`, 404);
		}
	}

	async updateCustomId(id: string, newCustomId: string) {
		try {
			if (newCustomId.length < 4 || newCustomId.length > 25) {
				throw new HttpException(
					`The customid must be greater than 4 but less than 25 characters`,
					400,
				);
			} else {
				const text = await this.findByIdText(id);
				text.customId = newCustomId;
				return await this.textModel.findByIdAndUpdate(text.id, text);
			}
		} catch (err) {
			if (
				err instanceof Error &&
				err.message === 'The customid must be greater than 4 but less than 25 characters'
			) {
				throw new HttpException(
					`The customid must be greater than 4 but less than 25 characters`,
					400,
				);
			} else {
				if (err instanceof Error) {
					console.log(err.message);
					throw new HttpException(`this text was not found`, 404);
				}
			}
		}
	}

	async deleteText(token: string, id: string) {
		try {
			const jwtToken = token.split(' ')[1];
			let user: AuthInterface;
			verify(jwtToken, this.configService.get('SECRET'), async (err, decoded) => {
				if (typeof decoded !== 'string' && typeof decoded !== 'undefined') {
					user = decoded;
				}
			});

			const text = await this.textModel.findById(id);

			const result = await this.userModel.findOne({ email: user.email });

			if (String(result._id) === String(text.user)) {
				return await this.textModel.findByIdAndDelete(id);
			} else {
				throw new HttpException('this text does not belong to you.', 400);
			}
		} catch (err) {
			throw new HttpException('invalid id', 400);
		}
	}

	async updateText(token: string, id: string, newText: { text: string }) {
		try {
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
				return await this.textModel.findByIdAndUpdate(id, newText);
			} else {
				throw new HttpException('this text does not belong to you.', 400);
			}
		} catch (err) {
			throw new HttpException('invalid id', 400);
		}
	}

	async addLike(id: string): Promise<{ likes: number }> {
		try {
			await this.textModel.updateOne({ _id: id }, { $inc: { likes: 1 } });
			const text = await this.findByIdText(id);
			if (!text) {
				throw new HttpException('the text was not finded', 404);
			}
			return { likes: text.likes };
		} catch (err) {
			throw new HttpException('invalid id', 400);
		}
	}

	async subtractLike(id: string): Promise<{ likes: number }> {
		try {
			await this.textModel.updateOne({ _id: id }, { $inc: { likes: -1 } });
			const text = await this.findByIdText(id);
			if (!text) {
				throw new HttpException('the text was not finded', 404);
			}
			return { likes: text.likes };
		} catch (err) {
			throw new HttpException('invalid id', 400);
		}
	}

	async addDislike(id: string): Promise<{ dislikes: number }> {
		try {
			await this.textModel.updateOne({ _id: id }, { $inc: { dislikes: 1 } });
			const text = await this.findByIdText(id);
			if (!text) {
				throw new HttpException('the text was not finded', 404);
			}
			return { dislikes: text.dislikes };
		} catch (err) {
			throw new HttpException('invalid id', 400);
		}
	}

	async subtractDislike(id: string): Promise<{ dislikes: number }> {
		try {
			await this.textModel.updateOne({ _id: id }, { $inc: { dislikes: -1 } });
			const text = await this.findByIdText(id);
			if (!text) {
				throw new HttpException('the text was not finded', 404);
			}
			return { dislikes: text.dislikes };
		} catch (err) {
			throw new HttpException('invalid id', 400);
		}
	}

	async getIdJwt(token: string): Promise<string> {
		try {
			const jwtToken = token.split(' ')[1];
			let userEmail: AuthInterface;
			verify(jwtToken, this.configService.get('SECRET'), async (err, decoded) => {
				if (typeof decoded !== 'string' && typeof decoded !== 'undefined') {
					userEmail = decoded;
				}
			});

			const user = await this.userModel.findOne({ email: userEmail.email });
			return String(user._id);
		} catch (err) {
			throw new HttpException('the user was not found', 404);
		}
	}
}

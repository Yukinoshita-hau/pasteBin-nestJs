import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, UserSchema } from './models/user.model';
import { Model } from 'mongoose';
import { User } from './user.entity';
import { ConfigService } from '@nestjs/config';
import { UserDto } from './dto/user.dto';
import { TextSchema } from 'src/text/text.model/text.model';
import { verify } from 'jsonwebtoken';

@Injectable()
export class UserService {
	constructor(
		@InjectModel('user') private userModel: Model<UserDocument>,
		private readonly configService: ConfigService,
	) {}

	async getByEmail(email: string): Promise<UserDocument | null> {
		const result = await this.userModel.findOne({ email: email });
		if (!result) {
			throw new HttpException('the user was not finded', 401);
		} else {
			return result;
		}
	}

	async createUser({ name, email, password }: UserDto): Promise<UserDocument> {
		const user = new User(name, email, password);
		await user.hashPassword(this.configService.get('SALT'));
		const existendUser = await this.userModel.findOne({ email: email });
		if (existendUser) {
			throw new HttpException('there is already such a user', 400);
		} else {
			const newUser = new this.userModel({
				name: user.name,
				email: user.email,
				password: user.password,
			});
			return newUser.save();
		}
	}

	async findWithText(header: string) {
		const jwtToken = header.split(' ')[1];
		let jwtEmail;
		verify(jwtToken, this.configService.get('SECRET'), async (err, decoded) => {
			if (typeof decoded !== 'string' && typeof decoded !== 'undefined') {
				jwtEmail = decoded.email;
			}
		});
		const result = (await this.userModel
			.aggregate([
				{
					$match: {
						email: jwtEmail,
					},
				},
				{
					$lookup: {
						from: 'texts',
						localField: '_id',
						foreignField: 'user',
						as: 'texts',
					},
				},
				{
					$addFields: {
						textCount: { $size: '$texts' },
					},
				},
			])
			.exec()) as unknown as (UserSchema & { texts: TextSchema[]; textCount: number })[];
		delete result[0].password;
		return result;
	}
}

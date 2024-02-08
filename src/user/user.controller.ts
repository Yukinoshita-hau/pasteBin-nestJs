import {
	Body,
	Controller,
	Get,
	Headers,
	HttpException,
	Post,
	Res,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { UserLoginDto } from './dto/user.login.dto';
import { signJWT } from 'src/common/auth.jwt';
import { ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import { Response } from 'express';

@Controller('user')
export class UserController {
	constructor(
		private usersService: UserService,
		private configservice: ConfigService,
	) {}

	@UsePipes(new ValidationPipe())
	@Post('register')
	async register(@Body() dto: UserDto): Promise<UserDto> {
		return this.usersService.createUser(dto);
	}

	@UsePipes(new ValidationPipe())
	@Post('login')
	async login(@Body() { email, password }: UserLoginDto, @Res() res: Response): Promise<object> {
		const newUser = await this.usersService.getByEmail(email);
		if (!newUser) {
			throw new HttpException('wrong e-mail', 400);
		}

		const existendUser = new User(newUser.name, newUser.email, newUser.password);
		const result = await existendUser.comparePassword(password);
		if (!result) {
			throw new HttpException('invalid password', 400);
		}
		const jwtToken = await signJWT(email, this.configservice.get('SECRET'));
		return res.json({ email: existendUser.email, jwt: jwtToken });
	}

	@Get('info')
	async find(@Headers('Authorization') header: string) {
		return this.usersService.findWithText(header);
	}
}

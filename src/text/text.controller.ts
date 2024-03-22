import {
	Body,
	Controller,
	Get,
	HttpException,
	Param,
	Post,
	Res,
	UseGuards,
	UsePipes,
	ValidationPipe,
	Headers,
	Delete,
	Patch,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextService } from './text.service';
import { TextDto } from './dto/text.dto';
import { JwtAuthGuard } from 'src/guards/auth.guard';
import { Response } from 'express';

@Controller('text')
export class TextController {
	constructor(
		private readonly configService: ConfigService,
		private readonly textService: TextService,
	) {}

	@UsePipes(new ValidationPipe())
	@Post('create')
	@UseGuards(JwtAuthGuard)
	async create(
		@Body() text: TextDto,
		@Res() res: Response,
		@Headers('Authorization') authHeader: string,
	): Promise<void> {
		const result = await this.textService.createText(authHeader, text);
		if (!result) {
			throw new HttpException('invalid token', 401);
		}
		res.json({ id: result._id, user: result.user });
		// res.redirect(`http://127.0.0.1:3000/api/text/${result._id}`);
	}

	@Get(':id')
	async getText(@Param('id') id: string, @Res() res: Response): Promise<void> {
		const text = await this.textService.findCachedByIdText(id);
		res.json({ text: text.text, id: text._id, user: text.user });
	}

	@UseGuards(JwtAuthGuard)
	@Delete('delete/:id')
	async deleteText(
		@Param('id') id: string,
		@Headers('Authorization') token: string,
	): Promise<void> {
		const jwt = await this.textService.getIdJwt(token);
		const user = await this.textService.findByIdText(id);
		console.log(jwt, String(user.user));
		if (jwt !== String(user.user)) {
			throw new HttpException("This text doesn't belong to you", 401);
		}
		const result = await this.textService.deleteText(token, id);
		console.log(result.id, result);
	}

	@UseGuards(JwtAuthGuard)
	@Patch('update/:id')
	async updateText(
		@Param('id') id: string,
		@Headers('Authorization') token: string,
		@Body() newTExt: { text: string },
	) {
		const jwt = await this.textService.getIdJwt(token);
		const user = await this.textService.findByIdText(id);
		console.log(jwt, String(user.user));
		if (jwt !== String(user.user)) {
			throw new HttpException("This text doesn't belong to you", 401);
		}
		const result = await this.textService.updateText(token, id, newTExt);
		return result;
	}

	@UseGuards(JwtAuthGuard)
	@Get('addlike/:id')
	async addlike(@Param('id') id: string, @Res() res: Response) {
		const result = await this.textService.addLike(id);
		res.json(result);
	}

	@UseGuards(JwtAuthGuard)
	@Get('subtractlike/:id')
	async subtractlike(@Param('id') id: string, @Res() res: Response) {
		const result = await this.textService.subtractLike(id);
		res.json(result);
	}

	@UseGuards(JwtAuthGuard)
	@Get('adddislike/:id')
	async addDislike(@Param('id') id: string, @Res() res: Response) {
		const result = await this.textService.addDislike(id);
		res.json(result);
	}

	@UseGuards(JwtAuthGuard)
	@Get('subtractdislike/:id')
	async subtractDislike(@Param('id') id: string, @Res() res: Response) {
		const result = await this.textService.subtractDislike(id);
		res.json(result);
	}
}

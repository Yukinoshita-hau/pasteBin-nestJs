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
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextService } from './text.service';
import { TextDocument } from './text.model/text.model';
import { TextShowDto } from './dto/text.show.dto';
import { TextDto } from './dto/text.dto';
import { JwtAuthGuard } from 'src/guards/auth.guard';
import { Response } from 'express';

@Controller('text')
export class TextController {
	constructor(
		private readonly configService: ConfigService,
		private textService: TextService,
	) {}

	@UsePipes(new ValidationPipe())
	@Post('create')
	@UseGuards(JwtAuthGuard)
	async create(@Body() text: TextDto, @Res() res: Response): Promise<void> {
		const result = await this.textService.createText(text);
		if (!result) {
			throw new HttpException('invalid token', 401);
		}
		res.redirect(`http://127.0.0.1:3000/api/text/${result._id}`);
	}

	@UsePipes(new ValidationPipe())
	@Post('show')
	async show(@Body() id: TextShowDto): Promise<TextDocument | null> {
		const result = await this.textService.findByIdText(id);
		if (!result) {
			throw new HttpException('the text was not finded', 401);
		}
		return result;
	}

	@Get(':id')
	async getText(@Param('id') id: string, @Res() res: Response): Promise<void> {
		const text = await this.textService.findByIdText({ id: id });
		res.json({ text: text.text, id: text._id });
	}
}

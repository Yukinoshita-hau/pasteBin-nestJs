import { Module } from '@nestjs/common';
import { TextController } from './text.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { textSchema } from './text.model/text.model';
import { TextService } from './text.service';
import { ConfigService } from '@nestjs/config';
import { userSchema } from 'src/user/models/user.model';

@Module({
	providers: [TextService, ConfigService, ],
	imports: [
		MongooseModule.forFeature([
			{ name: 'text', schema: textSchema },
			{ name: 'user', schema: userSchema },
		]),
	],
	controllers: [TextController],
})
export class TextModule {}

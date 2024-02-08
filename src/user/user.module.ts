import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { userSchema } from './models/user.model';
import { UserController } from './user.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
	providers: [UserService, ConfigService, JwtStrategy],
	imports: [
		MongooseModule.forFeature([{ name: 'user', schema: userSchema }]),
		PassportModule,
		ConfigModule,
	],
	controllers: [UserController],
})
export class UserModule {}

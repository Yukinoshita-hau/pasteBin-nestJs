import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';

export const UserEmail = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	const jwtToken: string = request.header('Authorization').split(' ')[1];
	const user = verify(jwtToken, new ConfigService().get('SECRET'));
	if (typeof user !== 'string') {
		return user.email;
	}
});

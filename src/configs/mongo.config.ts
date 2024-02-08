import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export async function getMongoConfig(configService: ConfigService): Promise<MongooseModuleOptions> {
	return {
		uri: getMongoString(configService),
	};
}

function getMongoString(configService: ConfigService): string {
	return (
		'mongodb+srv://' +
		configService.get('MONGO_LOGIN') +
		':' +
		configService.get('MONGO_PASSWORD') +
		'@' +
		configService.get('MONGO_DATABASE') +
		'.wedoqla.mongodb.net/' +
		configService.get('MONGO_LIBRARY') +
		'?retryWrites=true&w=majority'
	);
}

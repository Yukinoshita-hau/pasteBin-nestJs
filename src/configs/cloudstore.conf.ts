import {
	CreateBucketCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	paginateListObjectsV2,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { IYandexCloudstore } from './interfaces/cloudstore.inteface';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class yandexCloudstore implements IYandexCloudstore {
	private client: S3Client;

	constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
		this.client = new S3Client({
			region: configService.get('REGION'),
			credentials: {
				accessKeyId: configService.get('ACCESSKEYID'),
				secretAccessKey: configService.get('SECRETACCESSKEY'),
			},
			endpoint: configService.get('ENDPOINT'),
		});
	}

	setsetting(setting: object) {
		this.client = new S3Client(setting);
	}

	async createBucket(bucketName: string) {
		await this.client.send(
			new CreateBucketCommand({
				Bucket: bucketName,
			}),
		);
	}

	async addItemIntoBucket(bucketName: string, itemName: string, itemBody: string) {
		await this.client.send(
			new PutObjectCommand({
				Bucket: bucketName,
				Key: itemName,
				Body: itemBody,
			}),
		);
	}

	async readBucketItem(bucketName: string, itemName: string) {
		const { Body } = await this.client.send(
			new GetObjectCommand({
				Bucket: bucketName,
				Key: itemName,
			}),
		);
		return Body.transformToString();
	}

	async deleteAllItemIntoBucket(bucketName: string) {
		const paginator = paginateListObjectsV2({ client: this.client }, { Bucket: bucketName });
		for await (const page of paginator) {
			const objects = page.Contents;
			if (objects) {
				for (const object of objects) {
					await this.client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: object.Key }));
				}
			}
		}
	}
}

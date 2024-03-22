export interface IYandexCloudstore {
	setsetting(setting: object): any;
	createBucket(bucketName: string): any;
	addItemIntoBucket(bucketName: string, itemName: string, itemBody: string): any;
	readBucketItem(bucketName: string, itemName: string): any;
	deleteAllItemIntoBucket(bucketName: string): any;
}

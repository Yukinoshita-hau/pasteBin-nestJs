export interface YandexCloudstoreSetting {
	region: string;
	credentials: {
		accessKeyId: string;
		secretAccessKey: string;
	};
	endpoint: string;
}

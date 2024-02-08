import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<UserSchema>;

@Schema()
export class UserSchema {
	@Prop()
	id: string;

	@Prop({ requires: true })
	name: string;

	@Prop({ required: true })
	email: string;

	@Prop({ required: true })
	password: string;
}

export const userSchema = SchemaFactory.createForClass(UserSchema);

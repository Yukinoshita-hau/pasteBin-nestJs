import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MSchema, ObjectId } from 'mongoose';
import { UserSchema } from 'src/user/models/user.model';

export type TextDocument = HydratedDocument<TextSchema>;

@Schema({ timestamps: true })
export class TextSchema {
	_id: ObjectId | string;

	@Prop({ type: String })
	customId: string;

	@Prop({ type: MSchema.Types.ObjectId, ref: UserSchema.name })
	user: UserSchema | string;

	@Prop({ type: String, required: true })
	title: string;

	@Prop({ type: String, required: true })
	text: string;

	@Prop()
	expire_at: Date;

	@Prop({ required: true })
	ttl: number;

	@Prop({ required: true })
	likes: number;

	@Prop({ required: true })
	dislikes: number;
}

export const textSchema = SchemaFactory.createForClass(TextSchema);
textSchema.index({ expire_at: 1 }, { expireAfterSeconds: 0 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MSchema } from 'mongoose';
import { UserSchema } from 'src/user/models/user.model';

export type TextDocument = HydratedDocument<TextSchema>;

@Schema()
export class TextSchema {
	@Prop()
	id: string;

	@Prop({ required: true })
	text: string;

	@Prop({ type: MSchema.Types.ObjectId, ref: UserSchema.name })
	user: UserSchema;
}

export const textSchema = SchemaFactory.createForClass(TextSchema);

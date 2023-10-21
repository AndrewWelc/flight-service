import { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type FlightSourceDocument = HydratedDocument<FlightSource>;

@Schema()
export class FlightSource {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;
}

export const FlightSourceSchema = SchemaFactory.createForClass(FlightSource);

import { Module } from "@nestjs/common";
import { MenuController } from "./routes/menu.controller";

@Module({ controllers: [MenuController] })
export class AppModule {}

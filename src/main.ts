import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppFactory } from "./AppFactory";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const appLogger = new Logger();
  app.useLogger(appLogger);

  AppFactory.setupAppInstance(app);

  appLogger.debug(`Starting application with ${process.env.ENV} ENV`);

  if (process.env.DEBUG_APP === "true") {
    import("nestjs-spelunker")
      .then((sp) => {
        const tree = sp.SpelunkerModule.explore(app);
        const root = sp.SpelunkerModule.graph(tree);
        const edges = sp.SpelunkerModule.findGraphEdges(root);
        console.log("graph LR");
        const mermaidEdges = edges.map(
          ({ from, to }) => `  ${from.module.name}-->${to.module.name}`
        );
        console.log(mermaidEdges.join("\n"));
      })
      .catch((err) => {
        console.log(`Cannot load module nestjs-spelunker ${err}`);
      });
  }

  await app.listen(process.env.APP_PORT, () =>
    appLogger.log(`App listen at: ${process.env.APP_PORT}`, "Main")
  );
}
bootstrap();

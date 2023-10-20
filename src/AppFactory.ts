import {
    INestApplication,
    ValidationPipe,
    ValidationPipeOptions,
    VersioningType,
} from '@nestjs/common'
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger'

export class AppFactory {
    static setupAppInstance(app: INestApplication) {
        this.setupVersioning(app)
        this.setupValidation(app)
        if (process.env.ENV !== 'production') {
            this.setupCors(app)
            this.setupDocs(app)
        }
    }

    private static setupDocs(app: INestApplication) {
        const builder = new DocumentBuilder()
            .setTitle('Flight Service API')
            .setDescription('Documentation Flight Service API')
            .setVersion('1.0.0')
            .addTag('Open API')
            .setVersion('1.0')
            .build()

        const swaggerPath = '/api/docs'
       
        const document = SwaggerModule.createDocument(app, builder)
        const options: SwaggerCustomOptions = {
            swaggerOptions: { persistAuthorization: true },
        }
        SwaggerModule.setup(swaggerPath, app, document, options)
    }

    private static setupValidation(app: INestApplication) {
        const validationOptions: ValidationPipeOptions = {
            transform: true,
        }

        app.useGlobalPipes(new ValidationPipe(validationOptions))
    }

    private static setupCors(app: INestApplication) {
        app.enableCors({
            credentials: true,
            methods: process.env.CORS_METHODS || 'GET, PUT, POST, PATCH, DELETE, OPTIONS',
            origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [],
            allowedHeaders: process.env.CORS_HEADERS || 'Content-Type, Accept',
        })
    }

    private static setupVersioning(app: INestApplication) {
        app.enableVersioning({ type: VersioningType.URI })
    }
}

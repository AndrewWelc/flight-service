import mongoose, { Mongoose, Connection } from 'mongoose'
import * as dotenv from 'dotenv'

dotenv.config()

export const mongodbConnect = async (): Promise<Connection> => {
    let mongoConnection: Mongoose;
  
    if (process.env.MONGO_CERT_PATH) {
        mongoConnection = await mongoose.connect(process.env.MONGO_CONNECTION!, {
        tls: true,
        dbName: process.env.MONGO_DB,
        tlsCertificateKeyFile: process.env.MONGO_CERT_PATH,
        authMechanism: 'MONGODB-X509',
        autoCreate: true,
      });
    } else {
        mongoConnection = await mongoose.connect(process.env.MONGO_CONNECTION!, {
        dbName: process.env.MONGO_DB,
        autoCreate: true,
      });
    }
  
    return mongoConnection.connection;
  };

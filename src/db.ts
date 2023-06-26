import mongoose, { mongo } from "mongoose";
import logger from "./utils/logger";
import config from "./utils/config";

const mongoURL = config.MONGODB_URL;

const connectDB = async (): Promise<void> => {
  try {
    mongoose.set("strictQuery", true);

    if (mongoURL) {
      await mongoose.connect(mongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      } as any);
      logger.info("Connected to MongoDB");
    } else {
      logger.info("MongoDB URL is not defined");
    }
  } catch (err) {
    logger.info("Failed to connect to MongoDB", err);
  }
};

export default connectDB;

import logger from "./utils/logger";
import config from "./utils/config";
import connectDB from "./db";
import app from "./app";


const PORT = config.PORT;

//CONNECT DATABASE
connectDB();

app.listen(PORT, () => {
  logger.info(`Server is listening on port ${PORT}`);
});

process.on("unhandledRejection", (err: Error) => {
  logger.info(err.name, err.message);
  console.log("UNHANDLED REJECTION, SHUTTING DOWN APP");
  process.exit(1);
});

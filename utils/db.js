const mongoose = require("mongoose");
const logger = require("./logs");
mongoose.set('strictQuery', false);
mongoose.set('strictPopulate', false);

logger.info("Connecting to Database...");
module.exports.openDBConnection = async (url) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      const connection = await mongoose.connect(url);
      logger.info("Connected to MongoDB DataBase");
      return connection;
    } catch (err) {
      logger.error(
        "MongoDB connection error. Please make sure MongoDB is running. "
      );
      throw new Error(err);
    }
  }
};

module.exports.closeDBConnection = async (db) => {
  if (db) {
    await db.disconnect();
    logger.info("Connection closed");
  }
};

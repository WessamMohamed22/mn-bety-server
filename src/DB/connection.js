import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.log("DB connection is failed!");
    console.log(`ERROR - from connectDB: ${error.message}!`);
  }
};

export const disconnectDB = async () => {
  await mongoose.connection.close();
  console.info("MongoDB disconnected");
};

export default connectDB;

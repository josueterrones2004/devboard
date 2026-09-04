import mongoose from "mongoose";

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is not defined in the environment variables",
    );
  }

  await mongoose.connect(mongoUri);

  console.log(
    `MongoDB connected: ${mongoose.connection.host}`,
  );
}

export default connectDatabase;
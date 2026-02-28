import mongoose from "mongoose";

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://akshaykhatke2594_db_user:ws8VjFt2QbGhWxAz@akshaydev.t9x49xg.mongodb.net/devtinder"
  );
};

export default connectDB;


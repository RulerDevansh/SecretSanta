const mongoose = require('mongoose');

let cached = global._mongoose;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  mongoose.set('strictQuery', true);

  if (cached?.conn) {
    return cached.conn;
  }
  if (!cached) cached = global._mongoose = { conn: null, promise: null };
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 5000 })
      .then((m) => {
        console.log('MongoDB connected');
        return m;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;

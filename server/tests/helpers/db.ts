import mongoose from 'mongoose';

export async function connectTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI as string);
}

export async function clearTestDb(): Promise<void> {
  const collections = Object.values(mongoose.connection.collections);

  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

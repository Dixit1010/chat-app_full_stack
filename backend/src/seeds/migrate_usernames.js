import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

const generateBaseUsername = (email) => {
  const localPart = email.split("@")[0].toLowerCase();
  const validUsername = localPart.replace(/[^a-z0-9_.]/g, "");
  if (validUsername.length < 3) {
    return validUsername.padEnd(3, "0");
  }
  return validUsername.substring(0, 20);
};

const migrateUsernames = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for username migration");

    const users = await User.find({ username: { $exists: false } });
    console.log(`Found ${users.length} users missing usernames`);

    const usedUsernames = new Set();
    const existingUsersWithUsernames = await User.find({ username: { $exists: true } });
    existingUsersWithUsernames.forEach(u => usedUsernames.add(u.username));

    let updatedCount = 0;

    for (const user of users) {
      const base = generateBaseUsername(user.email);
      let username = base;
      let counter = 1;

      while (usedUsernames.has(username)) {
        const suffix = String(counter);
        if (base.length + suffix.length > 20) {
          username = base.substring(0, 20 - suffix.length) + suffix;
        } else {
          username = base + suffix;
        }
        counter++;
      }

      usedUsernames.add(username);
      user.username = username;
      user.about = "Hey there! I am using Chatty";
      await user.save();
      updatedCount++;
      console.log(`Updated user ${user.email} -> ${username}`);
    }

    console.log(`Migration complete. Updated ${updatedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateUsernames();

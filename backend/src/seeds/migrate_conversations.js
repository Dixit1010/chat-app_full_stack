import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const messages = await Message.find({ conversationId: { $exists: false } });
    console.log(`Found ${messages.length} messages to migrate.`);

    const pairs = new Map();

    for (const msg of messages) {
      if (!msg.senderId || !msg.receiverId) continue;
      
      const s = msg.senderId.toString();
      const r = msg.receiverId.toString();
      
      // sort to ensure consistent pair key regardless of who sent
      const [u1, u2] = [s, r].sort();
      const key = `${u1}_${u2}`;

      if (!pairs.has(key)) {
        pairs.set(key, { participants: [u1, u2], messages: [] });
      }
      pairs.get(key).messages.push(msg._id);
    }

    console.log(`Found ${pairs.size} unique 1:1 conversations to create.`);

    for (const [key, data] of pairs.entries()) {
      let conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: data.participants, $size: 2 }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: data.participants,
          isGroup: false
        });
        console.log(`Created conversation ${conversation._id} for ${key}`);
      }

      await Message.updateMany(
        { _id: { $in: data.messages } },
        { 
          $set: { conversationId: conversation._id },
          $unset: { receiverId: "" }
        }
      );
      console.log(`Updated ${data.messages.length} messages for conversation ${conversation._id}`);
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();

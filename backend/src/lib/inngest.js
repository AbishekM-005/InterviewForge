import { Inngest } from "inngest";
import connectDB from "./db.js";
import User from "../models/User.js";
import ENV from "./env.js";
import { deleteStreamUser, upsertStreamUser } from "./stream.js";

export const inngest = new Inngest({
  id: "interviewForge",
  eventKey: ENV.INNGEST_EVENT_KEY,
  signingKey: ENV.INNGEST_SIGNING_KEY,
});

const deleteUserFromDB = inngest.createFunction(
  { id: "delete-user-from-db" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    await connectDB();

    const { id } = event.data;
    await User.deleteOne({ clerkId: id });

    await deleteStreamUser(id.toString());
  }
);
const syncUser = inngest.createFunction(
  { id: "sync-user" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    await connectDB();

    const { id, email_addresses, first_name, last_name, image_url } =
      event.data;
    const safeName = `${first_name || ""} ${last_name || ""}`.trim() || "User";
    const newUser = {
      clerkId: id,
      email: email_addresses[0]?.email_address,
      name: safeName,
      profileImage: image_url,
    };

    await User.findOneAndUpdate(
      { clerkId: id },
      { $set: newUser },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await upsertStreamUser({
      id: newUser.clerkId.toString(),
      name: newUser.name,
      image: newUser.profileImage,
    });

    //send user a welcome email
  }
);

export const functions = [syncUser, deleteUserFromDB];

import { clerkClient, requireAuth } from "@clerk/express";
import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const authData = typeof req.auth === "function" ? req.auth() : req.auth;
      const clerkId = authData?.userId;
      if (!clerkId)
        return res.status(401).json({ msg: "Unauthorized - invalid token" });

      let user = await User.findOne({ clerkId });
      if (!user) {
        let clerkUser;
        try {
          clerkUser = await clerkClient.users.getUser(clerkId);
        } catch (fetchError) {
          console.error("Failed to fetch Clerk user: ", fetchError);
          return res.status(401).json({ msg: "User not found" });
        }

        const primaryEmail =
          clerkUser?.emailAddresses?.find(
            (email) => email.id === clerkUser.primaryEmailAddressId
          )?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress;

        if (!primaryEmail) {
          return res.status(400).json({ msg: "User email is missing" });
        }

        const safeName =
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          "User";

        user = await User.findOneAndUpdate(
          { clerkId },
          {
            $setOnInsert: {
              clerkId,
              email: primaryEmail,
              name: safeName,
              profileImage: clerkUser.imageUrl || "",
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await upsertStreamUser({
          id: user.clerkId.toString(),
          name: user.name,
          image: user.profileImage,
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Error in protectRoute middleware ", error);
      res.status(500).json({ msg: "Internal Server Error" });
    }
  },
];

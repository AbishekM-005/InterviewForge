import {
  SignInButton,
  SignOutButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/clerk-react";
import React from "react";
import toast from "react-hot-toast";

const HomePage = () => {
  axios.get("/session");
  return (
    <div>
      <button
        onClick={() => toast.success("This is a success")}
        className="btn btn-secondary"
      >
        Click Me
      </button>

      <SignedOut>
        <SignInButton mode="modal">
          <button>Login</button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <SignOutButton />
      </SignedIn>

      <UserButton />
    </div>
  );
};

export default HomePage;

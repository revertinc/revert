import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";

async function ClerkButton() {
  const user = await currentUser();
  return (
    <div className="flex items-center pl-2 h-12">
      <UserButton />
      <p className="ml-3 hidden md:block">{user?.fullName ?? "User Name"}</p>
    </div>
  );
}

export default ClerkButton;

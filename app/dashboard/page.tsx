

import { currentUser } from "@clerk/nextjs/server";

import LeftSidebar from "./components/sidebar/LeftSidebar";
import RightSidebar from "./components/sidebar/RightSidebar";
import FlowCanvas from "./components/canvas/FlowCanvas";
import Topbar from "./components/topbar/Topbar";

export default async function DashboardPage() {
  const user = await currentUser();

  const displayName =
    user?.firstName ||
    user?.fullName ||
    user?.emailAddresses[0]?.emailAddress ||
    "User";

  return (
    <div className="h-screen flex bg-black text-white">
      <LeftSidebar />

      <div className="flex-1 flex flex-col">
        <Topbar displayName={displayName} />

        <div className="flex-1">
          <FlowCanvas />
        </div>
      </div>

      <RightSidebar />
    </div>
  );
}

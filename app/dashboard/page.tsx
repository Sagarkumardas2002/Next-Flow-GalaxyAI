// import { currentUser } from "@clerk/nextjs/server";
// import { ReactFlowProvider } from "@xyflow/react";

// import LeftSidebar from "./components/sidebar/LeftSidebar";
// import RightSidebar from "./components/sidebar/RightSidebar";
// import FlowCanvas from "./components/canvas/FlowCanvas";
// import Topbar from "./components/topbar/Topbar";

// export default async function DashboardPage() {
//   const user = await currentUser();

//   const displayName =
//     user?.firstName ||
//     user?.fullName ||
//     user?.emailAddresses[0]?.emailAddress ||
//     "User";

//   return (
//     <div className="h-screen flex bg-black text-white">
//       {/* LEFT */}
//       <LeftSidebar />

//       {/* CENTER */}
//       <div className="flex-1 flex flex-col">
//         {/* TOPBAR */}
//         <Topbar displayName={displayName} />

//         {/* CANVAS */}
//         <div className="flex-1">
//           <ReactFlowProvider>
//             <FlowCanvas />
//           </ReactFlowProvider>
//         </div>
//       </div>

//       {/* RIGHT */}
//       <RightSidebar />
//     </div>
//   );
// }

import { currentUser } from "@clerk/nextjs/server";
import { ReactFlowProvider } from "@xyflow/react";

import LeftSidebar from "./components/sidebar/LeftSidebar";
import RightSidebar from "./components/sidebar/RightSidebar";
import FlowCanvas from "./components/canvas/FlowCanvas";
import Topbar from "./components/topbar/Topbar";
// import TestSaveButton from "../api/workflow/TestSaveButton";

export default async function DashboardPage() {
  const user = await currentUser();

  const displayName =
    user?.firstName ||
    user?.fullName ||
    user?.emailAddresses[0]?.emailAddress ||
    "User";

  return (
    <div className="h-screen flex bg-black text-white">
      {/* LEFT */}
      <LeftSidebar />

      {/* CENTER */}
      <div className="flex-1 flex flex-col">
        {/* TOPBAR */}
        <Topbar displayName={displayName} />

        {/* <div className="p-2">
          <TestSaveButton />
        </div> */}

        {/* CANVAS */}
        <div className="flex-1">
          <ReactFlowProvider>
            <FlowCanvas />
          </ReactFlowProvider>
        </div>
      </div>

      {/* RIGHT */}
      <RightSidebar />
    </div>
  );
}

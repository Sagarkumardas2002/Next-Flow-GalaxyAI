

"use client";

import RightSidebarRunHistory from "./Rightsidebarrunhistory";
import RightSidebarWorkflows from "./Rightsidebarworkflows";

export default function RightSidebar() {
  return (
    <div className="w-[210px] min-w-[210px] bg-[#111] border-l border-[#222] flex flex-col">
      <RightSidebarWorkflows />
      <RightSidebarRunHistory />
    </div>
  );
}

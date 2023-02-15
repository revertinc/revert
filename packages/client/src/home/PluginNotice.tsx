import React from "react";

const PluginNotice = () => (
  <>
    <div className="flex p-4 mt-10 rounded bg-[#EAEAEA]">
      <span>
        💡 NOTE: You would need to export the designs in <b>.glb</b> format
        using an extension of your choice
        <a
          className="no-underline font-bold text-black-800 hover:text-blue-600 visited:text-black"
          href="https://extensions.sketchup.com/extension/052071e5-6c19-4f02-a7e8-fcfcc28a2fd8/gltf-exporter"
          target="_blank"
          rel="noreferrer"
        >
          {" "}
          such as this
        </a>{" "}
        for Sketchup.
      </span>
    </div>
  </>
);

export default PluginNotice;

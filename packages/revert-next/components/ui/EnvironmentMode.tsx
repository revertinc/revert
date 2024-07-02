"use client";

import { changeEnvironmentMode } from "@revertdotdev/lib/actions";
import { Icons } from "../icons";
import { Switch } from "./common/Switch";

function EnvironmentMode({
  isDefaultEnvironment,
}: {
  isDefaultEnvironment: boolean;
}) {
  return (
    <>
      <Icons.axe className="w-6 hidden md:block" />
      <label htmlFor="environment">Dev Mode</label>
      <Switch
        id="environment"
        className="md:ml-auto"
        checked={isDefaultEnvironment}
        onClick={() => changeEnvironmentMode()}
      />
    </>
  );
}

export default EnvironmentMode;

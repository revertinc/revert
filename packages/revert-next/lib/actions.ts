"use server";

import { cookies } from "next/headers";
import { DEFAULT_ENV } from "./constants";
import { revalidatePath } from "next/cache";

export async function changeEnvironmentMode() {
  const cookie = cookies();
  const currentMode =
    cookie.get("revert_environment_selected")?.value ?? DEFAULT_ENV;

  if (currentMode.includes(DEFAULT_ENV)) {
    cookie.set("revert_environment_selected", "production");
  } else {
    cookie.set("revert_environment_selected", "development");
  }

  // todo: revalidate every path later
  revalidatePath("/dashboard");
}

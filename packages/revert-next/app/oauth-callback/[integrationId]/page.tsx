"use client";
import { useConnection } from "@revertdotdev/hooks/useConnection";

export default function Page({
  params,
}: {
  params: { integrationId: string };
}) {
  const { integrationId } = params;
  const { isLoading, error, data } = useConnection(integrationId);

  return (
    <div>
      <h1>OAuthCallback: data: error:</h1>
      <p>Loading Status:</p>
    </div>
  );
}

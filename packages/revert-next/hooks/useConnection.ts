import { REVERT_BASE_API_URL } from "@revertdotdev/lib/constants";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useConnection(integrationId: string) {
  const searchParams = useSearchParams();
  const { code, state } = Object.fromEntries(searchParams.entries());
  const { tenantId, revertPublicToken, redirectUrl } = JSON.parse(state);

  // Todo: Add Integrations make this url to use URL object
  const { data, error, isLoading } = useSWR(
    `${REVERT_BASE_API_URL}/v1/ticket/oauth-callback?integrationId=${integrationId}&code=${code}&t_id=${tenantId}&x_revert_public_token=${revertPublicToken}${
      redirectUrl ? `&redirect_url=${redirectUrl}` : ``
    }`,
    fetcher
  );

  return {
    data,
    error,
    isLoading,
  };
}

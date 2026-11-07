import { TP_ID } from '@revert/Shared';
import axios from 'axios';
import qs from 'qs';
import config from '../../../../config';
import { CommonHandlerOutput } from './types';

export async function handleWorkdayAuth({
    code,
    environment,
    appConfig,
}: {
    code: string;
    environment?: string;
    appConfig?: {
        clientId?: string;
        clientSecret?: string;
        subdomain?: string;
        tenant?: string;
    };
}): Promise<CommonHandlerOutput> {
    const clientId = appConfig?.clientId ?? config.WORKDAY_CLIENT_ID;
    const clientSecret = appConfig?.clientSecret ?? config.WORKDAY_CLIENT_SECRET;
    const tokenUrl =
        appConfig?.subdomain && appConfig?.tenant
            ? `https://${appConfig.subdomain}.workday.com/ccx/oauth2/${appConfig.tenant}/token`
            : config.WORKDAY_TOKEN_URL;

    constbasicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const data = qs.stringify({
        grant_type: 'authorization_code',
        code,
    });

    const response = await axios.post(tokenUrl, data, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${constbasicAuth}`,
        },
    });

    return {
        tp_id: TP_ID.WORKDAY,
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        scope: response.data.scope,
    };
}

export async function refreshWorkdayToken({
    refreshToken,
    appConfig,
}: {
    refreshToken: string;
    appConfig?: {
        clientId?: string;
        clientSecret?: string;
        subdomain?: string;
        tenant?: string;
    };
}): Promise<CommonHandlerOutput> {
    const clientId = appConfig?.clientId ?? config.WORKDAY_CLIENT_ID;
    const clientSecret = appConfig?.clientSecret ?? config.WORKDAY_CLIENT_SECRET;
    const tokenUrl =
        appConfig?.subdomain && appConfig?.tenant
            ? `https://${appConfig.subdomain}.workday.com/ccx/oauth2/${appConfig.tenant}/token`
            : config.WORKDAY_TOKEN_URL;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const data = qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    });

    const response = await axios.post(tokenUrl, data, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
        },
    });

    return {
        tp_id: TP_ID.WORKDAY,
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token ?? refreshToken,
        scope: response.data.scope,
    };
}

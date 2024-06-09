import React from 'react';
import axiosInstance from '../axios';
import * as Sentry from '@sentry/react';

const useApi = () => {
    const [data, setData] = React.useState<any>();
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<number>();

    const fetch = async ({
        url,
        method,
        payload,
        params,
    }: {
        url: string;
        method: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
        payload?: any;
        params?: any;
    }) => {
        setLoading(true);
        try {
            const result = await axiosInstance({ url, method, data: payload, params });

            setData(result.data);
            setStatus(result.status);
        } catch (err: any) {
            Sentry.captureException(err);
            setData(err?.response?.data);
            setStatus(err?.response?.status || 500);
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, status, fetch };
};

export { useApi };

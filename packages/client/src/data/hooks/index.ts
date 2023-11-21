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
    }: {
        url: string;
        method: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
        payload: any;
    }) => {
        setLoading(true);
        try {
            const result = await axiosInstance({ url, method, data: payload });

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

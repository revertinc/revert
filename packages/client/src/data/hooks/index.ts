import React from 'react';
import axiosInstance from '../axios';

const useApi = () => {
    const [data, setData] = React.useState();
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<number>();

    const fetch = async ({ url, method, payload }) => {
        setLoading(true);
        try {
            const result = await axiosInstance({ url, method, data: payload });
            setData(result.data);
            setStatus(result.status);
        } catch (err: any) {
            setData(err?.response?.data);
            setStatus(err?.response?.status || 500);
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, status, fetch };
};

export { useApi };

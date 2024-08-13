/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: '/packages/revert-next',
    webpack: (config) => {
        return config;
    },

    async redirects() {
        return [
            {
                source: '/',
                destination: '/dashboard',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;

import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    '950': '#0A0E17',
                },
                accent: {
                    '400': '#0E2458',
                    '500': '#2689FD',
                },
                shade: {
                    '800': '#081b33',
                },
                gray: {
                    '25': 'rgba(249, 250, 251, 0.15)',
                },
                tremor: {
                    content: {
                        DEFAULT: colors.gray[500],
                    },
                },
            },
        },
        keyframes: {
            shimmer: {
                '100%': {
                    transform: 'translateX(100%)',
                },
            },
        },
    },
    plugins: [],
};
export default config;

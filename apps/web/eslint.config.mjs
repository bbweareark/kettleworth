import nextVitals from "eslint-config-next/core-web-vitals";

const config = [...nextVitals, { ignores: [".next/**", "public/sw.js"] }];
export default config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // prompts/*.md 파일을 lambda 번들에 포함시킴.
  // lib/prompts/interpret.ts가 fs.readFileSync로 런타임에 읽기 때문에
  // Next.js 정적 분석이 추적하지 못해 명시적으로 포함시켜야 함.
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./prompts/**/*'],
    },
  },
};

export default nextConfig;

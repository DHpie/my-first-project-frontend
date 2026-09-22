import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 配置 —— homepage-hero E2E 测试
 *
 * 约束（来自任务要求）：
 * - 测试 URL：http://localhost:3000
 * - 桌面视口：1280x720（默认）；移动端视口：375x667（在 spec 内通过 test.use 覆盖）
 * - 单个测试超时：30 秒
 * - 测试失败时自动截图保存（screenshot: "only-on-failure"）
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  // 单 worker 串行执行：本套件含 LCP 性能断言（S17），
  // 并行会造成 CPU 争用使 LCP 虚高、并使时序敏感用例抖动。
  // 如需提速且不含性能测试，可将 workers 调高并开启 fullyParallel。
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  // 失败产物（截图 / trace / video）输出目录
  outputDir: "./test-results",
  use: {
    baseURL: "http://localhost:3000",
    // 桌面视口默认值
    viewport: { width: 1280, height: 720 },
    // 失败时自动截图并保存到 test-results/
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
    },
  ],
  // 自动拉起 Next.js 开发服务器；若已在运行则复用
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

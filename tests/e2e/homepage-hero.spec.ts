import { test, expect } from "@playwright/test";

/**
 * E2E 测试 —— homepage-hero
 * 规格来源: openspec/specs/homepage-hero/spec.md
 *
 * 覆盖 spec.md 中全部 WHEN/THEN 场景（共 17 个 Scenario），
 * 每个 Scenario 对应一个独立 test() 块，块首注释标注编号与 WHEN/THEN。
 *
 * 技术约束:
 * - 测试 URL: http://localhost:3000（baseURL 见 playwright.config.ts）
 * - 桌面视口 1280x720（默认） | 移动端视口 375x667（见 "移动端视口" describe）
 * - 单测超时 30s（见 config）
 * - beforeEach 统一处理页面导航
 * - 失败自动截图（config: screenshot "only-on-failure" → test-results/）
 *
 * 说明: /search 路由在本 spec 属 Out of Scope（"搜索结果页实现"），
 * 因此涉及导航的场景仅断言 URL 变化，不断言目标页内容。
 */

const HEADLINE = "Discover China Like a Local";
const SUBTITLE = "Your AI-powered travel companion for exploring China";
const PLACEHOLDER = "Search destinations, tips, or ask AI...";
const ARIA_LABEL = "Search destinations, tips, or ask AI";

// 常用定位器工厂，保持各 test 内选择器一致
const hero = (page: import("@playwright/test").Page) =>
  page.locator('section[aria-label="Hero"]');
const searchInput = (page: import("@playwright/test").Page) =>
  page.getByLabel(ARIA_LABEL);
const searchButton = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: "Search", exact: true });
// 校验提示：限定为 <p role="alert">，避免命中 Next.js 的 __next-route-announcer__（同为 role=alert）
const alert = (page: import("@playwright/test").Page) =>
  page.locator('p[role="alert"]');

test.describe("Homepage Hero — E2E (spec: homepage-hero)", () => {
  // beforeEach 统一处理页面导航，并等待 Hero 区渲染完成
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(hero(page)).toBeVisible();
    await expect(page.locator("h1")).toHaveText(HEADLINE);
  });

  // ==========================================================================
  // 桌面视口 (1280x720, 默认)
  // ==========================================================================

  // S1 | Scenario「图片正常加载」
  // WHEN 首页加载 AND 背景图源 URL 有效且可达
  // THEN next/image 以 fill 铺满全宽 AND priority 禁用懒加载 AND 桌面容器 min-height 500px
  test("S1 [图片正常加载] fill + priority + 桌面容器高度", async ({ page }) => {
    const img = hero(page).locator("img").first();
    await expect(img).toBeVisible();

    // fill: 绝对定位铺满容器
    await expect(img).toHaveCSS("position", "absolute");
    await expect(img).toHaveCSS("object-fit", "cover");
    const imgBox = await img.boundingBox();
    const heroBox = await hero(page).boundingBox();
    expect(imgBox).not.toBeNull();
    expect(heroBox).not.toBeNull();
    expect(imgBox!.width).toBeGreaterThanOrEqual(heroBox!.width - 2);

    // priority: Next 15 通过 preload link 表达优先级（img 不带 fetchpriority 属性），
    // 断言存在指向背景图的 preload，且未使用懒加载
    const preloadSources = await page
      .locator('link[rel="preload"][as="image"]')
      .evaluateAll((els) =>
        els.map((e) => {
          const link = e as HTMLLinkElement;
          // fill/srcset 型 preload 使用 imagesrcset 而非 href
          return `${link.href} ${link.getAttribute("imagesrcset") ?? ""}`;
        }),
      );
    expect(preloadSources.some((src) => src.includes("hero"))).toBe(true);
    await expect(img).not.toHaveAttribute("loading", "lazy");

    // 桌面端容器最小高度 500px
    await expect(hero(page)).toHaveCSS("min-height", "500px");
  });

  // S2 | Scenario「图片加载失败」
  // WHEN 背景图加载失败（网络错误或资源缺失）
  // THEN 显示纯色回退背景 #1a1a2e AND 所有前景内容保持可见
  test("S2 [图片加载失败] 回退色 #1a1a2e + 前景内容可见", async ({ page }) => {
    // 拦截并中止背景图请求，触发 next/image 的 onError → 回退。
    // 注意：next/image 实际请求优化器地址 /_next/image?url=/hero.png，而非 /hero.png
    await page.route(
      (url) =>
        url.pathname === "/hero.png" ||
        url.searchParams.get("url") === "/hero.png",
      (route) => route.abort(),
    );
    await page.reload();
    await expect(hero(page)).toBeVisible();

    // 破图被移除
    await expect(hero(page).locator("img")).toHaveCount(0);

    // 回退背景色 #1a1a2e = rgb(26, 26, 46)
    const fallback = hero(page).locator(".bg-\\[\\#1a1a2e\\]").first();
    await expect(fallback).toHaveCSS("background-color", "rgb(26, 26, 46)");

    // 前景内容仍可见可读
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText(SUBTITLE)).toBeVisible();
    await expect(searchInput(page)).toBeVisible();
  });

  // S4 | Scenario「桌面端图片定位」
  // WHEN 视口宽度 >= 768px
  // THEN object-position: center center AND 容器 min-height 500px
  test("S4 [桌面端图片定位] object-position center center + min-height 500", async ({
    page,
  }) => {
    const img = hero(page).locator("img").first();
    await expect(img).toBeVisible();
    await expect(img).toHaveCSS("object-position", "50% 50%"); // center center
    await expect(hero(page)).toHaveCSS("min-height", "500px");
  });

  // S5 | Scenario「标题可见性」
  // WHEN Hero 区被渲染
  // THEN <h1> 文本精确为 HEADLINE AND 使用响应式字号
  test("S5 [标题可见性] <h1> 文本 + 响应式字号", async ({ page }) => {
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText(HEADLINE);

    const cls = (await h1.getAttribute("class")) ?? "";
    expect(cls).toContain("text-3xl");
    expect(cls).toContain("md:text-5xl");
    expect(cls).toContain("lg:text-6xl");
  });

  // S6 | Scenario「副标题可见性」
  // WHEN Hero 区被渲染
  // THEN <p> 文本精确为 SUBTITLE AND 使用响应式字号
  test("S6 [副标题可见性] <p> 文本 + 响应式字号", async ({ page }) => {
    const subtitle = hero(page)
      .locator("p")
      .filter({ hasText: SUBTITLE })
      .first();
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toHaveText(SUBTITLE);

    const cls = (await subtitle.getAttribute("class")) ?? "";
    expect(cls).toContain("text-base");
    expect(cls).toContain("md:text-lg");
  });

  // S7 | Scenario「搜索框存在」
  // WHEN Hero 区被渲染
  // THEN 搜索框可见 + placeholder + aria-label AND 搜索图标按钮位于输入框右侧
  test("S7 [搜索框存在] placeholder/aria-label + 右侧图标按钮", async ({ page }) => {
    const input = searchInput(page);
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("placeholder", PLACEHOLDER);
    await expect(input).toHaveAttribute("aria-label", ARIA_LABEL);

    const button = searchButton(page);
    await expect(button).toBeVisible();
    // lucide-react Search 图标（svg）位于按钮内
    await expect(button.locator("svg")).toBeVisible();

    // 按钮位于输入框右侧
    const inputBox = await input.boundingBox();
    const buttonBox = await button.boundingBox();
    expect(inputBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.x).toBeGreaterThan(inputBox!.x);
  });

  // S8 | Scenario「用户提交搜索」
  // WHEN 用户输入 "Chengdu" AND 按下 Enter（或点击搜索按钮）
  // THEN 导航至 /search?q=Chengdu AND 输入框保留已输入查询文本
  test("S8 [用户提交搜索] Enter → /search?q=Chengdu", async ({ page }) => {
    const input = searchInput(page);
    await input.fill("Chengdu");
    // 提交前输入框保留查询文本（受控组件）
    await expect(input).toHaveValue("Chengdu");

    await input.press("Enter");

    // 断言导航到 /search?q=Chengdu（/search 页面本身属 Out of Scope）
    await page.waitForURL(/\/search\?q=Chengdu/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("q")).toBe("Chengdu");
  });

  // S9 | Scenario「空搜索提交」
  // WHEN 用户提交空输入的搜索表单
  // THEN 不导航 AND 显示校验提示 "Please enter a search term"
  test("S9 [空搜索提交] 不导航 + 校验提示", async ({ page }) => {
    await searchButton(page).click();

    await expect(alert(page)).toHaveText("Please enter a search term");
    // 未发生导航：仍停留在首页
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe("/");
  });

  // S10 | Scenario「纯空白搜索提交」
  // WHEN 用户提交仅含空白字符的输入（如 "   "）
  // THEN 视为空输入 AND 不导航 AND 显示校验提示
  test("S10 [纯空白搜索提交] 视为空输入 + 校验提示", async ({ page }) => {
    const input = searchInput(page);
    await input.fill("   ");
    await input.press("Enter");

    await expect(alert(page)).toHaveText("Please enter a search term");
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe("/");
  });

  // S11 | Scenario「搜索输入最大长度」
  // WHEN 用户输入或粘贴超过 200 字符的文本
  // THEN 拒绝超出 200 字符的输入 AND 显示 "Search query is too long (max 200 characters)"
  test("S11 [搜索输入最大长度] 拒绝 >200 字符 + 提示", async ({ page }) => {
    const input = searchInput(page);
    await input.fill("a".repeat(201));

    await expect(alert(page)).toHaveText(
      "Search query is too long (max 200 characters)",
    );
    // 受控输入拒绝超限内容，实际值不超过 200
    const value = await input.inputValue();
    expect(value.length).toBeLessThanOrEqual(200);
  });

  // S12 | Scenario「XSS 安全渲染」
  // WHEN 搜索输入包含 HTML 或脚本内容（如 <script>alert(1)</script>）
  // THEN 以纯文本渲染不执行脚本 AND 导航 URL 查询参数经过正确 URL 编码
  test("S12 [XSS 安全渲染] 纯文本渲染 + URL 编码", async ({ page }) => {
    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    const payload = "<script>alert(1)</script>";
    const input = searchInput(page);
    await input.fill(payload);
    // 以纯文本作为输入值呈现，未被解析为 HTML
    await expect(input).toHaveValue(payload);

    await input.press("Enter");
    await page.waitForURL(/\/search/);

    const url = new URL(page.url());
    // 解码后与原 payload 一致
    expect(url.searchParams.get("q")).toBe(payload);
    // 原始 URL 已对特殊字符进行编码
    expect(page.url()).toContain("%3Cscript%3E");
    // 未执行任何脚本（无对话框弹出）
    expect(dialogs).toHaveLength(0);
  });

  // S13 | Scenario「搜索框焦点」
  // WHEN 用户点击或 Tab 至搜索输入框
  // THEN 输入框获得焦点并显示可见焦点环（focus-visible:ring-2）
  test("S13 [搜索框焦点] 获得焦点 + 可见焦点环", async ({ page }) => {
    const input = searchInput(page);
    await input.click();
    await expect(input).toBeFocused();

    // 文本输入在聚焦时匹配 :focus-visible
    const focusVisible = await input.evaluate((el) =>
      el.matches(":focus-visible"),
    );
    expect(focusVisible).toBe(true);

    // 焦点环以 box-shadow 呈现（ring-2），非 none
    const boxShadow = await input.evaluate((el) =>
      getComputedStyle(el).boxShadow,
    );
    expect(boxShadow).not.toBe("none");
    expect(boxShadow.length).toBeGreaterThan(0);
  });

  // S14 | Scenario「防止重复提交」
  // WHEN 导航进行中用户点击搜索按钮
  // THEN 系统不触发重复导航
  test("S14 [防止重复提交] 导航进行中不重复触发", async ({ page }) => {
    const input = searchInput(page);
    const button = searchButton(page);

    // 挂起 /search 请求，使导航保持"进行中"，Hero 不被卸载
    let searchHits = 0;
    await page.route("**/search**", async (route) => {
      searchHits += 1;
      // 故意不 fulfill，令导航处于 pending 状态
      await new Promise<void>(() => {});
      void route;
    });

    await input.fill("Chengdu");
    const before = searchHits;
    await button.click();

    // 导航进行中：按钮被禁用（去重守卫）
    await expect(button).toBeDisabled();

    // 尝试第二次点击（禁用状态下应无效，容错处理）
    await button
      .click({ force: true, timeout: 1_000 })
      .catch(() => undefined);

    await page.waitForTimeout(300);
    // 仅触发一次导航请求，无重复
    expect(searchHits - before).toBe(1);
  });

  // S16 | Scenario「桌面端布局」
  // WHEN 视口宽度 >= 768px（md 断点）
  // THEN 居中布局 + 标题 text-5xl AND 内容容器 max-width 1200px + 水平自动外边距
  test("S16 [桌面端布局] 居中 + max-w-1200 + text-5xl", async ({ page }) => {
    const overlay = hero(page).locator("div.relative.z-10").first();
    await expect(overlay).toHaveCSS("max-width", "1200px");
    await expect(overlay).toHaveCSS("align-items", "center"); // 居中布局

    const overlayCls = (await overlay.getAttribute("class")) ?? "";
    expect(overlayCls).toContain("md:mx-auto"); // 水平自动外边距

    const h1 = page.locator("h1");
    const h1Cls = (await h1.getAttribute("class")) ?? "";
    expect(h1Cls).toContain("md:text-5xl");
    // 桌面字号 >= text-5xl(48px)；lg 断点(≥1024)会提升至 text-6xl(60px)
    const fontSize = await h1.evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize),
    );
    expect(fontSize).toBeGreaterThanOrEqual(48);
  });

  // S17 | Scenario「LCP 目标」（chromium + CDP 网络/CPU 节流）
  // WHEN 首页在模拟 4G 连接（Moto G Power 配置）下加载
  // THEN LCP < 2.5 秒 AND 背景图通过 priority 预加载
  test("S17 [LCP 目标] 模拟 4G(Moto G Power) 下 LCP < 2.5s", async ({ page }) => {
    const client = await page.context().newCDPSession(page);

    // 4G 网络节流（Lighthouse "Slow 4G": ~1.6Mbps 下 / 750Kbps 上 / 150ms RTT）
    await client.send("Network.enable");
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
    // Moto G Power 4x CPU 节流
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    // 在导航前注入 LCP 采集脚本
    await page.addInitScript(() => {
      (window as unknown as { __LCP__: number }).__LCP__ = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          (window as unknown as { __LCP__: number }).__LCP__ =
            entries[entries.length - 1].startTime;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });

    // 在节流条件下重新加载首页
    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(3_000); // 等待 LCP 稳定

    const lcp = await page.evaluate(
      () => (window as unknown as { __LCP__: number }).__LCP__,
    );
    expect(lcp).toBeGreaterThan(0);
    expect(lcp).toBeLessThan(2_500);

    // 背景图通过 priority 预加载（存在指向 hero 的 preload link）
    const preloadSources = await page
      .locator('link[rel="preload"][as="image"]')
      .evaluateAll((els) =>
        els.map((e) => {
          const link = e as HTMLLinkElement;
          // fill/srcset 型 preload 使用 imagesrcset 而非 href
          return `${link.href} ${link.getAttribute("imagesrcset") ?? ""}`;
        }),
      );
    expect(preloadSources.some((src) => src.includes("hero"))).toBe(true);

    await client.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await client.detach();
  });

  // ==========================================================================
  // 移动端视口 (375x667)
  // ==========================================================================
  test.describe("移动端视口 (375x667)", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    // S3 | Scenario「移动端图片定位」
    // WHEN 视口宽度 < 768px
    // THEN object-position: center top AND 容器 min-height 300px
    test("S3 [移动端图片定位] object-position center top + min-height 300", async ({
      page,
    }) => {
      const img = hero(page).locator("img").first();
      await expect(img).toBeVisible();
      await expect(img).toHaveCSS("object-position", "50% 0%"); // center top
      await expect(hero(page)).toHaveCSS("min-height", "300px");
    });

    // S15 | Scenario「移动端布局」
    // WHEN 视口宽度 < 768px（Tailwind 基础样式）
    // THEN 垂直堆叠布局 + 垂直内边距 24px + 标题 text-3xl + 搜索框全宽
    test("S15 [移动端布局] 堆叠 + 24px 内边距 + text-3xl + 搜索框全宽", async ({
      page,
    }) => {
      const overlay = hero(page).locator("div.relative.z-10").first();

      // 垂直堆叠布局
      await expect(overlay).toHaveCSS("flex-direction", "column");
      // 垂直内边距 24px（py-6）
      await expect(overlay).toHaveCSS("padding-top", "24px");
      await expect(overlay).toHaveCSS("padding-bottom", "24px");

      // 标题 text-3xl = 1.875rem = 30px
      const h1 = page.locator("h1");
      await expect(h1).toHaveCSS("font-size", "30px");

      // 搜索框全宽：包裹容器宽度 ≈ 内容区宽度（扣除左右 px-4=16px 内边距）
      const wrap = hero(page).locator("div.w-full.max-w-lg").first();
      const wrapBox = await wrap.boundingBox();
      const overlayBox = await overlay.boundingBox();
      expect(wrapBox).not.toBeNull();
      expect(overlayBox).not.toBeNull();
      expect(wrapBox!.width).toBeGreaterThan(overlayBox!.width - 40);
    });
  });
});

import fs from "node:fs";

const pagePath = "t/2026-austria-czech-7f4c9b2e6a31d8/index.html";
let html = fs.readFileSync(pagePath, "utf8");

if (html.includes('class="day-breadcrumb"')) {
  console.log("Day breadcrumb already exists; no page change needed.");
  process.exit(0);
}

const cssMarker = "    .wrap {";
const css = `    .day-breadcrumb {
      position: sticky;
      top: 51px;
      z-index: 19;
      display: flex;
      gap: 8px;
      align-items: center;
      margin: 0 0 14px;
      padding: 10px 12px;
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(247, 245, 239, 0.96);
      box-shadow: 0 5px 16px rgba(23, 32, 42, 0.08);
      white-space: nowrap;
      scrollbar-width: thin;
      backdrop-filter: blur(8px);
    }

    .day-breadcrumb strong {
      flex: 0 0 auto;
      color: var(--muted);
      font-size: 13px;
    }

    .day-breadcrumb a {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      padding: 4px 10px;
      border: 1px solid rgba(66, 107, 79, 0.35);
      border-radius: 999px;
      background: #eef3f1;
      color: var(--green);
      font-size: 14px;
      font-weight: 900;
      text-decoration: none;
    }

    .day-breadcrumb a:hover,
    .day-breadcrumb a:focus,
    .day-breadcrumb a[aria-current="date"] {
      border-color: rgba(25, 94, 131, 0.45);
      background: #edf4fb;
      color: var(--blue);
      text-decoration: none;
    }

    .day-breadcrumb a[aria-current="date"] {
      box-shadow: inset 0 0 0 1px rgba(25, 94, 131, 0.16);
    }

    .day {
      scroll-margin-top: 112px;
    }

`;

if (!html.includes(cssMarker)) {
  throw new Error("Could not find CSS insertion marker");
}
html = html.replace(cssMarker, css + cssMarker);

const detailMarker = `    <section class="section-head" id="detailed-plan">
      <h2>详细计划</h2>
      <p>时间是规划锚点，不等于已预订项目；预订栏绿色勾表示已订，黄色感叹号表示还需要提前处理。</p>
    </section>

    <section class="days">`;

const dayNav = `    <section class="section-head" id="detailed-plan">
      <h2>详细计划</h2>
      <p>时间是规划锚点，不等于已预订项目；预订栏绿色勾表示已订，黄色感叹号表示还需要提前处理。</p>
    </section>

    <nav class="day-breadcrumb" aria-label="每日行程快速导航">
      <strong>快速跳转</strong>
      <a href="#day-0729">7/29</a>
      <a href="#day-0730">7/30</a>
      <a href="#day-0731">7/31</a>
      <a href="#day-0801">8/1</a>
      <a href="#day-0802">8/2</a>
      <a href="#day-0803">8/3</a>
      <a href="#day-0804">8/4</a>
      <a href="#day-0805">8/5</a>
      <a href="#day-0806">8/6</a>
      <a href="#day-0807">8/7</a>
      <a href="#day-0808">8/8</a>
    </nav>

    <section class="days">`;

if (!html.includes(detailMarker)) {
  throw new Error("Could not find detailed itinerary insertion marker");
}
html = html.replace(detailMarker, dayNav);

const script = `
  <script>
    (() => {
      const nav = document.querySelector(".day-breadcrumb");
      if (!nav) return;

      const links = [...nav.querySelectorAll('a[href^="#day-"]')];
      const days = links
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

      const activate = (day) => {
        for (const link of links) {
          const active = link.getAttribute("href") === `#${day.id}`;
          if (active) {
            link.setAttribute("aria-current", "date");
            link.scrollIntoView({ block: "nearest", inline: "center" });
          } else {
            link.removeAttribute("aria-current");
          }
        }
      };

      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible[0]) activate(visible[0].target);
        },
        { rootMargin: "-115px 0px -55% 0px", threshold: [0.05, 0.25, 0.5] }
      );

      days.forEach((day) => observer.observe(day));
      links.forEach((link) => {
        link.addEventListener("click", () => {
          const day = document.querySelector(link.getAttribute("href"));
          if (day) activate(day);
        });
      });
      if (days[0]) activate(days[0]);
    })();
  </script>
`;

if (!html.includes("</body>")) {
  throw new Error("Could not find closing body tag");
}
html = html.replace("</body>", script + "</body>");
html = html.replace("网页版本：97", "网页版本：98");

fs.writeFileSync(pagePath, html);
console.log("Added sticky day breadcrumb navigation to the detailed itinerary.");

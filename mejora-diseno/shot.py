import sys
from playwright.sync_api import sync_playwright
base="https://web-iota-swart-48.vercel.app"
pages={"home":"/","estadio":"/estadio/estadio-monumental","evento":"/evento/mana-estadio-monumental"}
with sync_playwright() as p:
    b=p.chromium.launch()
    for vw,tag in [(1440,"desktop"),(390,"mobile")]:
        pg=b.new_page(viewport={"width":vw,"height":900})
        for k,u in pages.items():
            r=pg.goto(base+u,wait_until="networkidle"); pg.wait_for_timeout(800)
            pg.screenshot(path=f"antes/{k}-{tag}.png",full_page=True); print(k,tag,r.status)
    b.close()

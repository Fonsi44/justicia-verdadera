"""Comprehensive page testing for Justicia Verdadera."""
import sys, os
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
SCREENSHOTS_DIR = r"C:\Users\Admin\.local\share\kilo\tool-output"

PAGES = [
    ("/", "El despacho legal"),
    ("/auth/signin", "Acceder a la plataforma"),
    ("/auth/error?error=AccessDenied", "Error de autenticación"),
    ("/dashboard", "Panel de control"),
    ("/casos", "Casos"),
    ("/casos/nuevo", "Nuevo caso"),
    ("/clientes", "Clientes"),
    ("/clientes/nuevo", "Nuevo cliente"),
    ("/documentos", "Documentos"),
    ("/agenda", "Agenda"),
    ("/facturacion", "Facturación"),
    ("/this-does-not-exist", "Página no encontrada"),
]

results = []
errors_found = False

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1440, "height": 900},
    )
    page = context.new_page()
    page_errors = []

    page.on("console", lambda msg: page_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

    for path, expected_text in PAGES:
        url = f"{BASE_URL}{path}"
        page_errors = []
        print(f"\n{'='*60}")
        print(f"Testing: {path}")
        print(f"{'='*60}")

        try:
            resp = page.goto(url, wait_until="networkidle", timeout=20000)
            page.wait_for_timeout(1500)
            status = resp.status if resp else "N/A"

            title = page.title()
            has_text = expected_text in page.content()

            # Screenshot
            safe_name = path.replace("/", "_").replace("?", "_") or "home"
            ss_path = os.path.join(SCREENSHOTS_DIR, f"test_{safe_name}.png")
            page.screenshot(path=ss_path, full_page=True)

            result = {
                "path": path, "status_code": status, "title": title,
                "text_found": has_text, "errors": list(page_errors),
                "screenshot": ss_path,
            }
            results.append(result)

            status_icon = "[OK]" if (200 <= status < 400 and has_text and not page_errors) else "[!]"
            if status_icon == "[!]":
                errors_found = True

            print(f"  Status: {status}")
            print(f"  Title: {title[:100]}")
            print(f"  Expected text '{expected_text}': {'FOUND' if has_text else 'MISSING'}")
            if page_errors:
                print(f"  Console errors ({len(page_errors)}):")
                for e in page_errors[:5]:
                    print(f"    [!] {str(e)[:200]}")

        except Exception as e:
            results.append({"path": path, "status_code": "ERROR", "title": "", "text_found": False, "errors": [str(e)], "screenshot": ""})
            errors_found = True
            print(f"  ERROR: {e}")

    print(f"\n\n{'='*60}")
    print(f"TEST RESULTS SUMMARY")
    print(f"{'='*60}")
    for r in results:
        icon = "[OK]" if (isinstance(r["status_code"], int) and 200 <= r["status_code"] < 400 and r["text_found"] and not r["errors"]) else "[!]"
        print(f"  {icon} {r['path']} ({r['status_code']})")

    print(f"\n{'ERRORS FOUND' if errors_found else 'ALL PAGES OK'}")

    browser.close()

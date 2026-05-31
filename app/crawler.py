"""
Justicia Verdadera — Crawler Autonomo Explorador
Navega sitios web del gobierno hondureno en busca de PDFs legales,
los descarga, extrae texto, indexa en el corpus y recuerda lo ya visitado.
Ejecucion: python crawler.py
"""
import os, sys, time, json, hashlib, subprocess, re, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

# ─── CONFIG ──────────────────────────────────────────────
APP_DIR = Path(__file__).parent
DATA_DIR = APP_DIR / "corpus_data"
PDF_DIR = DATA_DIR / "pdfs"
TEXT_DIR = DATA_DIR / "textos"
LOG_DIR = DATA_DIR / "logs"
STATE_FILE = DATA_DIR / "state.json"
VISITED_FILE = DATA_DIR / "visited.json"
SEEDS_FILE = DATA_DIR / "seeds.json"
DB_URL = None

CYCLE_DELAY = 60       # segundos entre ciclos
PAGE_DELAY = 3         # segundos entre paginas
MAX_PAGES_PER_DOMAIN_PER_CYCLE = 30
MAX_DEPTH = 2          # profundidad maxima de navegacion

# ─── SOPORTE ──────────────────────────────────────────────
for d in [PDF_DIR, TEXT_DIR, LOG_DIR]:
    d.mkdir(parents=True, exist_ok=True)

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    safe = msg.encode("utf-8", errors="replace").decode("utf-8")
    print(f"[{ts}] {safe}", flush=True)
    with open(LOG_DIR / "crawler.log", "a", encoding="utf-8") as f:
        f.write(f"[{ts}] {msg}\n")

def load_json(path, default=None):
    if path.exists():
        try: return json.loads(path.read_text())
        except: pass
    return default if default is not None else {}

def save_json(path, data):
    path.write_text(json.dumps(data, indent=2))

def load_db_url():
    global DB_URL
    if DB_URL: return DB_URL
    for p in [APP_DIR / ".env.local", APP_DIR.parent / ".env.local"]:
        if p.exists():
            for line in p.read_text().splitlines():
                line = line.strip()
                if line.startswith("DATABASE_URL="):
                    DB_URL = line.split("=", 1)[1].strip()
                    return DB_URL
    return None

# ─── SEMILLAS (puntos de entrada por dominio) ────────────
SEEDS = {
    "tsc.gob.hn": {
        "start": "https://tsc.gob.hn/",
        "paths_contains": ["ley", "codigo", "normativa", "transparencia", "biblioteca", "reglamento", "pdf"],
        "exclude": ["/wp-admin", "/wp-json", ".css", ".js", ".png", ".jpg"],
    },
    "www.tsc.gob.hn": {
        "start": "https://www.tsc.gob.hn/web/leyes/",
        "paths_contains": ["ley", "codigo", "pdf", "reglamento"],
        "exclude": [".css", ".js", ".png", ".jpg", "/wp-"],
    },
    "www.poderjudicial.gob.hn": {
        "start": "https://www.poderjudicial.gob.hn/Cedij/Cdigos/",
        "paths_contains": ["pdf", "Codigo", "Ley"],
        "exclude": [".css", ".js", ".png", ".jpg", "_layouts"],
    },
    "www.sar.gob.hn": {
        "start": "https://www.sar.gob.hn/leyes/",
        "paths_contains": ["pdf", "ley", "descargar", "download", "wpdmdl"],
        "exclude": [".css", ".js", ".png", ".jpg", "/wp-"],
    },
    "oncae.gob.hn": {
        "start": "https://oncae.gob.hn/biblioteca/",
        "paths_contains": ["pdf", "ley", "contratacion", "normativa"],
        "exclude": [".css", ".js", ".png", ".jpg", "/wp-"],
    },
    "www.notarioshonduras.org": {
        "start": "https://www.notarioshonduras.org/leyes-notariales/",
        "paths_contains": ["pdf", "notarial", "ley"],
        "exclude": [".css", ".js", ".png", ".jpg", "/wp-"],
    },
}

# ─── OCR ──────────────────────────────────────────────────
def ocr_pdf(pdf_path):
    try:
        import fitz
        doc = fitz.open(pdf_path)
        file_size = os.path.getsize(pdf_path)
        
        # Probar si es digital con la primera página
        first_text = doc[0].get_text().strip() if doc.page_count > 0 else ""
        page_count = doc.page_count
        
        # Si es grande (>3MB) y la primera página no tiene texto, es escaneado
        if file_size > 3 * 1024 * 1024 and len(first_text) < 20:
            doc.close()
            return ""  # Saltar, no procesable sin Tesseract
        
        texts = []
        for i in range(page_count):
            page = doc[i]
            text = page.get_text().strip()
            if len(text) > 20:
                texts.append(text)
        doc.close()
        full = "\n".join(texts)
        if len(full) > 50:
            return full
        return ""
    except Exception as e:
        return ""

# ─── INDEXACION ──────────────────────────────────────────
def indexar_en_db(source_id, title, text):
    if not text or len(text) < 100: return
    try:
        tmp = TEXT_DIR / f"{source_id}.txt"
        tmp.write_text(text, encoding="utf-8")
        # Pasar DATABASE_URL explicitamente para evitar problemas de dotenv
        env = os.environ.copy()
        env["DATABASE_URL"] = DB_URL
        comando = f'npx tsx index-corpus-cli.ts "{source_id}" "{title[:100]}" "{tmp}"'
        result = subprocess.run(comando, shell=True, cwd=APP_DIR, env=env, capture_output=True, text=True,
                              timeout=300, encoding="utf-8", errors="replace")
        if result.stdout:
            out = result.stdout.strip()
            if out and "Cannot read" not in out and "image.png" not in out:
                log(f"  {out}")
        if result.stderr:
            err = result.stderr.strip()
            if err and "Cannot read" not in err and "image.png" not in err and "model does not support" not in err and "Inform the user" not in err:
                for line in err.split('\n'):
                    if 'Error:' in line or 'error:' in line:
                        log(f"  {line.strip()[:150]}")
    except subprocess.TimeoutExpired:
        log(f"  Timeout indexando {source_id}")
    except Exception as e:
        log(f"  Omitido {source_id}: {str(e)[:80]}")
        if result.stdout:
            out = result.stdout.strip()
            if out: log(f"  {out}")
        if result.stderr:
            err = result.stderr.strip()
            if err and "image.png" not in err and "model does not support" not in err:
                log(f"  {err[:150]}")
    except subprocess.TimeoutExpired:
        log(f"  Timeout indexando {source_id}")
    except Exception as e:
        log(f"  Error indexando {source_id}: {str(e)[:100]}")

def corpus_stats():
    try:
        result = subprocess.run(
            ["npx", "tsx", "scripts/corpus-stats-json.ts"],
            cwd=APP_DIR, capture_output=True, text=True, timeout=30, encoding="utf-8"
        )
        if result.stdout and "chunks" in result.stdout:
            return json.loads(result.stdout.strip())
    except:
        pass
    return None

# ─── EXPLORADOR CON PLAYWRIGHT ──────────────────────────
def explorar_sitio(domain, config, visited, stats):
    """Navega un sitio web, encuentra PDFs nuevos, los descarga e indexa"""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        log(f"  [EXPLORADOR] Playwright no instalado")
        return
    
    log(f"\n{'='*55}")
    log(f"🌐 EXPLORANDO: {domain}")
    log(f"{'='*55}")
    
    nuevos = 0
    pages_visited = 0
    pdfs_encontrados = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True, channel="chrome",
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        # Cola de URLs a visitar
        to_visit = [config["start"]]
        visited_urls = visited.get(domain, {}).get("pages", [])
        downloaded_pdfs = visited.get(domain, {}).get("pdfs", [])
        
        while to_visit and pages_visited < MAX_PAGES_PER_DOMAIN_PER_CYCLE:
            url = to_visit.pop(0)
            if url in visited_urls:
                continue
            
            try:
                log(f"  📄 {url[:100]}")
                page.goto(url, timeout=20000, wait_until="domcontentloaded")
                pages_visited += 1
                visited_urls.append(url)
                time.sleep(PAGE_DELAY)
                
                # Extraer todos los enlaces
                links = page.eval_on_selector_all(
                    "a[href]", 
                    "els => els.map(e => ({href: e.href, text: e.innerText.trim()}))"
                )
                
                for link in links:
                    href = link["href"]
                    if not href or href.startswith("javascript:"):
                        continue
                    
                    # Saltar solo congresonacional.hn (bloqueado)
                    if 'congresonacional.hn' in href.lower():
                        continue
                    
                    # Es un PDF? Descargarlo
                    if ".pdf" in href.lower() or "wpdmdl=" in href.lower():
                        nombre = href.lower().split('/')[-1].split('?')[0].split('#')[0]
                        
                        # Solo descargar PDFs con contenido legal relevante para las 9 ramas
                        legal_kw = [
                            # Civil
                            'civil','contrato','contratos','propiedad','notariado','notarial',
                            # Penal  
                            'penal','delito','sentencia','jurisprudencia',
                            # Laboral
                            'trabajo','laboral','salario','ihss','empleo','prestaciones',
                            # Familia
                            'familia','matrimonio','divorcio','alimentos','adopción',
                            # Mercantil/Comercial
                            'comercio','mercantil','contratacion','contratación','sociedades',
                            'licitación','licitacion','compras',
                            # Procesal
                            'procesal','procedimiento','recursos','casación','apelación',
                            # Tributario/Fiscal
                            'tributario','fiscal','isr','isv','impuesto','renta','aduanas','hacienda',
                            # Administrativo
                            'municipal','transparencia',
                            # Constitucional
                            'constitucion','constitución','constitucional','amparo','garantías',
                            # Generales (esenciales)
                            'ley','codigo','código','decreto','acuerdo','reglamento','reforma',
                            'norma','disposiciones','presupuesto','pcm','la gaceta',
                            'convenio','tratado']
                        if not any(kw in nombre for kw in legal_kw):
                            continue
                        
                        if not nombre:
                            nombre = f"doc_{hashlib.md5(href.encode()).hexdigest()[:8]}.pdf"
                        
                        pdf_hash = hashlib.md5(href.encode()).hexdigest()[:12]
                        if pdf_hash in downloaded_pdfs:
                            continue
                        
                        pdfs_encontrados += 1
                        log(f"  📥 PDF: {href[:100]}")
                        src_name = f"{domain.replace('.','-')}_{pdf_hash}"
                        out = PDF_DIR / f"{src_name}.pdf"
                        
                        try:
                            import requests
                            r = requests.get(href, timeout=120, 
                                headers={"User-Agent": "Mozilla/5.0"})
                            if r.status_code == 200 and len(r.content) > 5000:
                                out.write_bytes(r.content)
                                downloaded_pdfs.append(pdf_hash)
                                log(f"    ✅ {len(r.content)//1024} KB")
                                
                                text = ocr_pdf(str(out))
                                if text and len(text) > 100:
                                    palabras = len(text) // 5
                                    link_title = link["text"][:100] if link["text"] else f"PDF {src_name}"
                                    indexar_en_db(src_name, f"{link_title} - {domain}", text)
                                    nuevos += 1
                                    stats = corpus_stats()
                                    if stats:
                                        log(f"    📊 +{palabras:,} palabras | Total: {stats['palabras']:,} palabras")
                                else:
                                    log(f"    ⚠️ Texto insuficiente tras OCR")
                            time.sleep(PAGE_DELAY)
                        except Exception as e:
                            log(f"    ❌ {str(e)[:80]}")
                        continue
                    
                    # Saltar URLs de descarga directa o dominios no accesibles
                    if any(x in href.lower() for x in ['wpdmdl=', 'download/']):
                        continue
                    if 'congresonacional.hn' in href.lower():
                        continue
                    
                    # Es una pagina del mismo dominio para explorar?
                    parsed = urllib.parse.urlparse(href)
                    if domain in parsed.netloc and href not in visited_urls and href not in to_visit:
                        path_lower = parsed.path.lower()
                        exclude = any(x in path_lower for x in config.get("exclude", []))
                        include = any(x in path_lower for x in config.get("paths_contains", []))
                        if not exclude and include:
                            to_visit.append(href)
                
            except Exception as e:
                log(f"  ❌ Error en {url[:80]}: {str(e)[:60]}")
                visited_urls.append(url)
        
        browser.close()
    
    # Guardar memoria
    visited[domain] = {
        "pages": visited_urls[-500:],  # mantener ultimas 500 paginas
        "pdfs": downloaded_pdfs,
        "last_updated": datetime.now().isoformat(),
    }
    stats["sources"][domain] = stats["sources"].get(domain, 0) + nuevos
    
    log(f"\n📊 RESUMEN {domain}: {pages_visited} paginas, {pdfs_encontrados} PDFs, {nuevos} nuevos")
    return nuevos

# ─── MODO DISEÑO (solo lista) ───────────────────────────
# Las URLs especificas ya conocidas tambien se revisan
URLS_FIJAS = {
    "constitucion-sar": {"url": "https://www.sar.gob.hn/download/constitucion-de-la-republica/?wpdmdl=834", "title": "Constitucion de la Republica (SAR)"},
    "ley-isr-sar": {"url": "https://www.sar.gob.hn/download/texto-consolidado-de-la-ley-de-impuesto-sobre-la-renta-hasta-el-acuerdo-sar-022-2021/?wpdmdl=873", "title": "Ley de Impuesto Sobre la Renta"},
    "codigo-tributario-sar": {"url": "https://www.sar.gob.hn/download/texto-consolidado-codigo-tributario-decreto-170-2016/?wpdmdl=6987", "title": "Codigo Tributario"},
    "codigo-penal-tsc": {"url": "https://tsc.gob.hn/web/leyes/Codigo_Penal_Honduras.pdf", "title": "Codigo Penal de Honduras (TSC)"},
    "codigo-procesal-civil-tsc": {"url": "https://www.tsc.gob.hn/web/leyes/Codigo_Procesal%20Civil_.pdf", "title": "Codigo Procesal Civil (TSC)"},
    "ley-amparo-tsc": {"url": "https://www.tsc.gob.hn/web/leyes/Ley_de_Amparo.pdf", "title": "Ley de Amparo"},
    "ley-contratacion-oncae": {"url": "https://oncae.gob.hn/wp-content/uploads/2025/01/Ley-de-Compras-Eficientes-y-Transparentes-a-traves-de-Medios-Electronicos.pdf", "title": "Ley de Compras Eficientes y Transparentes"},
    "codigo-notariado": {"url": "https://www.notarioshonduras.org/wp-content/uploads/2017/01/Codigo-del-Notariado.pdf", "title": "Codigo del Notariado"},
}

def revisar_urls_fijas(state):
    """Revisa las URLs conocidas por si hay versiones nuevas"""
    import requests
    log(f"\n📋 REVISANDO URLs FIJAS ({len(URLS_FIJAS)})...")
    nuevos = 0
    for key, info in URLS_FIJAS.items():
        out = PDF_DIR / f"{key}.pdf"
        if out.exists():
            continue
        try:
            r = requests.get(info["url"], timeout=120, headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code == 200 and len(r.content) > 5000:
                out.write_bytes(r.content)
                log(f"  ✅ {key} ({len(r.content)//1024} KB)")
                text = ocr_pdf(str(out))
                if text and len(text) > 100:
                    palabras = len(text) // 5
                    indexar_en_db(key, info["title"], text)
                    nuevos += 1
                    stats = corpus_stats()
                    if stats:
                        log(f"    📊 +{palabras:,} palabras | Total: {stats['palabras:,']:,} palabras")
                time.sleep(3)
        except:
            pass
    state["sources"]["urls_fijas"] = state["sources"].get("urls_fijas", 0) + nuevos
    return nuevos

# ─── CICLO PRINCIPAL ─────────────────────────────────────
def run_cycle():
    state = load_json(STATE_FILE, {"sources": {}, "total_pdfs": 0})
    visited = load_json(VISITED_FILE, {})
    
    log(f"\n{'#'*55}")
    log(f"# CICLO {datetime.now().strftime('%H:%M:%S')}")
    log(f"{'#'*55}")
    
    # Paso 1: Revisar URLs fijas conocidas
    revisar_urls_fijas(state)
    
    # Paso 2: Explorar cada dominio en PARALELO con hasta 3 workers
    log(f"\n🌐 EXPLORANDO {len(SEEDS)} sitios en paralelo...")
    with ThreadPoolExecutor(max_workers=3) as executor:
        futuros = {executor.submit(explorar_sitio, domain, cfg, visited, state): domain for domain, cfg in SEEDS.items()}
        for futuro in as_completed(futuros):
            domain = futuros[futuro]
            try:
                futuro.result()
            except Exception as e:
                log(f"  Error en {domain}: {e}")
            time.sleep(2)
    
    # Guardar estado
    save_json(STATE_FILE, state)
    save_json(VISITED_FILE, visited)
    
    # Stats finales del ciclo
    stats = corpus_stats()
    if stats:
        log(f"\n{'='*55}")
        log(f"📊 CORPUS LEGAL — {stats['palabras']:,} palabras | {stats['chunks']:,} chunks | {len(stats['fuentes'])} fuentes")
        log(f"{'─'*55}")
        for f in stats['fuentes'][:12]:
            log(f"  {f['nombre']}: {f['count']} chunks")
        if len(stats['fuentes']) > 12:
            log(f"  ... y {len(stats['fuentes'])-12} fuentes mas")
        log(f"{'='*55}")
    
    return stats

def main():
    if not load_db_url():
        log("ERROR: DATABASE_URL no encontrada en .env.local")
        sys.exit(1)
    
    log(f"{'='*55}")
    log(f"🧑‍⚖️ CRAWLER AUTONOMO - CORPUS LEGAL HONDURENO")
    log(f"📁 PDFs: {PDF_DIR}")
    log(f"🌐 Sitios a explorar: {len(SEEDS)}")
    log(f"📋 URLs fijas: {len(URLS_FIJAS)}")
    log(f"⏱  Ctrl+C para detener")
    log(f"{'='*55}")
    
    ciclo = 0
    try:
        while True:
            ciclo += 1
            log(f"\n🔄 CICLO #{ciclo}")
            run_cycle()
            log(f"\n⏳ Siguiente ciclo en 60s...")
            time.sleep(60)
    except KeyboardInterrupt:
        log("\n⏹️ Detenido por el usuario")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    
    load_db_url()
    if args.once:
        run_cycle()
    else:
        main()

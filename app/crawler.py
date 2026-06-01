"""
Justicia Verdadera — Crawler Autonomo v3.0
Navega sitios .gob.hn, descarga PDFs legales, extrae texto (PyMuPDF + OCR tesseract.js),
calcula calidad, extrae metadatos (local + IA DeepSeek V4 Flash), y alimenta el corpus.
Ejecucion: python crawler.py [--once] [--reset] [--dry-run] [--no-ai] [--only-fixed] [--max-pages N] [--cycle-delay N]
"""
import os, sys, time, json, hashlib, subprocess, re, urllib.parse, traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ─── CONFIG ──────────────────────────────────────────────
APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "corpus_data"
PDF_DIR = DATA_DIR / "pdfs"
TEXT_DIR = DATA_DIR / "textos"
LOG_DIR = DATA_DIR / "logs"
META_DIR = DATA_DIR / "metadata"
STATE_FILE = DATA_DIR / "state.json"
VISITED_FILE = DATA_DIR / "visited.json"
DB_URL = None
DEEPSEEK_KEY = None

for d in [PDF_DIR, TEXT_DIR, LOG_DIR, META_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Valores por defecto (sobreescribibles via CLI)
CYCLE_DELAY = 60
PAGE_DELAY = 2
MAX_PAGES_PER_DOMAIN_PER_CYCLE = 30
MAX_DEPTH = 2

# TSC: fuente oficial inaccesible desde la red actual
TSC_DOMAINS = ("tsc.gob.hn", "www.tsc.gob.hn")

# ─── SOPORTE ──────────────────────────────────────────────
def log(msg, level="INFO"):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_DIR / "crawler.log", "a", encoding="utf-8") as f:
        f.write(line + "\n")

def load_json(path, default=None):
    if path.exists():
        try: return json.loads(path.read_text())
        except: pass
    return default if default is not None else {}

def save_json(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False))

def load_env(key):
    for p in [APP_DIR / ".env.local", APP_DIR.parent / ".env.local"]:
        if p.exists():
            for line in p.read_text(encoding="utf-8", errors="replace").splitlines():
                line = line.strip()
                if line.startswith(f"{key}="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None

def load_db_url():
    global DB_URL
    if DB_URL: return DB_URL
    val = load_env("DATABASE_URL")
    if val:
        DB_URL = val
    return DB_URL

def load_deepseek_key():
    global DEEPSEEK_KEY
    if DEEPSEEK_KEY: return DEEPSEEK_KEY
    val = load_env("DEEPSEEK_API_KEY")
    if val:
        DEEPSEEK_KEY = val
    return DEEPSEEK_KEY

# ─── API DEEPSEEK V4 FLASH ────────────────────────────────
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-v4-flash"

def call_deepseek(prompt, max_tokens=100, temperature=0.1):
    if not load_deepseek_key():
        return None
    try:
        import requests
        r = requests.post(DEEPSEEK_URL,
            headers={"Authorization": f"Bearer {DEEPSEEK_KEY}", "Content-Type": "application/json"},
            json={
                "model": DEEPSEEK_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
            timeout=30
        )
        if r.status_code == 200:
            body = r.json()
            return body["choices"][0]["message"]["content"].strip()
        else:
            log(f"  DeepSeek HTTP {r.status_code}: {r.text[:100]}", "WARN")
    except Exception as e:
        log(f"  DeepSeek error: {str(e)[:80]}", "WARN")
    return None

# ─── SEMILLAS OFICIALES ──────────────────────────────────
# Cada entrada incluye metadata: rama, prioridad, institucion, tipo de fuente
SEEDS = {
    # ─── Constitucional / Transversal ──────────────────
    "www.tsc.gob.hn_leyes": {
        "start": "https://www.tsc.gob.hn/web/leyes/",
        "paths_contains": ["ley", "codigo", "pdf", "reglamento"],
        "exclude": [".css", ".js", ".png", ".jpg", "/wp-"],
        "rama": "transversal",
        "prioridad": "alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pagina_semilla",
        "official": True,
    },
    "tsc.gob.hn": {
        "start": "https://tsc.gob.hn/",
        "paths_contains": ["ley", "codigo", "normativa", "transparencia", "biblioteca", "reglamento", "pdf"],
        "exclude": ["/wp-admin", "/wp-json", ".css", ".js", ".png", ".jpg"],
        "rama": "transversal",
        "prioridad": "media",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pagina_semilla",
        "official": True,
    },
    # ─── Civil / Obligaciones / Contratos ──────────────
    "www.poderjudicial.gob.hn_rdlpm": {
        "start": "https://www.poderjudicial.gob.hn/RDLPM/",
        "paths_contains": ["pdf", "derecho", "civil", "penal", "laboral"],
        "exclude": [".css", ".js", ".png", ".jpg"],
        "rama": "civil",
        "prioridad": "media",
        "institucion": "Poder Judicial de Honduras",
        "source_type": "pagina_semilla",
        "official": True,
    },
    # ─── Familia / Niñez / Violencia domestica ─────────
    "www.poderjudicial.gob.hn_familia": {
        "start": "https://www.poderjudicial.gob.hn/Cedij/Jurisprudencia/Familia/",
        "paths_contains": ["pdf", "sentencia", "familia", "matrimonio", "alimentos", "niñez", "violencia"],
        "exclude": [".css", ".js", ".png", ".jpg", "_layouts"],
        "rama": "familia",
        "prioridad": "alta",
        "institucion": "Poder Judicial de Honduras",
        "source_type": "pagina_semilla",
        "official": True,
    },
    # ─── Laboral / Seguridad social ────────────────────
    "www.trabajo.gob.hn": {
        "start": "https://www.trabajo.gob.hn/",
        "paths_contains": ["ley", "codigo", "trabajo", "laboral", "reglamento", "pdf", "salario", "ihss", "seguridad"],
        "exclude": [".css", ".js", ".png", ".jpg", "/wp-"],
        "rama": "laboral",
        "prioridad": "alta",
        "institucion": "Secretaria de Trabajo y Seguridad Social",
        "source_type": "pagina_semilla",
        "official": True,
    },
    "www.poderjudicial.gob.hn_laboral": {
        "start": "https://www.poderjudicial.gob.hn/Cedij/Jurisprudencia/Laboral/",
        "paths_contains": ["pdf", "sentencia", "laboral", "trabajo", "jurisprudencia"],
        "exclude": [".css", ".js", ".png", ".jpg", "_layouts"],
        "rama": "laboral",
        "prioridad": "media",
        "institucion": "Poder Judicial de Honduras",
        "source_type": "pagina_semilla",
        "official": True,
    },
    # ─── Penal ─────────────────────────────────────────
    "www.poderjudicial.gob.hn_cedij": {
        "start": "https://www.poderjudicial.gob.hn/CEDIJ/Documents/",
        "paths_contains": ["pdf", "ley", "reglamento", "acuerdo", "codigo", "penal"],
        "exclude": [".css", ".js", ".png", ".jpg", "_layouts"],
        "rama": "penal",
        "prioridad": "alta",
        "institucion": "Poder Judicial de Honduras",
        "source_type": "categoria",
        "official": True,
    },
    # ─── Procesal Civil ────────────────────────────────
    "www.poderjudicial.gob.hn": {
        "start": "https://www.poderjudicial.gob.hn/Cedij/Cdigos/",
        "paths_contains": ["pdf", "Codigo", "Ley", "procesal"],
        "exclude": [".css", ".js", ".png", ".jpg", "_layouts"],
        "rama": "procesal_civil",
        "prioridad": "alta",
        "institucion": "Poder Judicial de Honduras",
        "source_type": "pagina_semilla",
        "official": True,
    },
    # ─── Procesal Penal ────────────────────────────────
    "www.poderjudicial.gob.hn_leyes": {
        "start": "https://www.poderjudicial.gob.hn/Cedij/Leyes/",
        "paths_contains": ["pdf", "ley", "codigo", "penal", "procesal"],
        "exclude": [".css", ".js", ".png", ".jpg", "_layouts"],
        "rama": "procesal_penal",
        "prioridad": "alta",
        "institucion": "Poder Judicial de Honduras",
        "source_type": "pagina_semilla",
        "official": True,
    },
    # ─── Mercantil / Financiero / Consumidor ───────────
    "www.cnbs.gob.hn": {
        "start": "https://www.cnbs.gob.hn/",
        "paths_contains": ["ley", "normativa", "reglamento", "pdf", "banca", "seguros", "financier", "consumidor"],
        "exclude": [".css", ".js", ".png", ".jpg", "/wp-"],
        "rama": "mercantil_financiero",
        "prioridad": "alta",
        "institucion": "Comision Nacional de Bancos y Seguros",
        "source_type": "pagina_semilla",
        "official": True,
    },
    # ─── Tributario / Fiscal ───────────────────────────
    "www.sar.gob.hn": {
        "start": "https://www.sar.gob.hn/leyes/",
        "paths_contains": ["pdf", "ley", "descargar", "download", "wpdmdl", "tributario", "fiscal", "isr", "isv"],
        "exclude": [".css", ".js", ".png", ".jpg", "/wp-"],
        "rama": "tributario_fiscal",
        "prioridad": "alta",
        "institucion": "Servicio de Administracion de Rentas",
        "source_type": "pagina_semilla",
        "official": True,
    },
    "www.sefin.gob.hn": {
        "start": "https://www.sefin.gob.hn/",
        "paths_contains": ["ley", "codigo", "tributario", "fiscal", "presupuesto", "pdf", "reglamento", "isr", "isv"],
        "exclude": [".css", ".js", ".png", ".jpg", "/wp-"],
        "rama": "tributario_fiscal",
        "prioridad": "media",
        "institucion": "Secretaria de Finanzas",
        "source_type": "pagina_semilla",
        "official": True,
    },
    # ─── Administrativo / Municipal / Contratacion ─────
    "oncae.gob.hn": {
        "start": "https://oncae.gob.hn/biblioteca/",
        "paths_contains": ["pdf", "ley", "contratacion", "normativa", "administrativo", "municipal"],
        "exclude": [".css", ".js", ".png", ".jpg", "/wp-"],
        "rama": "administrativo",
        "prioridad": "alta",
        "institucion": "ONCAE",
        "source_type": "pagina_semilla",
        "official": True,
    },
    # ─── Notarial / Registral ──────────────────────────
    "www.notarioshonduras.org": {
        "start": "https://www.notarioshonduras.org/leyes-notariales/",
        "paths_contains": ["pdf", "notarial", "ley", "registral", "propiedad"],
        "exclude": [".css", ".js", ".png", ".jpg", "/wp-"],
        "rama": "notarial_registral",
        "prioridad": "alta",
        "institucion": "Union de Notarios de Honduras",
        "source_type": "pagina_semilla",
        "official": True,
    },
}

# Reemplazar SEEDS_OFICIALES para compatibilidad
SEEDS_OFICIALES = SEEDS

# ─── URLS FIJAS CORE (verificadas externamente) ───────────
URLS_FIJAS_CORE = {
    "constitucion-honduras": {
        "url": "https://www.tsc.gob.hn/web/leyes/Constitucion_de_la_republica.pdf",
        "title": "Constitucion de la Republica de Honduras",
        "rama": "constitucional", "prioridad": "transversal",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": True,
        "access_status": "blocked_from_current_network",
        "requires_manual_validation": True,
        "process_by_default": False,
        "validation_notes": "Fuente oficial, pero inaccesible desde la red actual. Validar con VPN/red hondurena o ejecucion manual.",
    },
    "codigo-procesal-civil": {
        "url": "https://www.tsc.gob.hn/web/leyes/Codigo_Procesal%20Civil_.pdf",
        "title": "Codigo Procesal Civil de Honduras",
        "rama": "procesal_civil", "prioridad": "alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": True,
    },
    "codigo-penal-2017": {
        "url": "https://www.tsc.gob.hn/web/leyes/Decreto_130-2017.pdf",
        "title": "Codigo Penal de Honduras — Decreto 130-2017",
        "rama": "penal", "prioridad": "alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": True,
    },
    "codigo-procesal-penal": {
        "url": "https://tsc.gob.hn/web/leyes/Codigo_Procesal_Penal_2016.pdf",
        "title": "Codigo Procesal Penal de Honduras",
        "rama": "procesal_penal", "prioridad": "alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": True,
    },
    "codigo-trabajo-setrass": {
        "url": "https://www.trabajo.gob.hn/wp-content/uploads/2022/09/Codigo-del-Trabajo-y-sus-Reformas.pdf",
        "title": "Codigo del Trabajo y sus Reformas (SETRASS)",
        "rama": "laboral", "prioridad": "alta",
        "institucion": "Secretaria de Trabajo y Seguridad Social",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": True,
    },
    "codigo-familia": {
        "url": "https://www.tsc.gob.hn/web/leyes/codigo_de_familia.pdf",
        "title": "Codigo de Familia de Honduras",
        "rama": "familia", "prioridad": "alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": True,
    },
    "codigo-notariado": {
        "url": "https://www.notarioshonduras.org/wp-content/uploads/2017/01/Codigo-del-Notariado.pdf",
        "title": "Codigo del Notariado",
        "rama": "notarial_registral", "prioridad": "alta",
        "institucion": "Union de Notarios de Honduras",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": True,
    },
    "ley-propiedad": {
        "url": "https://www.tsc.gob.hn/web/leyes/Ley-de-la-Propiedad.pdf",
        "title": "Ley de Propiedad",
        "rama": "civil", "prioridad": "alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": True,
    },
    "ley-municipalidades": {
        "url": "https://tsc.gob.hn/web/leyes/Ley_de_Municipalidades.pdf",
        "title": "Ley de Municipalidades",
        "rama": "administrativo", "prioridad": "alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": True,
    },
    "ley-sistema-financiero": {
        "url": "https://tsc.gob.hn/web/leyes/Ley%20del%20Sistema%20Financiero%20%28Reformado%20por%20el%20CPC%292010.pdf",
        "title": "Ley del Sistema Financiero",
        "rama": "mercantil_financiero", "prioridad": "media_alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": True,
    },
    "ley-violencia-domestica": {
        "url": "https://www.tsc.gob.hn/web/leyes/LEY%20CONTRA%20LA%20VIOLENCIA%20DOMESTICA%20Y%20SUS%20REFORMAS..pdf",
        "title": "Ley contra la Violencia Domestica y sus Reformas",
        "rama": "familia", "prioridad": "media_alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": True,
    },
    "codigo-ninez-adolescencia": {
        "url": "https://www.tsc.gob.hn/web/leyes/Codigo_ni%C3%B1ezyadolescencia_2013.pdf",
        "title": "Codigo de la Ninez y Adolescencia",
        "rama": "familia", "prioridad": "alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": True,
    },
    "ley-procedimiento-administrativo": {
        "url": "https://www.tsc.gob.hn/web/leyes/Ley%20de%20Procedimiento%20Administrativo.pdf",
        "title": "Ley de Procedimiento Administrativo",
        "rama": "administrativo", "prioridad": "alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": True,
    },
    # ─── Validados en ejecuciones anteriores ──────────
    "codigo-civil": {
        "url": "https://www.tsc.gob.hn/web/leyes/Codigo_Civil_Honduras.pdf",
        "title": "Codigo Civil de Honduras",
        "rama": "civil", "prioridad": "alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": False,
        "validation_notes": "validada en ejecucion previa — HTTP 200, PDF descargado",
    },
    "codigo-comercio": {
        "url": "https://www.tsc.gob.hn/web/leyes/Codigo_de_Comercio_Honduras.pdf",
        "title": "Codigo de Comercio de Honduras",
        "rama": "mercantil_financiero", "prioridad": "alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": True, "validated_externally": False,
        "validation_notes": "validada en ejecucion previa — HTTP 200, PDF descargado",
    },
}

# ─── URLS FIJAS COMPLEMENTARIAS ───────────────────────────
URLS_FIJAS_COMPLEMENTARIAS = {
    "codigo-penal-tsc-legacy": {
        "url": "https://tsc.gob.hn/web/leyes/Codigo_Penal_Honduras.pdf",
        "title": "Codigo Penal de Honduras — version TSC anterior",
        "rama": "penal", "prioridad": "baja",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": False, "is_complementary_source": True,
        "process_by_default": False,
        "notas": "version historica — comparar con Decreto 130-2017",
    },
    "codigo-trabajo-tsc": {
        "url": "https://www.tsc.gob.hn/web/leyes/Codigo_del_Trabajo.pdf",
        "title": "Codigo del Trabajo de Honduras (TSC)",
        "rama": "laboral", "prioridad": "baja",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": False, "is_complementary_source": True,
        "process_by_default": False,
        "notas": "preferir version SETRASS",
    },
    "ley-contratacion-oncae": {
        "url": "https://oncae.gob.hn/wp-content/uploads/2025/01/Ley-de-Compras-Eficientes-y-Transparentes-a-traves-de-Medios-Electronicos.pdf",
        "title": "Ley de Compras Eficientes y Transparentes (ONCAE)",
        "rama": "administrativo", "prioridad": "media",
        "institucion": "ONCAE",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": False, "is_complementary_source": True,
        "process_by_default": False,
    },
    "ley-contratacion-estado-tsc": {
        "url": "https://www.tsc.gob.hn/web/leyes/Ley_de_Contratacion_del_Estado.pdf",
        "title": "Ley de Contratacion del Estado (TSC)",
        "rama": "administrativo", "prioridad": "alta",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": False, "is_complementary_source": True,
        "process_by_default": False,
    },
}

# ─── URLS FIJAS PENDIENTES (no verificadas) ───────────────
URLS_FIJAS_PENDIENTES = {
    "codigo-tributario-pendiente": {
        "url": "", "title": "Codigo Tributario de Honduras — URL pendiente de verificacion",
        "rama": "tributario_fiscal", "prioridad": "alta",
        "institucion": "SAR",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": False, "is_pending_source": True,
        "validation_status": "pending_runtime_validation",
        "process_by_default": False,
        "validation_notes": "URL no verificada. Buscar en https://www.sar.gob.hn/leyes/",
    },
    "ley-isr-pendiente": {
        "url": "", "title": "Ley del Impuesto sobre la Renta (ISR) — URL pendiente",
        "rama": "tributario_fiscal", "prioridad": "alta",
        "institucion": "SAR",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": False, "is_pending_source": True,
        "validation_status": "pending_runtime_validation",
        "process_by_default": False,
        "validation_notes": "URL no verificada. Buscar en https://www.sar.gob.hn/leyes/",
    },
    "ley-isv-pendiente": {
        "url": "", "title": "Ley del Impuesto sobre Ventas (ISV) — URL pendiente",
        "rama": "tributario_fiscal", "prioridad": "alta",
        "institucion": "SAR",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": False, "is_pending_source": True,
        "validation_status": "pending_runtime_validation",
        "process_by_default": False,
        "validation_notes": "URL no verificada. Buscar en https://www.sar.gob.hn/leyes/",
    },
    "ley-ihss-pendiente": {
        "url": "", "title": "Ley del Seguro Social (IHSS) — URL pendiente",
        "rama": "laboral", "prioridad": "alta",
        "institucion": "Instituto Hondureno de Seguridad Social",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": False, "is_pending_source": True,
        "validation_status": "pending_runtime_validation",
        "process_by_default": False,
        "validation_notes": "URL no verificada. Buscar en https://www.ihss.hn/ o TSC",
    },
    "ley-proteccion-consumidor-pendiente": {
        "url": "", "title": "Ley de Proteccion al Consumidor — URL pendiente",
        "rama": "mercantil_financiero", "prioridad": "media",
        "institucion": "Tribunal Superior de Cuentas",
        "source_type": "pdf_directo", "official": True,
        "is_core_source": False, "is_pending_source": True,
        "validation_status": "pending_runtime_validation",
        "process_by_default": False,
        "validation_notes": "URL no verificada.",
    },
}

# ─── Consolidar para compatibilidad ────────────────────────
URLS_FIJAS = {**URLS_FIJAS_CORE, **URLS_FIJAS_COMPLEMENTARIAS, **URLS_FIJAS_PENDIENTES}

CORE_KEYWORDS = [
    'civil','contrato','propiedad','notariado','notarial','testamento','sucesi','herencia','obligacion','obligaciones',
    'penal','delito','crimen','homicidio','robo','hurto','estafa','victima','victimas','imputado',
    'trabajo','laboral','salario','ihss','empleo','prestaciones','despido','indemnizaci','jornada','seguridad social',
    'familia','matrimonio','divorcio','alimentos','adopci','conyuges','patria potestad','filiaci','niñez','nine','violencia domestica',
    'comercio','mercantil','contratacion','sociedades','licitaci','compras','proveedores','consumidor','banca','financier',
    'procesal','procedimiento','recursos','casaci','apelaci','prueba','demanda','juicio','ejecuci','sentencia','jurisprudencia',
    'tributario','fiscal','impuesto','isr','isv','renta','presupuesto','aduanas','aduaner',
    'administrativo','municipal','municipalidades','contratacion','servicio publico','concesion','permiso',
    'registral','catastro','inscripcion','anotacion','folio','registro propiedad',
    'ley','codigo','decreto','acuerdo','reglamento','reforma','norma','disposiciones',
    'convenio','tratado','constitucion','constituci',
]

ARTICLE_RE = re.compile(
    r'(?:Art\.?\s*|Articulo\s+|Artículo\s+|ARTÍCULO\s+|ARTICULO\s+)(\d+(?:[-–]\w+)?(?:\s*(?:bis|ter|quater))?)',
    re.IGNORECASE
)

INSTITUTION_MAP = {
    "tsc.gob.hn": "Tribunal Superior de Cuentas",
    "poderjudicial.gob.hn": "Poder Judicial de Honduras",
    "sar.gob.hn": "Servicio de Administracion de Rentas",
    "oncae.gob.hn": "ONCAE",
    "notarioshonduras.org": "Union de Notarios de Honduras",
    "trabajo.gob.hn": "Secretaria de Trabajo y Seguridad Social",
    "cnbs.gob.hn": "Comision Nacional de Bancos y Seguros",
    "sefin.gob.hn": "Secretaria de Finanzas",
    "ip.gob.hn": "Instituto de la Propiedad",
    "enag.gob.hn": "Empresa Nacional de Artes Graficas (ENAG / La Gaceta)",
}

RAMAS_KEYWORDS = {
    "civil": ["civil","contrato","propiedad","obligacion","obligaciones","testamento","sucesi","herencia"],
    "familia": ["familia","matrimonio","divorcio","alimentos","adopci","patria potestad","filiaci","niñez","violencia domestica"],
    "laboral": ["trabajo","laboral","salario","ihss","empleo","prestaciones","despido","indemnizaci","seguridad social","jornada"],
    "penal": ["penal","delito","crimen","homicidio","robo","hurto","estafa","victima","imputado","condena"],
    "procesal_civil": ["procesal civil","procedimiento civil","demanda civil","ejecucion civil"],
    "procesal_penal": ["procesal penal","procedimiento penal","investigacion penal","fiscalia","ministerio publico"],
    "mercantil_financiero": ["comercio","mercantil","contratacion","sociedades","licitaci","compras","consumidor","banca","financier","seguros"],
    "tributario_fiscal": ["tributario","fiscal","impuesto","isr","isv","renta","presupuesto","aduanas","aduaner"],
    "administrativo": ["administrativo","municipal","municipalidades","contratacion","servicio publico","concesion","permiso"],
    "notarial_registral": ["notariado","notarial","registral","catastro","inscripcion","folio","registro propiedad"],
    "constitucional": ["constitucion","constituci","garantia","derecho fundamental","amparo","inconstitucional"],
    "procesal": ["procesal","procedimiento","recursos","casaci","apelaci","demanda","juicio","ejecuci","sentencia","jurisprudencia"],
}

# ─── OCR ──────────────────────────────────────────────────
def ocr_pdf(pdf_path):
    result = {"text": "", "method": "failed", "pages": 0}
    digital = _ocr_pymupdf(pdf_path)
    if digital["text"] and len(digital["text"]) > 100:
        result["text"] = digital["text"]
        result["method"] = "digital"
        result["pages"] = digital["pages"]
        return result
    if os.path.getsize(pdf_path) > 50000:
        ocr = _ocr_tesseract(pdf_path)
        if ocr.get("method") == "ocr_pending":
            result["method"] = "ocr_pending"
            result["pages"] = digital.get("pages", 0)
            return result
        if ocr["text"] and len(ocr["text"]) > 100:
            result["text"] = ocr["text"]
            result["method"] = "ocr"
            result["pages"] = ocr["pages"]
            return result
    result["method"] = "ocr_pending"
    result["pages"] = digital.get("pages", 0)
    return result

def _ocr_pymupdf(pdf_path):
    try:
        import fitz, os as _os, io
        # Suprimir stderr de MuPDF durante extraccion (incluye errores no criticos como "No default Layer config")
        old_stderr = _os.dup(2)
        null_fd = _os.open(_os.devnull, _os.O_WRONLY)
        _os.dup2(null_fd, 2)
        _os.close(null_fd)
        try:
            doc = fitz.open(pdf_path)
            texts = []
            for page in doc:
                t = page.get_text().strip()
                if len(t) > 20:
                    texts.append(t)
            pages = doc.page_count
            doc.close()
        finally:
            # Restaurar stderr
            _os.dup2(old_stderr, 2)
            _os.close(old_stderr)
        full = "\n".join(texts)
        return {"text": full if len(full) > 50 else "", "pages": pages}
    except Exception:
        return {"text": "", "pages": 0}

def _ocr_tesseract(pdf_path):
    """Convierte paginas PDF a PNG y llama a tesseract.js. Si el script no existe, devuelve ocr_pending."""
    ocr_script = APP_DIR / "scripts" / "ocr-tesseract-cli.ts"
    if not ocr_script.exists():
        return {"text": "", "pages": 0, "method": "ocr_pending"}
    try:
        import fitz, tempfile, shutil
        tmpdir = tempfile.mkdtemp(prefix="ocr_")
        try:
            doc = fitz.open(pdf_path)
            max_pages = min(doc.page_count, 80)
            for i in range(max_pages):
                pix = doc[i].get_pixmap(dpi=150)
                pix.save(f"{tmpdir}/page_{i:04d}.png")
            pages = doc.page_count
            doc.close()
            npx_bin = "npx.cmd" if sys.platform == "win32" else "npx"
            npx_path = shutil.which(npx_bin) or npx_bin
            result = subprocess.run(
                [npx_path, "tsx", str(ocr_script), tmpdir],
                cwd=str(APP_DIR), capture_output=True, text=True, timeout=600, encoding="utf-8"
            )
            return {"text": result.stdout.strip(), "pages": pages, "method": "ocr"}
        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)
    except:
        return {"text": "", "pages": 0, "method": "ocr_pending"}

# ─── EXTRACCION JURIDICA LOCAL ──────────────────────────
CORE_KEYWORDS_FLAT = [
    'civil','contrato','propiedad','notariado','notarial','testamento','sucesi','herencia','obligacion',
    'penal','delito','crimen','homicidio','robo','hurto','estafa','victima',
    'trabajo','laboral','salario','ihss','empleo','prestaciones','despido','indemnizaci','jornada',
    'familia','matrimonio','divorcio','alimentos','adopci','conyuges','patria potestad','filiaci',
    'comercio','mercantil','contratacion','sociedades','licitaci','compras','consumidor','banca','financier',
    'procesal','procedimiento','recursos','casaci','apelaci','prueba','demanda','juicio','ejecuci',
    'tributario','fiscal','impuesto','isr','isv','renta','presupuesto',
    'administrativo','municipal','municipalidades','servicio publico','concesion',
    'registral','catastro','inscripcion','folio',
    'ley','codigo','decreto','acuerdo','reglamento','reforma','norma','disposiciones',
    'convenio','tratado','constitucion','constituci',
]

RAMAS_KEYWORDS_LOCAL = {
    "civil": ["civil","contrato","propiedad","obligacion","testamento","sucesi","herencia"],
    "familia": ["familia","matrimonio","divorcio","alimentos","adopci","patria potestad","filiaci"],
    "laboral": ["trabajo","laboral","salario","ihss","empleo","prestaciones","despido","indemnizaci"],
    "penal": ["penal","delito","crimen","homicidio","robo","hurto","estafa","victima","condena"],
    "procesal_civil": ["procesal civil","procedimiento civil","demanda civil"],
    "procesal_penal": ["procesal penal","procedimiento penal","investigacion penal"],
    "mercantil_financiero": ["comercio","mercantil","contratacion","sociedades","licitaci","consumidor","banca","financier"],
    "tributario_fiscal": ["tributario","fiscal","impuesto","isr","isv","renta","presupuesto"],
    "administrativo": ["administrativo","municipal","municipalidades","servicio publico","concesion"],
    "notarial_registral": ["notariado","notarial","registral","catastro","inscripcion","folio"],
    "constitucional": ["constitucion","constituci","garantia","derecho fundamental"],
    "procesal": ["procesal","procedimiento","recursos","casaci","apelaci","demanda","juicio","ejecuci"],
}

INSTITUCIONES = {
    "tsc.gob.hn": "Tribunal Superior de Cuentas",
    "poderjudicial.gob.hn": "Poder Judicial de Honduras",
    "sar.gob.hn": "Servicio de Administracion de Rentas",
    "oncae.gob.hn": "ONCAE",
    "notarioshonduras.org": "Union de Notarios de Honduras",
    "trabajo.gob.hn": "Secretaria de Trabajo y Seguridad Social",
    "cnbs.gob.hn": "Comision Nacional de Bancos y Seguros",
    "sefin.gob.hn": "Secretaria de Finanzas",
    "enag.gob.hn": "Empresa Nacional de Artes Graficas (La Gaceta)",
}

def detectar_institucion(domain):
    for key, name in INSTITUCIONES.items():
        if key in domain:
            return name
    return domain

def extraer_articulos(text):
    if not text:
        return []
    arts = set()
    for m in re.finditer(r'(?:Art\.?\s*|Articulo\s+|Artículo\s+|ARTÍCULO\s+|ARTICULO\s+)(\d+(?:[-–]\w+)?(?:\s*(?:bis|ter|quater))?)', text, re.IGNORECASE):
        arts.add(f"Art. {m.group(1).strip()}")
    return sorted(arts)[:40]

def detectar_rama_local(text, title=""):
    t = (title + " " + (text or "")[:3000]).lower()
    scores = {}
    for rama, kws in RAMAS_KEYWORDS_LOCAL.items():
        scores[rama] = sum(1 for kw in kws if kw in t)
    if not scores or max(scores.values()) == 0:
        return "desconocido"
    return max(scores, key=scores.get)

def detectar_tipo_documento(title, text):
    t = (title + " " + (text or "")[:1000]).lower()
    pares = [
        ("codigo", ["codigo","código"]),
        ("ley", ["ley ","ley de","ley del","ley organica","ley orgánica"]),
        ("decreto", ["decreto","decreto legislativo","decreto ejecutivo"]),
        ("reglamento", ["reglamento de","reglamento del","reglamento"]),
        ("sentencia", ["sentencia","sentencia de"]),
        ("acuerdo", ["acuerdo","acuerdo de","acuerdo del"]),
        ("tratado", ["tratado","convenio","convencion","convención"]),
        ("constitucion", ["constitucion","constitución","carta magna"]),
    ]
    for tipo, kws in pares:
        if any(kw in t for kw in kws):
            return tipo
    return "desconocido"

def calcular_quality_score(text, title=""):
    if not text or len(text) < 100:
        return 0.0
    score = 0.0
    score += min(1.0, len(text) / 50000) * 0.15
    alpha = sum(1 for c in text if c.isalpha() or c.isdigit() or c in " .,;:()[]{}")
    score += (alpha / max(len(text), 1)) * 0.20
    t = (text or "").lower()
    legal_matches = sum(1 for kw in CORE_KEYWORDS_FLAT if kw in t)
    score += min(1.0, legal_matches / 10) * 0.25
    arts = len(extraer_articulos(text))
    score += min(1.0, arts / 5) * 0.20
    if detectar_rama_local(text, title) != "desconocido":
        score += 0.10
    if detectar_tipo_documento(title, text) != "desconocido":
        score += 0.10
    return round(min(1.0, score), 4)

# ─── IA: EXTRACTOR DE METADATOS VIA DEEPSEEK ──────────
def extraer_metadatos_ia(title, url, domain, text):
    if not load_deepseek_key():
        return None
    fragment = (text or "")[:2000].replace('\n', ' ').replace('"', "'").replace('\t', ' ')
    prompt = (
        'Analiza este fragmento de documento legal hondureno. Devuelve SOLO un JSON '
        'sin markdown, sin backticks, sin explicaciones. Claves exactas:\n'
        '"rama": "civil|familia|laboral|penal|procesal_civil|procesal_penal|mercantil_financiero|tributario_fiscal|administrativo|notarial_registral|constitucional|desconocido",\n'
        '"tipo_documento": "codigo|ley|decreto|reglamento|sentencia|acuerdo|tratado|constitucion|desconocido",\n'
        '"temas": ["tema1","tema2","tema3"],\n'
        '"articulos_clave": ["Art. 1","Art. 2"],\n'
        '"institucion": "nombre o desconocido",\n'
        '"posible_vigencia": "vigente|derogado|parcial|desconocido",\n'
        '"confianza": 0.0-1.0\n\n'
        f'Fuente: {url}\nDominio: {domain}\nTitulo: {title}\n\nTexto: {fragment}'
    )
    result = call_deepseek(prompt, max_tokens=250, temperature=0.1)
    if not result:
        return None
    try:
        clean = result.strip()
        if clean.startswith("```json"):
            clean = clean[7:].strip()
        elif clean.startswith("```"):
            clean = clean.split("\n", 1)[1].rsplit("\n", 1)[0].strip()
        data = json.loads(clean)
        for k in ["rama","tipo_documento","institucion","posible_vigencia"]:
            if k not in data or not isinstance(data.get(k), str):
                data[k] = "desconocido"
        for k in ["temas","articulos_clave"]:
            if k not in data or not isinstance(data.get(k), list):
                data[k] = []
        if "confianza" not in data or not isinstance(data.get("confianza"), (int, float)):
            data["confianza"] = 0.5
        return data
    except:
        return None

# ─── DEDUPLICACION (SHA256) ─────────────────────────────
def sha256(texto):
    return hashlib.sha256(texto.encode("utf-8", errors="replace")).hexdigest()

def pdf_sha256(path):
    try:
        return hashlib.sha256(Path(path).read_bytes()).hexdigest()
    except:
        return ""

PENDING_REVIEW_LIMIT = 3  # N veces que un documento debe fallar calidad para ser marcado

# ─── INDEXACION ──────────────────────────────────────────
def indexar_en_db(source_id, title, text, meta=None):
    """Indexa en la BD via index-corpus-cli.ts. Guarda metadatos en corpus_data/metadata/."""
    if not text or len(text) < 100:
        return False
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", text).strip()
    if len(text) < 100:
        return False

    db_url = load_db_url()
    tmp = TEXT_DIR / f"{source_id}.txt"
    tmp.write_text(text, encoding="utf-8")

    indexed = False
    indexer = find_indexer()
    if not indexer:
        if meta:
            meta["index_status"] = "pending_indexer_review"
            meta["indexed"] = False
            (META_DIR / f"{source_id}.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
        return False

    if not db_url:
        if meta:
            meta["index_status"] = "missing_database_url"
            meta["indexed"] = False
            (META_DIR / f"{source_id}.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
        return False

    try:
        title_safe = title[:100].replace('"', "'").replace('$', '').replace('`', '')
        env = os.environ.copy()
        env["DATABASE_URL"] = db_url
        env["DOTENV_CONFIG_SILENT"] = "true"
        import shutil as _shutil2
        npx_path = _shutil2.which("npx.cmd") if sys.platform == "win32" else _shutil2.which("npx")
        npx_path = npx_path or ("npx.cmd" if sys.platform == "win32" else "npx")
        result = subprocess.run(
            [npx_path, "tsx", indexer, source_id, title_safe, str(tmp)],
            cwd=str(APP_DIR), env=env, capture_output=True, text=True,
            timeout=300, encoding="utf-8", errors="replace"
        )
        out = (result.stdout or "").strip()
        err = (result.stderr or "").strip()
        # Detectar fallo: "-> 0 chunks" (evitar falso positivo con "40 chunks"),
        # "error en chunk", "failed query" o "index_failed"
        out_lower = out.lower()
        err_lower = err.lower()
        stdout_fail = "-> 0 chunks" in out_lower or "error en chunk" in out_lower or "failed query" in out_lower
        stderr_fail = any(kw in err_lower for kw in ["error en chunk", "failed query", "index_failed"]) if err else False
        if stdout_fail or stderr_fail:
            if out:
                log(f"  ⚠️ {out} (posible error)")
            if err:
                for line in err.split('\n')[:3]:
                    ln = line.strip()
                    if ln and len(ln) > 5 and "injected env" not in ln and "dotenv" not in ln and "tip:" not in ln:
                        log(f"  {ln[:200]}")
            if meta:
                meta["errors"].append("indexacion: 0 chunks o error en BD")
                meta["index_status"] = "index_failed"
                meta["indexed"] = False
        elif out and "chars ->" in out:
            indexed = True
            log(f"  {out}")
        if err and not stdout_fail and not stderr_fail:
            if "injected env" not in err and "dotenv" not in err and "tip:" not in err:
                for line in err.split('\n')[:3]:
                    ln = line.strip()
                    if ln and len(ln) > 5:
                        log(f"  {ln[:200]}")
    except subprocess.TimeoutExpired:
        log(f"  Timeout indexando {source_id}")
    except Exception as e:
        log(f"  Error indexando {source_id}: {str(e)[:100]}")

    # Guardar metadata JSON
    if meta:
        meta_path = META_DIR / f"{source_id}.json"
        meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

    return indexed

def corpus_stats():
    try:
        stats_js = APP_DIR / "corpus_data" / "_stats.js"
        if stats_js.exists():
            result = subprocess.run(
                ["node", str(stats_js)],
                cwd=str(APP_DIR), capture_output=True, text=True, timeout=30, encoding="utf-8",
                env={**os.environ, "DATABASE_URL": load_db_url() or ""}
            )
            if result.stdout and "chunks" in result.stdout:
                return json.loads(result.stdout.strip())
    except:
        pass
    return None

# ─── SITEMAP ────────────────────────────────────────────
def descubrir_via_sitemap(domain):
    urls = set()
    sitemap_urls = [
        f"https://{domain}/sitemap.xml",
        f"https://{domain}/sitemap_index.xml",
        f"https://www.{domain}/sitemap.xml",
    ]
    for su in dict.fromkeys(sitemap_urls):
        try:
            import requests, xml.etree.ElementTree as ET
            r = requests.get(su, timeout=15, headers={"User-Agent": "JusticiaVerdadera/3.0"})
            if r.status_code != 200:
                continue
            root = ET.fromstring(r.text)
            for loc in root.iter():
                if loc.tag.endswith("}loc") or loc.tag == "loc":
                    if loc.text:
                        urls.add(loc.text.strip())
        except:
            continue
    if urls:
        log(f"  📋 Sitemap: {len(urls)} URLs en {domain}")
    return list(urls)

# ─── IA: CLASIFICADOR DE PAGINAS ───────────────────────
def clasificar_pagina_ambigua(title, links_text):
    if not load_deepseek_key():
        return False
    fragment = links_text[:500].replace('\n', ' ').replace('"', "'")
    prompt = (
        'Esta pagina web contiene o enlaza documentos legales de Honduras '
        '(Civil, Familia, Laboral, Penal, Procesal Civil, Procesal Penal, '
        'Mercantil/Financiero, Tributario/Fiscal, Administrativo/Municipal, '
        'Notarial/Registral, o Constitucional)? '
        'Responde UNICAMENTE "SI" o "NO".\n\n'
        f'Titulo: {title}\nEnlaces: {fragment}'
    )
    result = call_deepseek(prompt, max_tokens=3, temperature=0.0)
    return result.strip().upper().startswith("SI") if result else False

# ─── DESCARGA DE PDF ────────────────────────────────────
def descargar_pdf(url, out_path, domain):
    """Descarga PDF con validaciones. Retorna dict con resultado."""
    try:
        import requests
        r = requests.get(url, timeout=120, stream=True,
            headers={"User-Agent": "JusticiaVerdadera/3.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
        if r.status_code != 200:
            return {"ok": False, "error": f"HTTP {r.status_code}"}
        ct = r.headers.get("content-type", "")
        if "html" in ct.lower():
            return {"ok": False, "error": "content-type html (no es PDF)"}
        content = r.content
        if len(content) < 5000:
            return {"ok": False, "error": f"demasiado pequeno ({len(content)} bytes)"}
        if len(content) > 100 * 1024 * 1024:
            return {"ok": False, "error": f"demasiado grande ({len(content)//1024//1024} MB)"}
        out_path.write_bytes(content)
        return {"ok": True, "size": len(content)}
    except Exception as e:
        return {"ok": False, "error": str(e)[:80]}

# ─── NAVEGACION HIBRIDA ──────────────────────────────────
BLOCKED_DOMAINS = {}  # {domain: {"since": iso, "reason": str}}

def check_domain_block(domain):
    """Verifica si un dominio esta bloqueado temporalmente (backoff)."""
    if domain in BLOCKED_DOMAINS:
        info = BLOCKED_DOMAINS[domain]
        try:
            elapsed = (datetime.now(timezone.utc) - datetime.fromisoformat(info["since"])).total_seconds()
            if elapsed < 3600:  # 1 hora de bloqueo
                return True, info["reason"]
            del BLOCKED_DOMAINS[domain]
        except:
            del BLOCKED_DOMAINS[domain]
    return False, None

def mark_domain_blocked(domain, reason="blocked_or_captcha"):
    if domain not in BLOCKED_DOMAINS:
        BLOCKED_DOMAINS[domain] = {"since": datetime.now(timezone.utc).isoformat(), "reason": reason}
        log(f"  🚫 {domain} bloqueado: {reason} — pausado 1h")

# Alias del Poder Judicial que suelen bloquear
PODER_JUDICIAL_DOMAINS = {"poderjudicial.gob.hn", "www.poderjudicial.gob.hn",
                          "legislacion.poderjudicial.gob.hn"}

# Dominios con proteccion anti-bot conocida (no perder tiempo con ellos)
HARD_BLOCKED_DOMAINS = {}  # se llena dinamicamente

def should_use_playwright(args, url, html="", status=0, links=0, failures=0):
    """Decide si usar Playwright en vez de requests+BS4."""
    if args.no_playwright:
        return False
    if args.playwright_always:
        return True
    domain = urllib.parse.urlparse(url).netloc.lower() if url else ""
    if any(d in domain for d in PODER_JUDICIAL_DOMAINS):
        return False  # Poder Judicial bloquea incluso Playwright, no insistir
    if failures >= 2:
        return True
    if status == 403 or status == 0:
        return True
    if html and len(html) > 100 and links == 0:
        return True
    if html and "<script" in html[:3000] and links < 5:
        return True
    return False

# ─── EXPLORADOR ──────────────────────────────────────────
def explorar_sitio(domain, config, visited, stats, args):
    """Explora un dominio. Decide automaticamente entre requests+BS4 o Playwright."""
    blocked, reason = check_domain_block(domain)
    if blocked:
        log(f"  ⏸️  {domain} — omitido ({reason})")
        return 0

    playwright_ok = False
    try:
        from playwright.sync_api import sync_playwright
        playwright_ok = True
    except ImportError:
        if not args.no_playwright:
            log(f"  ⚠️ [{domain}] Playwright no instalado — usando solo requests+BS4")

    log(f"\n  🌐 {domain}  →  {config['start']}")

    vs = visited.get(domain, {})
    visited_urls = vs.get("pages", [])
    downloaded_pdfs = vs.get("pdfs", [])
    failed_urls = vs.get("failed", {})
    page_hashes = vs.get("hashes", {})

    cola = [(config["start"], 0)]
    sitemap_urls = descubrir_via_sitemap(domain)
    if sitemap_urls:
        skip_exts = ('.css','.js','.png','.jpg','.jpeg','.gif','.svg','.ico','.woff','.ttf','.xml','.json')
        for su in sitemap_urls:
            parsed = urllib.parse.urlparse(su)
            if domain in parsed.netloc.lower() and su not in visited_urls:
                if not parsed.path.lower().endswith(skip_exts) and su not in [u for u,_ in cola]:
                    cola.append((su, 1))

    # Intentar requests+BS4 primero (ligero)
    start_info = None
    try:
        import requests as req
        r = req.get(config["start"], timeout=20, headers={"User-Agent": "JusticiaVerdadera/3.0"})
        start_info = {"html": r.text, "status": r.status_code, "links": 0}
        if r.status_code == 403 or "captcha" in r.text.lower()[:2000] or "access denied" in r.text.lower()[:2000]:
            mark_domain_blocked(domain, f"HTTP {r.status_code} — acceso denegado")
            return 0
        if r.status_code == 200:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(r.text, _get_bs4_parser())
            start_info["links"] = len(soup.find_all("a", href=True))
    except Exception as e:
        log(f"  [{domain}] start probe: {type(e).__name__}: {str(e)[:100]}")
        es_ssl = "ssl" in type(e).__name__.lower() or "ssl" in str(e).lower()
        es_pj = any(pd in domain for pd in PODER_JUDICIAL_DOMAINS)
        if es_ssl and es_pj:
            mark_domain_blocked(domain, "ssl_error")
            log(f"  🚫 {domain}: SSLError — marcado access_limited/ssl_error, omitiendo seed")
            return 0
        start_info = {"html": "", "status": 0, "links": 0}

    usar_playwright = should_use_playwright(args, config["start"],
        start_info["html"], start_info["status"], start_info["links"],
        failed_urls.get(config["start"], {}).get("retries", 0) if isinstance(failed_urls.get(config["start"]), dict) else 0)

    if not usar_playwright and not args.playwright_always:
        # Usar requests+BS4
        nuevos, pages_visited, pdfs_encontrados, duplicados, fallidos = _explorar_con_requests(
            domain, config, cola, visited_urls, downloaded_pdfs, failed_urls, page_hashes, args, stats)
        visited[domain] = {"pages": visited_urls[-1000:], "pdfs": downloaded_pdfs,
                          "failed": failed_urls, "hashes": page_hashes,
                          "last_updated": datetime.now(timezone.utc).isoformat(),
                          "playwright_used": False}
        stats["sources"][domain] = stats["sources"].get(domain, 0) + nuevos
        log(f"  📊 {domain}: {pages_visited}p | {pdfs_encontrados}PDF | {nuevos}idx{' | '+str(duplicados)+'dup' if duplicados else ''}{' | '+str(fallidos)+'fail' if fallidos else ''} | BS4")
        return nuevos

    if not playwright_ok:
        # Ni playwright ni requests funcionaron bien, intentar BS4
        nuevos, pages_visited, pdfs_encontrados, duplicados, fallidos = _explorar_con_requests(
            domain, config, cola, visited_urls, downloaded_pdfs, failed_urls, page_hashes, args, stats)
        visited[domain] = {"pages": visited_urls[-1000:], "pdfs": downloaded_pdfs,
                          "failed": failed_urls, "hashes": page_hashes,
                          "last_updated": datetime.now(timezone.utc).isoformat(),
                          "playwright_used": False}
        stats["sources"][domain] = stats["sources"].get(domain, 0) + nuevos
        log(f"  📊 {domain}: {pages_visited}p | {pdfs_encontrados}PDF | {nuevos}idx{' | '+str(duplicados)+'dup' if duplicados else ''}{' | '+str(fallidos)+'fail' if fallidos else ''} | BS4(fallback)")
        return nuevos

    # Usar Playwright (modo avanzado)
    nuevos, pages_visited, pdfs_encontrados, duplicados, fallidos = _explorar_con_playwright(
        domain, config, cola, visited_urls, downloaded_pdfs, failed_urls, page_hashes, args, stats)
    visited[domain] = {"pages": visited_urls[-1000:], "pdfs": downloaded_pdfs,
                      "failed": failed_urls, "hashes": page_hashes,
                      "last_updated": datetime.now(timezone.utc).isoformat(),
                      "playwright_used": True}
    stats["sources"][domain] = stats["sources"].get(domain, 0) + nuevos
    log(f"  📊 {domain}: {pages_visited}p | {pdfs_encontrados}PDF | {nuevos}idx{' | '+str(duplicados)+'dup' if duplicados else ''}{' | '+str(fallidos)+'fail' if fallidos else ''} | PW")
    return nuevos

def _explorar_con_playwright(domain, config, cola, visited_urls, downloaded_pdfs, failed_urls, page_hashes, args, stats):
    """Explora usando Playwright con Chromium headless."""
    from playwright.sync_api import sync_playwright
    nuevos = 0
    pages_visited = 0
    pdfs_encontrados = 0
    duplicados = 0
    fallidos = 0
    paginas_ambiguas = 0
    import random as _rnd

    headless = not args.headed
    log(f"  🎭 Playwright {'visible' if args.headed else 'headless'}")

    with sync_playwright() as p:
        browser = None
        try:
            browser = p.chromium.launch(
                headless=headless,
                channel="chrome",
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled"]
            )
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1366, "height": 768}
            )
            page = context.new_page()
            page.set_default_timeout(15000)

            while cola and pages_visited < args.max_pages:
                url, depth = cola.pop(0)
                if url in visited_urls:
                    continue
                finfo = failed_urls.get(url)
                if finfo and finfo.get("retries", 0) >= 3:
                    try:
                        if (datetime.now(timezone.utc) - datetime.fromisoformat(finfo["last"])).total_seconds() < args.cycle_delay * 5:
                            continue
                        finfo["retries"] = 0
                    except:
                        finfo["retries"] = 0

                # Delay aleatorio entre paginas (800ms-2500ms)
                time.sleep(_rnd.uniform(0.8, 2.5))

                try:
                    resp = page.goto(url, timeout=20000, wait_until="domcontentloaded")
                    status = resp.status if resp else "?"
                    title = page.title()[:80] if page.title() else "(sin titulo)"

                    # Detectar CAPTCHA o bloqueo
                    page_text = page.content().lower()
                    if "captcha" in page_text or "cf-browser-verification" in page_text or "access denied" in page_text:
                        log(f"  🚫 [{status}] BLOQUEO/CAPTCHA en {domain}")
                        failed_urls[url] = failed_urls.get(url, {"retries": 0, "last": ""})
                        failed_urls[url]["retries"] = 99  # No reintentar
                        failed_urls[url]["last"] = datetime.now(timezone.utc).isoformat()
                        continue

                    pages_visited += 1
                    visited_urls.append(url)
                    if url in failed_urls:
                        del failed_urls[url]
                    try:
                        page_hashes[url] = sha256(page.content()[:5000])
                    except:
                        pass

                    log(f"  [{status}] {title}")
                    time.sleep(PAGE_DELAY)

                    links = page.eval_on_selector_all("a[href]",
                        "els => els.map(e => ({href: e.href, text: e.innerText.trim().slice(0,80)}))")
                    enlaces_pdf = 0
                    enlaces_subpagina = 0
                    links_ambiguos = []

                    for link in links:
                        href = link.get("href", "")
                        if not href or href.startswith(("javascript:","mailto:")):
                            continue
                        if 'congresonacional.hn' in href.lower():
                            continue

                        if ".pdf" in href.lower() or "wpdmdl=" in href.lower():
                            nombre = url_a_nombre(href)
                            if not any(kw in nombre.lower() for kw in CORE_KEYWORDS):
                                continue
                            pdf_hash = sha256(href)
                            if pdf_hash[:12] in downloaded_pdfs:
                                continue
                            pdfs_encontrados += 1
                            enlaces_pdf += 1
                            res = procesar_pdf(href, domain, link.get("text", ""), pdf_hash, downloaded_pdfs, args, stats)
                            if res.get("duplicate"):
                                duplicados += 1
                            elif res.get("indexed"):
                                nuevos += 1
                            elif res.get("error"):
                                fallidos += 1
                            continue

                        parsed = urllib.parse.urlparse(href)
                        if domain not in parsed.netloc.lower():
                            continue
                        if href in visited_urls or href in [u for u,_ in cola]:
                            continue
                        path_l = parsed.path.lower()
                        if path_l.endswith(('.css','.js','.png','.jpg','.jpeg','.gif','.svg','.ico','.woff','.ttf','.xml','.json')):
                            continue
                        if any(x in path_l for x in config.get("exclude", [])):
                            continue
                        if depth >= MAX_DEPTH:
                            continue

                        include_kw = config.get("paths_contains", [])
                        if depth == 0 and not any(kw in path_l for kw in include_kw):
                            link_t = link.get("text","").lower()
                            if any(kw in link_t for kw in ['ley','codigo','sentencia','jurisprudencia','reglamento','norma']):
                                links_ambiguos.append((href, link.get("text","")))
                            continue

                        clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                        if clean not in [u for u,_ in cola] and clean not in visited_urls:
                            cola.append((clean, depth + 1))
                            enlaces_subpagina += 1

                    if not args.no_ai:
                        for ah, at in links_ambiguos:
                            if pages_visited >= args.max_pages:
                                break
                            paginas_ambiguas += 1
                            parsed = urllib.parse.urlparse(ah)
                            clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                            if clean in visited_urls or clean in [u for u,_ in cola]:
                                continue
                            if clasificar_pagina_ambigua(at, at):
                                cola.append((clean, depth + 1))
                                enlaces_subpagina += 1

                    log(f"    {len(links)} links → {enlaces_subpagina} subs, {enlaces_pdf} PDFs")

                except Exception as e:
                    tb = traceback.format_exc()
                    last_line = tb.strip().split('\n')[-1] if tb.strip() else ''
                    log(f"  ❌ [{domain}] {url[:80]}: {type(e).__name__}: {str(e)[:100]}")
                    log(f"    Traceback: {last_line[:200]}")
                    err_name = type(e).__name__
                    if "Execution context was destroyed" in str(e):
                        log(f"  ⚠️ [{domain}] Playwright: navegacion interrumpida — continuando")
                        continue
                    failed_urls[url] = failed_urls.get(url, {"retries": 0, "last": ""})
                    failed_urls[url]["retries"] += 1
                    failed_urls[url]["last"] = datetime.now(timezone.utc).isoformat()
        finally:
            if browser:
                try: browser.close()
                except: pass

    return nuevos, pages_visited, pdfs_encontrados, duplicados, fallidos

def _explorar_con_requests(domain, config, cola, visited_urls, downloaded_pdfs, failed_urls, page_hashes, args, stats):
    """Explorar con requests + BeautifulSoup (sin Playwright). Totalmente funcional."""
    import requests as req
    from bs4 import BeautifulSoup

    nuevos = 0
    pages_visited = 0
    pdfs_encontrados = 0
    duplicados = 0
    fallidos = 0

    while cola and pages_visited < args.max_pages:
        url, depth = cola.pop(0)
        if url in visited_urls:
            continue
        finfo = failed_urls.get(url)
        if finfo and finfo.get("retries", 0) >= 3:
            try:
                if (datetime.now(timezone.utc) - datetime.fromisoformat(finfo["last"])).total_seconds() < args.cycle_delay * 5:
                    continue
                finfo["retries"] = 0
            except:
                finfo["retries"] = 0

        try:
            r = req.get(url, timeout=20, headers={"User-Agent": "JusticiaVerdadera/3.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
            if r.status_code != 200:
                failed_urls[url] = failed_urls.get(url, {"retries": 0, "last": ""})
                failed_urls[url]["retries"] += 1
                failed_urls[url]["last"] = datetime.now(timezone.utc).isoformat()
                continue

            pages_visited += 1
            visited_urls.append(url)
            if url in failed_urls:
                del failed_urls[url]
            try:
                page_hashes[url] = sha256(r.text[:5000])
            except:
                pass

            soup = BeautifulSoup(r.text, _get_bs4_parser())
            title = soup.title.string.strip()[:80] if soup.title and soup.title.string else "(sin titulo)"
            log(f"  [200] {title}")

            time.sleep(PAGE_DELAY)

            enlaces_pdf = 0
            enlaces_subpagina = 0
            links_ambiguos = []

            for a in soup.find_all("a", href=True):
                href = a["href"]
                if not href or href.startswith(("javascript:","mailto:")):
                    continue
                full_href = urllib.parse.urljoin(url, href)
                if 'congresonacional.hn' in full_href.lower():
                    continue

                if ".pdf" in full_href.lower() or "wpdmdl=" in full_href.lower():
                    nombre = url_a_nombre(full_href)
                    if not any(kw in nombre.lower() for kw in CORE_KEYWORDS):
                        continue
                    pdf_hash = sha256(full_href)
                    pdfs_encontrados += 1
                    enlaces_pdf += 1
                    res = procesar_pdf(full_href, domain, (a.get_text(strip=True) or "")[:80], pdf_hash, downloaded_pdfs, args, stats)
                    if res.get("duplicate"):
                        duplicados += 1
                    elif res.get("indexed"):
                        nuevos += 1
                    elif res.get("error"):
                        fallidos += 1
                    continue

                parsed = urllib.parse.urlparse(full_href)
                if domain not in parsed.netloc.lower():
                    continue
                if full_href in visited_urls or full_href in [u for u,_ in cola]:
                    continue
                path_l = parsed.path.lower()
                if path_l.endswith(('.css','.js','.png','.jpg','.jpeg','.gif','.svg','.ico','.woff','.ttf','.xml','.json')):
                    continue
                if any(x in path_l for x in config.get("exclude", [])):
                    continue
                if depth >= MAX_DEPTH:
                    continue

                include_kw = config.get("paths_contains", [])
                if depth == 0 and not any(kw in path_l for kw in include_kw):
                    link_text = (a.get_text(strip=True) or "").lower()
                    if any(kw in link_text for kw in ['ley','codigo','sentencia','jurisprudencia','reglamento','norma']):
                        links_ambiguos.append((full_href, link_text))
                    continue

                clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                if clean not in [u for u,_ in cola] and clean not in visited_urls:
                    cola.append((clean, depth + 1))
                    enlaces_subpagina += 1

            log(f"    {len(soup.find_all('a', href=True))} links → {enlaces_subpagina} subs, {enlaces_pdf} PDFs")

        except Exception as e:
            tb = traceback.format_exc()
            last_line = tb.strip().split('\n')[-1] if tb.strip() else ''
            log(f"  ❌ [{domain}] {url[:80]}: {type(e).__name__}: {str(e)[:100]}")
            log(f"    Traceback: {last_line[:200]}")
            es_ssl = "ssl" in type(e).__name__.lower() or "ssl" in str(e).lower()
            es_pj = any(pd in domain for pd in PODER_JUDICIAL_DOMAINS)
            if es_ssl and es_pj:
                mark_domain_blocked(domain, "ssl_error")
                log(f"  🚫 {domain}: SSLError — marcado access_limited/ssl_error")
                break
            failed_urls[url] = failed_urls.get(url, {"retries": 0, "last": ""})
            failed_urls[url]["retries"] += 1
            failed_urls[url]["last"] = datetime.now(timezone.utc).isoformat()

    return nuevos, pages_visited, pdfs_encontrados, duplicados, fallidos

def _has_lxml():
    try:
        import lxml; return True
    except ImportError:
        return False

def _has_playwright():
    try:
        from playwright.sync_api import sync_playwright; return True
    except ImportError:
        return False

# Cache del indexador
_INDEXER_PATH = None
def find_indexer():
    """Busca index-corpus-cli.ts. Cachea resultado."""
    global _INDEXER_PATH
    if _INDEXER_PATH is not None:
        return _INDEXER_PATH
    candidates = [
        APP_DIR / "index-corpus-cli.ts",
        APP_DIR / "app" / "index-corpus-cli.ts",
        APP_DIR / "scripts" / "index-corpus-cli.ts",
        APP_DIR / "app" / "scripts" / "index-corpus-cli.ts",
    ]
    for c in candidates:
        if c.exists():
            _INDEXER_PATH = str(c)
            return _INDEXER_PATH
    _INDEXER_PATH = ""
    return ""

def _dedup_check(pdf_sha, text_sha):
    """Verifica si un documento ya existe en metadata/ por SHA256."""
    if not pdf_sha and not text_sha:
        return None
    try:
        for mf in META_DIR.glob("*.json"):
            try:
                meta = json.loads(mf.read_text(encoding="utf-8"))
                if pdf_sha and meta.get("pdf_sha256") == pdf_sha:
                    return meta.get("source_id")
                if text_sha and meta.get("text_sha256") == text_sha:
                    return meta.get("source_id")
            except:
                continue
    except:
        pass
    return None
_BS4_PARSER = None
_BS4_PARSER_LOGGED = False
def _get_bs4_parser():
    global _BS4_PARSER, _BS4_PARSER_LOGGED
    if _BS4_PARSER is None:
        _BS4_PARSER = "lxml" if _has_lxml() else "html.parser"
    if not _BS4_PARSER_LOGGED:
        log(f"  📄 HTML parser: {_BS4_PARSER}")
        _BS4_PARSER_LOGGED = True
    return _BS4_PARSER

def url_a_nombre(href):
    nombre = href.lower().split('/')[-1].split('?')[0].split('#')[0]
    if not nombre or not nombre.endswith('.pdf'):
        nombre = f"doc_{sha256(href)[:8]}.pdf"
    return nombre

def procesar_pdf(href, domain, link_text, pdf_hash, downloaded_pdfs, args, stats):
    """Descarga, procesa e indexa un PDF. Retorna resultado estructurado."""
    src_name = f"{domain.replace('.','-')}_{pdf_hash[:12]}"
    out = PDF_DIR / f"{src_name}.pdf"
    meta_path = META_DIR / f"{src_name}.json"
    text_path = TEXT_DIR / f"{src_name}.txt"

    # Verificar si ya existe y si necesita reprocesamiento
    if out.exists():
        if not args.reprocess_existing:
            if meta_path.exists() and text_path.exists():
                downloaded_pdfs.append(pdf_hash[:12])
                return {"processed": False, "indexed": False, "duplicate": True, "error": None, "status": "duplicate"}
        downloaded_pdfs.append(pdf_hash[:12])

    log(f"  📥 PDF: {href[:100]}")

    if not out.exists():
        dl = descargar_pdf(href, out, domain)
        if not dl["ok"]:
            log(f"    ❌ {dl['error']}")
            return {"processed": False, "indexed": False, "duplicate": False, "error": dl["error"], "status": "download_failed"}
        log(f"    ✅ {dl['size']//1024} KB")
    else:
        log(f"    📎 PDF existente ({out.stat().st_size//1024} KB) — reprocesando")

    ocr_result = ocr_pdf(str(out))
    text = ocr_result["text"]
    method = ocr_result["method"]
    pages = ocr_result["pages"]

    quality = calcular_quality_score(text, link_text)
    pending_review = quality < 0.4
    article_refs = extraer_articulos(text) if text else []
    rama_local = detectar_rama_local(text, link_text) if text else "desconocido"
    tipo_local = detectar_tipo_documento(link_text, text) if text else "desconocido"
    institucion = detectar_institucion(domain)
    pdf_sha = pdf_sha256(str(out)) if out.exists() else ""
    text_sha = sha256(text) if text else ""

    # ─── Deduplicacion SHA256 ──────────────────────
    dup_id = _dedup_check(pdf_sha, text_sha)
    if dup_id:
        # Anadir URL como alternativa
        try:
            dup_meta = json.loads((META_DIR / f"{dup_id}.json").read_text(encoding="utf-8"))
            alt_urls = dup_meta.get("alternative_urls", [])
            if href not in alt_urls:
                alt_urls.append(href)
                dup_meta["alternative_urls"] = alt_urls
                (META_DIR / f"{dup_id}.json").write_text(json.dumps(dup_meta, indent=2, ensure_ascii=False), encoding="utf-8")
        except:
            pass
        downloaded_pdfs.append(pdf_hash[:12])
        log(f"    🔁 PDF duplicado (SHA256={pdf_sha[:12]}), URL anadida como alternativa a {dup_id}")
        return {"processed": False, "indexed": False, "duplicate": True, "error": None, "status": "duplicate"}

    meta_ia = None
    if not args.no_ai:
        meta_ia = extraer_metadatos_ia(link_text[:100], href, domain, text[:2000] if text else "")

    meta = {
        "source_id": src_name, "url": href, "alternative_urls": [],
        "title": link_text[:100], "domain": domain,
        "institution": meta_ia.get("institucion", institucion) if meta_ia else institucion,
        "country": "Honduras",
        "rama": meta_ia.get("rama", rama_local) if meta_ia else rama_local,
        "legal_area": meta_ia.get("rama", rama_local) if meta_ia else rama_local,
        "document_type": meta_ia.get("tipo_documento", tipo_local) if meta_ia else tipo_local,
        "topics": meta_ia.get("temas", []) if meta_ia else [],
        "article_refs": article_refs,
        "possible_validity": meta_ia.get("posible_vigencia", "desconocido") if meta_ia else "desconocido",
        "pdf_sha256": pdf_sha, "text_sha256": text_sha,
        "downloaded_at": datetime.fromtimestamp(out.stat().st_mtime, tz=timezone.utc).isoformat() if out.exists() else datetime.now(timezone.utc).isoformat(),
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "extraction_method": method, "page_count": pages,
        "word_count": len(text.split()) if text else 0,
        "quality_score": quality,
        "indexed": False, "index_status": "pending",
        "pending_review": pending_review, "errors": [],
        "ia_confidence": meta_ia.get("confianza", None) if meta_ia else None,
        "source_type": "pdf_seed", "official": True, "prioridad": "media",
        "is_core_source": False, "is_complementary_source": False, "is_pending_source": False,
        "validated_externally": False, "validation_status": "runtime", "validation_notes": "",
        "playwright_used": getattr(args, 'playwright_always', False),
    }

    if not text or len(text) < 100:
        meta["errors"].append(f"texto insuficiente ({len(text)} chars)")
        meta["index_status"] = "no_text"
    elif pending_review and not args.index_low_quality:
        meta["errors"].append(f"quality_score bajo ({quality}) — no indexado")
        meta["index_status"] = "pending_review"

    # Guardar texto
    if text and len(text) >= 100:
        text_path.write_text(text, encoding="utf-8")

    # Indexar si cumple calidad
    if text and len(text) >= 100:
        if not pending_review or args.index_low_quality:
            meta["indexed"] = indexar_en_db(src_name, f"{link_text[:100]} - {domain}", text, meta)
            if not meta["indexed"] and meta.get("index_status") not in ("missing_database_url","pending_indexer_review","pending_review","no_text"):
                meta["index_status"] = "index_failed"
            elif meta["indexed"]:
                meta["index_status"] = "indexed"

    # Guardar metadata
    meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

    if meta["indexed"]:
        cs = corpus_stats()
        if cs:
            log(f"    📊 +{meta['word_count']:,} palabras → corpus: {cs.get('chars', 0):,} chars")

    return {
        "processed": True,
        "indexed": meta.get("indexed", False),
        "duplicate": False,
        "error": None if meta.get("indexed") else (meta.get("errors", [None])[0] if meta.get("errors") else None),
        "status": meta.get("index_status", "unknown"),
    }

# ─── URLs FIJAS ──────────────────────────────────────────
def validar_fuente(url, expected_type="pdf"):
    """Valida URL en runtime. HEAD -> GET range -> %PDF. Sin red = network_unavailable."""
    try:
        import requests as _r
        # Intentar HEAD primero (ligero)
        try:
            resp = _r.head(url, timeout=10, allow_redirects=True,
                           headers={"User-Agent": "JusticiaVerdadera/3.0"})
        except:
            resp = None
        if resp and resp.status_code == 200:
            ct = resp.headers.get("content-type", "").lower()
            cl = resp.headers.get("content-length", "0")
            if expected_type == "pdf" and "pdf" not in ct and "octet-stream" not in ct:
                pass  # HEAD no concluyente, intentar GET
            elif cl.isdigit() and int(cl) < 5000:
                return {"ok": False, "reason": f"demasiado pequeno ({cl} bytes)"}
            else:
                return {"ok": True, "content_type": ct, "size": int(cl) if cl.isdigit() else 0}
        
        # GET con Range para verificar %PDF sin descargar todo
        try:
            resp2 = _r.get(url, timeout=15, stream=True, allow_redirects=True,
                           headers={"User-Agent": "JusticiaVerdadera/3.0", "Range": "bytes=0-4096"})
            if resp2.status_code in (200, 206):
                chunk = resp2.iter_content(4096)
                data = next(chunk, b"")
                resp2.close()
                if expected_type == "pdf" and data[:4] != b"%PDF":
                    return {"ok": False, "reason": "no es PDF (falta cabecera %PDF)"}
                ct2 = resp2.headers.get("content-type", "").lower()
                cl2 = resp2.headers.get("content-length", "0")
                if cl2.isdigit() and int(cl2) < 5000:
                    return {"ok": False, "reason": f"demasiado pequeno ({cl2} bytes)"}
                return {"ok": True, "content_type": ct2, "size": int(cl2) if cl2.isdigit() else 0}
            else:
                return {"ok": False, "reason": f"HTTP {resp2.status_code}"}
        except:
            pass
        return {"ok": False, "reason": "no se pudo validar"}
    except Exception as e:
        msg = str(e)[:60].lower()
        if "name or service not known" in msg or "getaddrinfo" in msg or "connection" in msg:
            return {"ok": False, "reason": "network_unavailable"}
        return {"ok": False, "reason": str(e)[:80]}

def is_tsc_source(info_or_url):
    """Determina si una fuente pertenece a TSC por URL, dominio o institucion."""
    if isinstance(info_or_url, str):
        return any(d in info_or_url.lower() for d in TSC_DOMAINS)
    url = (info_or_url.get("url") or "").strip().lower()
    institucion = (info_or_url.get("institucion") or "").lower()
    for domain in TSC_DOMAINS:
        if domain in url:
            return True
    if "tribunal superior de cuentas" in institucion:
        return True
    return False

def _enrich_tsc_metadata(sources):
    """Agrega metadatos de inaccesibilidad a fuentes TSC."""
    tsc_notes = "Fuente oficial, pero inaccesible desde la red actual. Validar con VPN/red hondureña o ejecucion manual."
    for key, info in sources.items():
        if is_tsc_source(info):
            info["access_status"] = "blocked_from_current_network"
            info["requires_manual_validation"] = True
            info["process_by_default"] = False
            info["validation_notes"] = tsc_notes

def _get_fixed_sources(args):
    """Devuelve las fuentes fijas a procesar segun flags."""
    sources = dict(URLS_FIJAS_CORE)
    if args.include_complementary:
        sources.update(URLS_FIJAS_COMPLEMENTARIAS)
    if args.include_pending:
        # Solo incluir pendientes con URL no vacia
        for k, v in URLS_FIJAS_PENDIENTES.items():
            if v.get("url", "").strip():
                sources[k] = v

    _enrich_tsc_metadata(sources)

    # Por defecto, excluir fuentes TSC a menos que --include-tsc este activo.
    # Si el PDF ya existe localmente, permitir reprocesamiento local sin red.
    if not args.include_tsc:
        filtered = {}
        for key, info in sources.items():
            if is_tsc_source(info):
                pdf_path = PDF_DIR / f"{key}.pdf"
                if pdf_path.exists():
                    # PDF local existente: permitir reprocesar sin descargar
                    filtered[key] = info
                # Si no existe PDF local, se omite
            else:
                filtered[key] = info
        sources = filtered

    return sources

def revisar_urls_fijas(state, args):
    """Revisa URLs fijas. Reprocesa PDFs existentes si falta texto/metadata."""
    import requests as _req
    sources = _get_fixed_sources(args)
    core_procesables = sum(1 for k in sources if k in URLS_FIJAS_CORE)
    tsc_omitidas = sum(1 for k, v in URLS_FIJAS_CORE.items() if is_tsc_source(v) and k not in sources)
    compl_total = len(URLS_FIJAS_COMPLEMENTARIAS)
    compl_incluidas = sum(1 for k in sources if k in URLS_FIJAS_COMPLEMENTARIAS)
    pend_total = len([v for v in URLS_FIJAS_PENDIENTES.values() if v.get("url","").strip()])
    pend_incluidas = sum(1 for k in sources if k in URLS_FIJAS_PENDIENTES)
    log(f"\n  URLs fijas procesables: {len(sources)}")
    log(f"  Core: {core_procesables}/{len(URLS_FIJAS_CORE)} | TSC omitidas por red actual: {tsc_omitidas}")
    log(f"  Complementarias incluidas: {compl_incluidas}/{compl_total} | Pendientes incluidas: {pend_incluidas}/{pend_total}")
    nuevos = 0
    for key, info in sources.items():
        url = info.get("url", "")
        if not url.strip():
            continue
        out = PDF_DIR / f"{key}.pdf"
        text_path = TEXT_DIR / f"{key}.txt"
        meta_path = META_DIR / f"{key}.json"

        # Decidir si procesar
        necesita_descarga = not out.exists()
        necesita_procesar = necesita_descarga or args.reprocess_existing
        if out.exists() and not args.reprocess_existing:
            # PDF existe: verificar si falta texto o metadata
            if not text_path.exists() or not meta_path.exists():
                necesita_procesar = True
            else:
                try:
                    meta = json.loads(meta_path.read_text())
                    if not meta.get("indexed") or not meta.get("text_sha256"):
                        necesita_procesar = True
                except:
                    necesita_procesar = True

        if not necesita_procesar:
            continue

        try:
            if necesita_descarga:
                es_tsc = is_tsc_source(info)
                timeout = 30 if es_tsc else 120
                try:
                    r = _req.get(url, timeout=timeout, headers={"User-Agent": "JusticiaVerdadera/3.0"})
                except Exception as e:
                    if es_tsc:
                        log(f"  ⚠️ {key}: TSC timeout o error de red — omitido")
                    else:
                        log(f"  ⚠️ {key}: {str(e)[:60]} — omitido")
                    continue
                if r.status_code != 200 or len(r.content) < 5000:
                    log(f"  ⚠️ {key}: HTTP {r.status_code}, {len(r.content)} bytes — omitido")
                    continue
                out.write_bytes(r.content)
                log(f"  ✅ {key} ({len(r.content)//1024} KB)")
            else:
                log(f"  📎 {key} — reprocesando PDF existente ({out.stat().st_size//1024} KB)")

            ocr_result = ocr_pdf(str(out))
            text = ocr_result["text"]
            if text and len(text) >= 100:
                quality = calcular_quality_score(text, info.get("title", key))
                article_refs = extraer_articulos(text)
                rama_local = detectar_rama_local(text, info.get("title", ""))
                tipo_local = detectar_tipo_documento(info.get("title", ""), text)
                institucion = info.get("institucion", detectar_institucion("tsc.gob.hn"))

                meta_ia = None
                if not args.no_ai:
                    meta_ia = extraer_metadatos_ia(info.get("title", key)[:100], url, "url-fija", text[:2000])

                pdf_sha = pdf_sha256(str(out))
                text_sha = sha256(text)

                # ─── Deduplicacion ──────────────────
                dup_id = _dedup_check(pdf_sha, text_sha)
                if dup_id:
                    try:
                        dup_meta = json.loads((META_DIR / f"{dup_id}.json").read_text(encoding="utf-8"))
                        alt_urls = dup_meta.get("alternative_urls", [])
                        if url not in alt_urls:
                            alt_urls.append(url)
                            dup_meta["alternative_urls"] = alt_urls
                            (META_DIR / f"{dup_id}.json").write_text(json.dumps(dup_meta, indent=2, ensure_ascii=False), encoding="utf-8")
                    except:
                        pass
                    log(f"    🔁 Duplicado SHA256, URL añadida a {dup_id}")
                    continue

                meta = {
                    "source_id": key, "url": url, "alternative_urls": [],
                    "title": info.get("title", key), "domain": "url-fija",
                    "institution": institucion, "country": "Honduras",
                    "rama": info.get("rama", rama_local),
                    "legal_area": meta_ia.get("rama", rama_local) if meta_ia else rama_local,
                    "document_type": meta_ia.get("tipo_documento", tipo_local) if meta_ia else tipo_local,
                    "topics": meta_ia.get("temas", []) if meta_ia else [],
                    "article_refs": article_refs,
                    "possible_validity": meta_ia.get("posible_vigencia", "desconocido") if meta_ia else "desconocido",
                    "pdf_sha256": pdf_sha256(str(out)), "text_sha256": sha256(text),
                    "downloaded_at": datetime.fromtimestamp(out.stat().st_mtime, tz=timezone.utc).isoformat(),
                    "processed_at": datetime.now(timezone.utc).isoformat(),
                    "extraction_method": ocr_result["method"],
                    "page_count": ocr_result["pages"],
                    "word_count": len(text.split()),
                    "quality_score": quality,
                    "indexed": False, "index_status": "pending",
                    "pending_review": quality < 0.4,
                    "errors": [],
                    "source_type": info.get("source_type", "pdf_directo"),
                    "official": info.get("official", True),
                    "prioridad": info.get("prioridad", "desconocida"),
                    "is_core_source": info.get("is_core_source", False),
                    "is_complementary_source": info.get("is_complementary_source", False),
                    "is_pending_source": info.get("is_pending_source", False),
                    "validated_externally": info.get("validated_externally", False),
                    "validation_status": info.get("validation_status", "unknown"),
                    "validation_notes": info.get("validation_notes", ""),
                    "ia_confidence": meta_ia.get("confianza", None) if meta_ia else None,
                }

                if not text or len(text) < 100:
                    meta["errors"].append("texto insuficiente")
                    meta["index_status"] = "no_text"
                elif meta["pending_review"] and not args.index_low_quality:
                    meta["errors"].append(f"quality_score bajo ({quality})")
                    meta["index_status"] = "pending_review"
                    meta["indexed"] = False
                else:
                    meta["indexed"] = indexar_en_db(key, info.get("title", key), text, meta)
                    if not meta["indexed"] and meta.get("index_status") not in ("missing_database_url","pending_indexer_review","pending_review","no_text"):
                        meta["index_status"] = "index_failed"
                    elif meta["indexed"]:
                        meta["index_status"] = "indexed"
                    if meta["indexed"]:
                        nuevos += 1

                # Guardar texto
                text_path.write_text(text, encoding="utf-8")
                # Guardar metadata
                meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

                if meta.get("indexed"):
                    cs = corpus_stats()
                    if cs:
                        log(f"    📊 +{meta['word_count']:,} palabras → corpus: {cs.get('chars', 0):,} chars")
            else:
                log(f"  ⚠️ {key}: sin texto extraible")
            time.sleep(3)
        except Exception as e:
            log(f"  ❌ {key}: {str(e)[:80]}")
    state["sources"]["urls_fijas"] = state["sources"].get("urls_fijas", 0) + nuevos
    return nuevos

# ─── CICLO ────────────────────────────────────────────────
def run_cycle(args):
    state = load_json(STATE_FILE, {"sources": {}, "total_pdfs": 0, "consecutive_empty": 0})
    visited = load_json(VISITED_FILE, {})

    log(f"\n{'#'*50}")
    log(f"# CICLO {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log(f"{'#'*50}")

    total_nuevos = 0
    if not args.only_seeds:
        total_nuevos += revisar_urls_fijas(state, args)

    if args.only_fixed:
        save_json(STATE_FILE, state)
        save_json(VISITED_FILE, visited)
        return

    # Filtrar seeds TSC si --include-tsc no esta activo
    seeds_a_usar = {}
    for domain_key, config in SEEDS.items():
        start_url = (config.get("start") or "").strip().lower()
        if is_tsc_source(start_url) and not args.include_tsc:
            log(f"  Seed '{domain_key}' TSC omitida por defecto. Usa --include-tsc para intentarla.")
            continue
        seeds_a_usar[domain_key] = config

    log(f"\n  EXPLORANDO {len(seeds_a_usar)} sitios..." + (f" (TSC omitidas: {len(SEEDS)-len(seeds_a_usar)})" if len(seeds_a_usar) < len(SEEDS) else ""))
    with ThreadPoolExecutor(max_workers=3) as executor:
        futuros = {executor.submit(explorar_sitio, d, c, visited, state, args): d for d, c in seeds_a_usar.items()}
        for futuro in as_completed(futuros):
            domain = futuros[futuro]
            try:
                nd = futuro.result(timeout=900)
                if nd and isinstance(nd, (int, float)):
                    total_nuevos += nd
            except Exception as e:
                tb = traceback.format_exc()
                last_line = tb.strip().split('\n')[-1] if tb.strip() else ''
                log(f"  Error en {domain}: {type(e).__name__}: {e}")
                log(f"    Traceback: {last_line[:200]}")
            time.sleep(2)

    save_json(STATE_FILE, state)
    save_json(VISITED_FILE, visited)

    if total_nuevos == 0:
        state["consecutive_empty"] = state.get("consecutive_empty", 0) + 1
        save_json(STATE_FILE, state)

    s = corpus_stats()
    if s:
        log(f"\n  CORPUS: {s.get('chunks',0):,} chunks | {s.get('chars',0):,} chars | {len(s.get('fuentes',[]))} fuentes")
    if total_nuevos == 0:
        log(f"  ⚠️ Sin documentos nuevos — verificando conectividad .gob.hn")

# ─── MAIN ─────────────────────────────────────────────────
class Args:
    def __init__(self):
        self.once = False
        self.reset = False
        self.dry_run = False
        self.only_fixed = False
        self.only_seeds = False
        self.no_ai = False
        self.no_playwright = False
        self.headed = False
        self.playwright_always = False
        self.reprocess_existing = False
        self.index_low_quality = False
        self.include_complementary = False
        self.include_pending = False
        self.include_tsc = False
        self.validate_sources = False
        self.max_pages = MAX_PAGES_PER_DOMAIN_PER_CYCLE
        self.cycle_delay = CYCLE_DELAY

def main(args):
    if not args.dry_run:
        if not load_db_url():
            log("ERROR: DATABASE_URL no encontrada en .env.local", "ERROR")
        load_deepseek_key()

    if args.validate_sources:
        log(f"\n  VALIDACION DE FUENTES:")
        to_validate = {**URLS_FIJAS_CORE, **URLS_FIJAS_COMPLEMENTARIAS}
        if args.include_pending:
            to_validate.update(URLS_FIJAS_PENDIENTES)
        for name, src in to_validate.items():
            url = src.get("url", "")
            if not url:
                continue
            result = validar_fuente(url)
            status = "OK" if result["ok"] else result.get("reason", "?")
            log(f"  {'✅' if result['ok'] else '⚠️'} {name}: {status}")
        return

    log(f"{'='*55}")
    log(f"  CRAWLER AUTONOMO v3.0 — CORPUS LEGAL HONDURENO")
    if args.dry_run:
        log(f"  MODO: dry-run — diagnostico sin cambios")
        log(f"  Rutas: PDF={PDF_DIR} | TXT={TEXT_DIR} | META={META_DIR} | LOG={LOG_DIR}")
        log(f"  _stats.js: {'OK' if (APP_DIR / 'corpus_data' / '_stats.js').exists() else 'FALTA'}")
        found = find_indexer()
        log(f"  Indexador: {'OK' if found else 'FALTA'}")
        log(f"  HTML parser: {_get_bs4_parser()}")
        log(f"  Playwright: {'disponible' if _has_playwright() else 'NO DISPONIBLE'}")
        log(f"  DeepSeek: {'configurado' if load_deepseek_key() else 'NO DISPONIBLE'} | Modelo: {DEEPSEEK_MODEL}")
        log(f"  Fuentes: core={len(URLS_FIJAS_CORE)} | compl={len(URLS_FIJAS_COMPLEMENTARIAS)} | pend={len(URLS_FIJAS_PENDIENTES)} | seeds={len(SEEDS)}")
        ts = sum(1 for v in URLS_FIJAS_CORE.values() if is_tsc_source(v))
        if args.include_tsc:
            log(f"  TSC: {ts} fuentes core incluidas via --include-tsc")
        else:
            log(f"  TSC: {ts} fuentes core omitidas por defecto (usa --include-tsc para activar)")
        log(f"  Dependencias: requests, PyMuPDF, bs4, lxml={_has_lxml()}")
        log(f"{'='*55}")
        log("\n  Dry-run completado. No se realizaron cambios.")
        return

    log(f"{'='*55}")
    log(f"  CRAWLER AUTONOMO v3.0 — CORPUS LEGAL HONDURENO")
    log(f"  Sitios: {len(SEEDS)} | Fijas: {len(URLS_FIJAS)} | MaxPag/Sitio: {args.max_pages}")
    if args.no_ai:
        log(f"  MODO: sin IA")
    if args.no_playwright:
        log(f"  MODO: sin Playwright")
    if args.playwright_always:
        log(f"  MODO: Playwright siempre")
    if args.only_fixed:
        log(f"  MODO: solo URLs fijas core")
    if args.only_seeds:
        log(f"  MODO: solo semillas")
    if args.include_complementary:
        log(f"  MODO: incluye complementarias")
    if args.include_pending:
        log(f"  MODO: incluye pendientes")
    if args.include_tsc:
        log(f"  MODO: incluye TSC (inaccesible por defecto desde esta red)")
    if not args.include_tsc:
        log(f"  TSC omitido por defecto: fuente oficial inaccesible desde esta red. Usa --include-tsc para intentar validarla.")
    if args.reprocess_existing:
        log(f"  MODO: reprocesar existentes")
    if args.index_low_quality:
        log(f"  MODO: indexar baja calidad")
    log(f"  DeepSeek: {'configurado' if load_deepseek_key() else 'NO DISPONIBLE'} | Modelo: {DEEPSEEK_MODEL}")
    log(f"{'='*55}")

    ciclo = 0
    backoff = args.cycle_delay
    try:
        while True:
            ciclo += 1
            log(f"\n  CICLO #{ciclo}")
            run_cycle(args)

            state = load_json(STATE_FILE, {"consecutive_empty": 0})
            consecutive = state.get("consecutive_empty", 0)
            backoff = min(args.cycle_delay * (2 ** max(0, consecutive - 2)), 600) if consecutive >= 3 else args.cycle_delay

            if not args.once:
                log(f"\n  Proximo ciclo en {backoff}s...  (Ctrl+C para detener)")
                time.sleep(backoff)
            else:
                break
    except KeyboardInterrupt:
        log("\n  Detenido por el usuario. Guardando estado...")
        save_json(STATE_FILE, load_json(STATE_FILE, {}))
        save_json(VISITED_FILE, load_json(VISITED_FILE, {}))

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Justicia Verdadera — Crawler Autonomo v3.0")
    p.add_argument("--once", action="store_true", help="Ejecutar un solo ciclo y salir")
    p.add_argument("--reset", action="store_true", help="Borrar visited.json y state.json")
    p.add_argument("--dry-run", action="store_true", help="Modo prueba: validar config sin descargar ni indexar")
    p.add_argument("--only-fixed", action="store_true", help="Solo revisar URLs fijas, sin explorar sitios")
    p.add_argument("--only-seeds", action="store_true", help="Solo explorar semillas, sin URLs fijas")
    p.add_argument("--no-ai", action="store_true", help="Desactivar clasificacion IA (solo heuristica local)")
    p.add_argument("--max-pages", type=int, default=MAX_PAGES_PER_DOMAIN_PER_CYCLE, help=f"Max paginas por dominio/ciclo (default: {MAX_PAGES_PER_DOMAIN_PER_CYCLE})")
    p.add_argument("--cycle-delay", type=int, default=CYCLE_DELAY, help=f"Delay entre ciclos en segundos (default: {CYCLE_DELAY})")
    p.add_argument("--no-playwright", action="store_true", help="Desactivar Playwright, usar solo requests+BS4")
    p.add_argument("--headed", action="store_true", help="Playwright con navegador visible (debug)")
    p.add_argument("--playwright-always", action="store_true", help="Forzar Playwright siempre (diagnostico)")
    p.add_argument("--reprocess-existing", action="store_true", help="Reprocesar PDFs ya descargados si falta texto/metadata")
    p.add_argument("--index-low-quality", action="store_true", help="Indexar docs con quality_score < 0.4")
    p.add_argument("--include-complementary", action="store_true", help="Incluir URLs fijas complementarias al procesar")
    p.add_argument("--include-pending", action="store_true", help="Incluir URLs fijas pendientes (no verificadas)")
    p.add_argument("--include-tsc", action="store_true", help="Incluir fuentes TSC aunque puedan estar bloqueadas desde esta red")
    p.add_argument("--validate-sources", action="store_true", help="Validar fuentes core sin descargar ni indexar")
    a = p.parse_args()

    args_obj = Args()
    args_obj.once = a.once
    args_obj.reset = a.reset
    args_obj.dry_run = a.dry_run
    args_obj.only_fixed = a.only_fixed
    args_obj.only_seeds = a.only_seeds
    args_obj.no_ai = a.no_ai
    args_obj.no_playwright = a.no_playwright
    args_obj.headed = a.headed
    args_obj.playwright_always = a.playwright_always
    args_obj.reprocess_existing = a.reprocess_existing
    args_obj.index_low_quality = a.index_low_quality
    args_obj.include_complementary = a.include_complementary
    args_obj.include_pending = a.include_pending
    args_obj.include_tsc = a.include_tsc
    args_obj.validate_sources = a.validate_sources
    args_obj.max_pages = a.max_pages
    args_obj.cycle_delay = a.cycle_delay

    if a.reset:
        for f in [VISITED_FILE, STATE_FILE]:
            if f.exists():
                f.unlink()
                log(f"  {f.name} eliminado")

    if not a.once:
        main(args_obj)
    else:
        if not a.dry_run:
            load_db_url()
            load_deepseek_key()
        if a.dry_run:
            main(args_obj)
        else:
            log(f"{'='*55}")
            log(f"  CRAWLER AUTONOMO v3.0 — MODO ONCE")
            log(f"  DeepSeek: {'OK' if load_deepseek_key() else 'NO DISPONIBLE'} | Modelo: {DEEPSEEK_MODEL}")
            log(f"{'='*55}")
            run_cycle(args_obj)

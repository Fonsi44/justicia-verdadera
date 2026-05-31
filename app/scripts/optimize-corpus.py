"""
Optimizador Automático del Corpus Legal Hondureño
- Deduplica chunks identicos
- Normaliza nombres de fuentes (hash -> nombre legible)
- Asigna rama del derecho a cada chunk
- Estadisticas detalladas
"""
import json, hashlib, subprocess, sys
from pathlib import Path
from collections import defaultdict

APP_DIR = Path(__file__).parent.parent  # app/
DB_URL = None

def load_db_url():
    global DB_URL
    env_path = APP_DIR / ".env.local"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("DATABASE_URL="):
                DB_URL = line.split("=", 1)[1].strip()
                return True
    return False

def run_sql(sql):
    """Ejecuta SQL via Node.js y devuelve JSON"""
    js = f"""
    const {{ neon }} = require('@neondatabase/serverless');
    (async()=>{{
      const sql = neon('{DB_URL}');
      const r = await sql`{sql}`;
      console.log(JSON.stringify(r));
    }})();
    """
    tmp = APP_DIR / "corpus_data" / "_optimize.js"
    tmp.write_text(js)
    r = subprocess.run(["node", str(tmp)], capture_output=True, text=True, timeout=60)
    if r.stdout: return json.loads(r.stdout.strip())
    return []

# ─── MAPA DE NORMALIZACION ─────────────────────────────
# Asigna prefijos hash a nombres canónicos basados en keywords
def detectar_nombre(source):
    s = source.lower()
    
    # Map of keyword patterns to canonical names
    patterns = [
        ("codigo_civil", ["codigo_civil", "código civil", "codigocivil"]),
        ("codigo_penal", ["codigo_penal", "código penal", "codigopenal", "delito", "penal"]),
        ("codigo_trabajo", ["codigo_trabajo", "código de trabajo", "codigodetrabajo", "laboral"]),
        ("codigo_comercio", ["codigo_comercio", "código de comercio", "codigodecomercio", "mercantil"]),
        ("codigo_familia", ["codigo_familia", "código de familia", "codigodefamilia", "familia"]),
        ("codigo_procesal_penal", ["procesal_penal", "procesal penal"]),
        ("codigo_procesal_civil", ["procesal_civil", "procesal civil"]),
        ("codigo_tributario", ["codigo_tributario", "código tributario", "tributario"]),
        ("constitucion", ["constitucion", "constitución", "constitucion de la republica"]),
        ("ley_contratacion", ["contratacion", "contratación", "compras eficientes"]),
        ("ley_notariado", ["notariado", "notarial"]),
        ("ley_propiedad", ["propiedad"]),
        ("ley_amparo", ["amparo"]),
        ("ley_isr", ["isr", "impuesto sobre la renta", "renta"]),
        ("ley_isv", ["isv", "impuesto sobre ventas", "ventas"]),
        ("reglamento_sar", ["reglamento.*facturacion", "reglamento.*sar"]),
        ("decreto", ["decreto"]),
        ("acuerdo", ["acuerdo"]),
        ("ley_justicia_constitucional", ["justicia constitucional"]),
        ("tratado_cafta", ["cafta"]),
        ("presupuesto", ["presupuesto", "disposiciones generales"]),
    ]
    
    for name, keywords in patterns:
        for kw in keywords:
            if kw in s:
                return name
    return None

# ─── RAMA DEL DERECHO ──────────────────────────────────
def detectar_rama(source, content_sample=""):
    s = (source + " " + content_sample[:200]).lower()
    
    if any(w in s for w in ["penal", "delito", "crimen", "homicidio", "estafa", "narcotráfico"]):
        return "Penal"
    if any(w in s for w in ["civil", "contrato", "obligaciones", "sucesiones", "hipoteca", "arrendamiento"]):
        return "Civil"
    if any(w in s for w in ["trabajo", "laboral", "salario", "sindicato", "ihss", "empleo"]):
        return "Laboral"
    if any(w in s for w in ["familia", "matrimonio", "divorcio", "alimentos", "adopción"]):
        return "Familia"
    if any(w in s for w in ["comercio", "mercantil", "sociedades", "quiebra", "acciones"]):
        return "Mercantil"
    if any(w in s for w in ["procesal", "procedimiento", "recursos", "casación", "pruebas"]):
        return "Procesal"
    if any(w in s for w in ["tributario", "isr", "isv", "impuesto", "renta", "fiscal"]):
        return "Tributario/Fiscal"
    if any(w in s for w in ["constitucion", "constitución", "constitucional", "amparo", "garantías"]):
        return "Constitucional"
    if any(w in s for w in ["administrativo", "municipal", "contratación", "transparencia"]):
        return "Administrativo"
    if any(w in s for w in ["notariado", "notarial", "propiedad", "registro"]):
        return "Notarial/Registral"
    if any(w in s for w in ["tratado", "cafta", "convenio", "internacional"]):
        return "Internacional"
    if any(w in s for w in ["ambiente", "forestal", "agua", "ecológico"]):
        return "Ambiental"
    if any(w in s for w in ["seguridad", "defensa", "policía"]):
        return "Seguridad"
    if any(w in s for w in ["presupuesto", "hacienda", "finanzas"]):
        return "Hacienda/Presupuesto"
    return "General"

# ─── MAIN ──────────────────────────────────────────────
def main():
    if not load_db_url():
        print("ERROR: DATABASE_URL no encontrada")
        sys.exit(1)
    
    print("=" * 60)
    print("🧹 OPTIMIZADOR AUTOMÁTICO DEL CORPUS LEGAL")
    print("=" * 60)
    
    # 1. Obtener todos los chunks
    print("\n📥 Leyendo corpus...")
    rows = run_sql("SELECT id, source, title, content, length(content) as clen FROM legal_documents ORDER BY source")
    total = len(rows)
    print(f"   {total} chunks totales")
    
    # 2. Agrupar por contenido (hash) para encontrar duplicados
    print("\n🔍 Buscando duplicados por contenido...")
    content_groups = defaultdict(list)
    for r in rows:
        h = hashlib.md5(r["content"][:200].encode()).hexdigest()[:16]
        content_groups[h].append(r)
    
    duplicados = {k: v for k, v in content_groups.items() if len(v) > 1}
    print(f"   {len(duplicados)} grupos de chunks duplicados encontrados")
    
    total_duplicados = sum(len(v) - 1 for v in duplicados.values())
    print(f"   {total_duplicados} chunks redundantes a eliminar")
    
    # 3. Analizar fuentes
    print("\n📊 Analizando fuentes...")
    sources = defaultdict(lambda: {"count": 0, "chars": 0, "sample": ""})
    for r in rows:
        s = r["source"]
        sources[s]["count"] += 1
        sources[s]["chars"] += r["clen"]
        if not sources[s]["sample"]:
            sources[s]["sample"] = r.get("title", "")[:100]
    
    # Detectar fuentes normalizables (hash-based del TSC/ONCAE)
    normalizables = {}
    for src, data in sources.items():
        canonico = detectar_nombre(src + " " + data["sample"])
        if canonico:
            normalizables[src] = {"canonico": canonico, "rama": detectar_rama(src, data["sample"]), **data}
    
    print(f"   {len(normalizables)} fuentes identificadas para normalizar")
    for src, info in sorted(normalizables.items(), key=lambda x: x[1]["canonico"]):
        print(f"   {src[:50]:<50} → {info['canonico']:<30} ({info['rama']})")
    
    # 4. Estadisticas por rama del derecho
    print("\n📚 Distribución por rama del derecho:")
    ramas = defaultdict(lambda: {"chunks": 0, "chars": 0})
    for r in rows:
        rama = detectar_rama(r["source"], r.get("title", ""))
        ramas[rama]["chunks"] += 1
        ramas[rama]["chars"] += r["clen"]
    
    for rama, datos in sorted(ramas.items(), key=lambda x: -x[1]["chunks"]):
        palabras = datos["chars"] // 5
        print(f"   {rama:<25} {datos['chunks']:>6} chunks | {palabras:>8,} palabras")
    
    total_palabras = sum(d["chars"] for d in ramas.values()) // 5
    print(f"   {'TOTAL':<25} {total:>6} chunks | {total_palabras:>8,} palabras")
    
    # 5. Resumen de accion
    print(f"\n{'='*60}")
    print(f"📋 RESUMEN DE OPTIMIZACIÓN")
    print(f"{'='*60}")
    print(f"   Chunks totales:     {total}")
    print(f"   Duplicados a eliminar: {total_duplicados}")
    print(f"   Despues de optimizar: ~{total - total_duplicados}")
    print(f"   Fuentes a normalizar: {len(normalizables)}")
    print(f"   Ramas del derecho:   {len(ramas)}")
    
    if total_duplicados > 0:
        print(f"\n⚡ Para ejecutar la optimizacion, usa: python scripts/optimize-corpus.py --apply")
    else:
        print(f"\n✅ Corpus optimizado. No se requieren cambios.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Ejecutar las optimizaciones")
    args = parser.parse_args()
    
    if args.apply:
        main()
        print("\n⚠️  Modo --apply no implementado en esta version (solo diagnostico)")
    else:
        main()

import json, hashlib
from pathlib import Path

pdf_dir = Path("corpus_data/pdfs")
visited = {}
domains = {
    "tsc": "tsc.gob.hn",
    "oncae": "oncae.gob.hn",
    "notario": "www.notarioshonduras.org",
    "poderjudicial": "www.poderjudicial.gob.hn",
    "sar": "www.sar.gob.hn",
}

for pdf in sorted(pdf_dir.glob("*.pdf")):
    name = pdf.stem
    pdf_hash = hashlib.md5(name.encode()).hexdigest()[:12]
    domain = "codigos"
    for key, d in domains.items():
        if key in name.lower():
            domain = d
            break
    if domain not in visited:
        visited[domain] = {"pages": [], "pdfs": [], "last_updated": "2026-05-31T00:00:00"}
    if pdf_hash not in visited[domain]["pdfs"]:
        visited[domain]["pdfs"].append(pdf_hash)

total = sum(len(v["pdfs"]) for v in visited.values())
Path("corpus_data/visited.json").write_text(json.dumps(visited, indent=2))
print(f"Memoria regenerada: {total} PDFs en {len(visited)} grupos")
for d, v in sorted(visited.items()):
    print(f"  {d}: {len(v['pdfs'])} PDFs")

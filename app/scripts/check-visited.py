import json
v = json.load(open("corpus_data/visited.json"))
print("Dominios en memoria:", len(v))
for d, info in v.items():
    print(f"  {d}: {len(info.get('pages',[]))} paginas, {len(info.get('pdfs',[]))} PDFs")
    # Show last visited
    if "last_updated" in info:
        print(f"    Ultima visita: {info['last_updated']}")

"""Import papers from Daniel's Lattes XML export; publish only bibliographic fields."""

import hashlib, html, io, json, os, re, sys, unicodedata, urllib.request, zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "data/papers.json"
FIRST_YEAR = 2013  # Daniel joined UFF in 2013.


def env_file():
    try:
        for line in (ROOT / ".env.local").read_text().splitlines():
            key, sep, value = line.partition("=")
            if sep and key.strip() and not key.startswith("#"):
                os.environ.setdefault(key.strip(), value.strip())
    except FileNotFoundError:
        pass


def drive_zip(link):
    """Download a Drive file shared as "anyone with the link" (full link or file ID)."""
    match = re.search(r"/d/([\w-]+)|[?&]id=([\w-]+)", link)
    file_id = (match.group(1) or match.group(2)) if match else link.strip()
    url = f"https://drive.usercontent.google.com/download?id={file_id}&export=download&confirm=t"
    request = urllib.request.Request(
        url, headers={"User-Agent": "UFFeScience-website/1.0"}
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read()
    if not data.startswith(b"PK"):
        raise ValueError(
            "O Drive não devolveu um .zip; confira o link e o compartilhamento."
        )
    return data


def read_xml(data):
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names = [n for n in z.namelist() if n.lower().endswith(".xml")]
        if not names:
            raise ValueError("O .zip não contém nenhum .xml.")
        return ET.fromstring(z.read(names[0]))


def attr(el, *keys):
    for key in keys if el is not None else ():
        value = el.get(key)
        if value and value.strip():
            return value.strip()
    return ""


def text(value):
    # Lattes stores some characters double-escaped (e.g. "Gere&amp;#770;ncia").
    for _ in range(3):
        value = html.unescape(value)
    return unicodedata.normalize("NFC", re.sub(r"\s+", " ", value)).strip()


def https(value):
    value = value.strip("[] ")
    return (
        value if urlparse(value).scheme == "https" and urlparse(value).netloc else None
    )


def year(value):
    return int(value) if value.isdigit() else 0


def authors(el, lattes_id, full_name):
    result = []
    for a in sorted(
        el.findall("AUTORES"), key=lambda a: year(attr(a, "ORDEM-DE-AUTORIA"))
    ):
        name = text(attr(a, "NOME-PARA-CITACAO", "NOME-COMPLETO-DO-AUTOR"))
        me = a.get("NRO-ID-CNPQ") == lattes_id or (
            text(attr(a, "NOME-COMPLETO-DO-AUTOR")).casefold() == full_name.casefold()
        )
        if name:
            result.append({"name": name, "me": True} if me else {"name": name})
    return result


def journal_venue(d):
    parts = [attr(d, "TITULO-DO-PERIODICO-OU-REVISTA")]
    if attr(d, "VOLUME"):
        parts.append(f"v. {attr(d, 'VOLUME')}")
    return ", ".join(p for p in parts if p)


def event_venue(d):
    return attr(d, "NOME-DO-EVENTO", "TITULO-DOS-ANAIS-OU-PROCEEDINGS")


KINDS = [
    # (kind, element, basic, detail, title, year, venue)
    (
        "journal",
        "ARTIGO-PUBLICADO",
        "DADOS-BASICOS-DO-ARTIGO",
        "DETALHAMENTO-DO-ARTIGO",
        "TITULO-DO-ARTIGO",
        "ANO-DO-ARTIGO",
        journal_venue,
    ),
    (
        "accepted",
        "ARTIGO-ACEITO-PARA-PUBLICACAO",
        "DADOS-BASICOS-DO-ARTIGO",
        "DETALHAMENTO-DO-ARTIGO",
        "TITULO-DO-ARTIGO",
        "ANO-DO-ARTIGO",
        journal_venue,
    ),
    (
        "conference",
        "TRABALHO-EM-EVENTOS",
        "DADOS-BASICOS-DO-TRABALHO",
        "DETALHAMENTO-DO-TRABALHO",
        "TITULO-DO-TRABALHO",
        "ANO-DO-TRABALHO",
        event_venue,
    ),
]


def papers(root):
    lattes_id = root.get("NUMERO-IDENTIFICADOR", "")
    full_name = text(attr(root.find("DADOS-GERAIS"), "NOME-COMPLETO"))
    result, seen = [], set()
    for kind, tag, basic, detail, title_key, year_key, venue in KINDS:
        for el in root.iter(tag):
            b, d = el.find(basic), el.find(detail)
            # Abstracts and expanded abstracts are not papers.
            if kind == "conference" and attr(b, "NATUREZA") != "COMPLETO":
                continue
            title, published = text(attr(b, title_key)), year(attr(b, year_key))
            if not title or published < FIRST_YEAR:
                continue
            key = (re.sub(r"\W+", "", title.casefold()), published)
            if key in seen:
                continue
            seen.add(key)
            doi = attr(b, "DOI")
            result.append(
                {
                    "kind": kind,
                    "title": title,
                    "year": published,
                    "authors": authors(el, lattes_id, full_name),
                    "venue": text(venue(d)),
                    "url": https(f"https://doi.org/{doi}" if doi else "")
                    or https(attr(b, "HOME-PAGE-DO-TRABALHO")),
                }
            )
    result.sort(key=lambda p: (-p["year"], p["title"].casefold()))
    return result


def main():
    env_file()
    previous = {}
    try:
        previous = json.loads(TARGET.read_text())
    except (FileNotFoundError, ValueError):
        pass
    if os.environ.get("LATTES_ZIP"):
        data = Path(os.environ["LATTES_ZIP"]).read_bytes()
    elif os.environ.get("LATTES_DRIVE_URL"):
        data = drive_zip(os.environ["LATTES_DRIVE_URL"])
    else:
        sys.exit("LATTES_DRIVE_URL não configurado.")
    digest = hashlib.sha256(data).hexdigest()
    if "--force" not in sys.argv and previous.get("sourceSha256") == digest:
        print("XML do Lattes não mudou; papers preservados.")
        return
    root = read_xml(data)
    items = papers(root)
    if not items:
        raise ValueError("Nenhum paper encontrado; dados anteriores preservados.")
    updated = root.get("DATA-ATUALIZACAO", "")
    store = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "lattesUpdatedAt": (
            f"{updated[4:]}-{updated[2:4]}-{updated[:2]}" if len(updated) == 8 else None
        ),
        "sourceSha256": digest,
        "papers": items,
    }
    tmp = TARGET.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(store, ensure_ascii=False, indent=2))
    tmp.replace(TARGET)
    print(f"Papers armazenados: {len(items)} desde {FIRST_YEAR}.")


if __name__ == "__main__":
    main()

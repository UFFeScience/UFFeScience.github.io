"""Import public people cards; keep source links, never infer personal profiles."""

import json, re, hashlib, sys, urllib.request, urllib.parse
from html.parser import HTMLParser
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://danielcmo.github.io/"


class Node:
    def __init__(self, tag="", attrs=()):
        self.tag = tag
        self.attrs = dict(attrs)
        self.children = []

    def text(self):
        return "".join(c if isinstance(c, str) else c.text() for c in self.children)

    def walk(self):
        yield self
        for c in self.children:
            if isinstance(c, Node):
                yield from c.walk()


class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs)
        self.stack[-1].children.append(n)
        if tag not in {"img", "br", "hr", "meta", "link", "input", "source", "wbr"}:
            self.stack.append(n)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def fetch(url):
    with urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": "UFFeScience-website/1.0"}),
        timeout=25,
    ) as r:
        return r.read(), r.headers.get_content_type()


def link(value):
    if not value:
        return None
    if value.startswith("https://https://"):
        value = value[8:]
    url = urllib.parse.urljoin(BASE, value)
    return url if urllib.parse.urlparse(url).scheme in ("https", "http") else None


def clean(value):
    return re.sub(
        r"^(?:Profa?\.?|D\.Sc\.?|PhD|Dr\.?)\s+",
        "",
        re.sub(r"\s+", " ", value).strip(),
        flags=re.I,
    )


def parse_page(html, kind):
    p = Parser()
    p.feed(html)
    result = []
    current = True
    for n in p.root.walk():
        if n.tag == "h2" and kind == "students":
            current = "current" in n.text().lower()
        if ("card" if kind == "students" else "news-card") not in n.attrs.get(
            "class", ""
        ).split():
            continue
        image = next((c for c in n.walk() if c.tag == "img"), None)
        body = next(
            (c for c in n.children if isinstance(c, Node) and c.tag == "div"), None
        )
        if not body:
            continue
        anchors = [c for c in body.walk() if c.tag == "a"]
        if kind == "students":
            # First text before <br> contains the name; links below refer to theses, not profiles.
            name = ""
            for c in body.children:
                if isinstance(c, Node) and c.tag in ("br", "a"):
                    break
                name += c if isinstance(c, str) else c.text()
            name = clean(re.split(r"\s+-\s+", name)[0])
            name = re.sub(r"\s*\(\d{4}\)\s*$", "", name)
        else:
            name = clean(anchors[0].text() if anchors else body.text().split(" (")[0])
        if not name:
            continue
        urls = [
            {"label": a.text().strip(), "url": link(a.attrs.get("href"))}
            for a in anchors
            if link(a.attrs.get("href"))
        ]
        result.append(
            {
                "id": hashlib.sha256(name.casefold().encode()).hexdigest()[:16],
                "name": name,
                "imageUrl": link(image.attrs.get("src")) if image else None,
                "url": (
                    urls[0]["url"]
                    if urls
                    else BASE + ("li.html" if kind == "students" else "collab.html")
                ),
                "linkKind": (
                    ("work" if kind == "students" else "profile") if urls else "source"
                ),
                "links": urls,
                "current": current if kind == "students" else None,
            }
        )
    if not result:
        raise ValueError("Estrutura da página mudou; dados anteriores preservados.")
    unique = {}
    for person in result:
        if person["id"] not in unique:
            unique[person["id"]] = person
    return list(unique.values())


def main():
    target = ROOT / "data/people.json"
    previous = {}
    try:
        previous = json.loads(target.read_text())
    except (FileNotFoundError, ValueError):
        pass
    if (
        "--force" not in sys.argv
        and previous.get("fetchedAt")
        and (
            datetime.now(timezone.utc) - datetime.fromisoformat(previous["fetchedAt"])
        ).total_seconds()
        < 6.5 * 86400
    ):
        print("Pessoas já atualizadas nesta semana.")
        return
    students = parse_page(fetch(BASE + "li.html")[0].decode("utf8"), "students")
    collaborators = parse_page(
        fetch(BASE + "collab.html")[0].decode("utf8"), "collaborators"
    )
    daniel = {
        "id": "daniel",
        "name": "Daniel de Oliveira",
        "url": BASE,
        "imageUrl": BASE + "arquivos/Daniel.jpeg",
    }
    media = ROOT / "data/media"
    media.mkdir(parents=True, exist_ok=True)
    old = {
        p["id"]: p
        for p in [
            previous.get("daniel", {}),
            *previous.get("students", []),
            *previous.get("collaborators", []),
        ]
        if p.get("id")
    }

    def archive(person):
        prior = old.get(person["id"], {})
        person["image"] = prior.get("image")
        if not person.get("imageUrl"):
            return
        if (
            person["image"]
            and prior.get("imageUrl") == person["imageUrl"]
            and (ROOT / "data" / person["image"].removeprefix("/")).exists()
        ):
            return
        try:
            if (
                urllib.parse.urlparse(person["imageUrl"]).hostname
                != "danielcmo.github.io"
            ):
                return
            data, mime = fetch(person["imageUrl"])
            ext = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp",
                "image/gif": "gif",
            }.get(mime)
            if not ext or len(data) > 8 * 1024 * 1024:
                return
            name = hashlib.sha256(data).hexdigest()[:28] + "." + ext
            (media / name).write_bytes(data)
            person["image"] = "/media/" + name
        except Exception:
            pass

    with ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(archive, [daniel, *students, *collaborators]))
    store = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "daniel": daniel,
        "students": students,
        "collaborators": collaborators,
        "sources": [BASE + "li.html", BASE + "collab.html"],
    }
    tmp = target.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(store, ensure_ascii=False, indent=2))
    tmp.replace(target)
    print(
        f"Pessoas armazenadas: {len(students)} estudantes, {len(collaborators)} colaboradores."
    )


if __name__ == "__main__":
    main()

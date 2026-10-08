import json,urllib.request,urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
TOKEN=next(line.split('=',1)[1].strip() for line in (ROOT/'.env.local').read_text().splitlines() if line.startswith('APIFY_TOKEN='))
def request(path,body=None,method=None):
    data=json.dumps(body).encode() if body is not None else None
    req=urllib.request.Request('https://api.apify.com/v2/'+path,data=data,method=method,headers={'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=35) as response:return json.load(response)
    except urllib.error.HTTPError as error:
        payload=json.loads(error.read().decode())
        raise RuntimeError(f'Apify HTTP {error.code}: {payload.get("error",{}).get("message","request failed")}') from None

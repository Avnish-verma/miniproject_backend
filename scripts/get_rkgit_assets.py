import urllib.request
import re
import os

os.makedirs('report_assets', exist_ok=True)

urls_to_try = [
    'https://rkgit.edu.in/images/logo.png',
    'https://rkgit.edu.in/images/rkgit-logo.png',
    'https://rkgit.edu.in/assets/images/logo.png',
    'https://upload.wikimedia.org/wikipedia/en/e/ee/Raj_Kumar_Goel_Institute_of_Technology_logo.png',
    'https://aktu.ac.in/images/logo.png',
    'https://upload.wikimedia.org/wikipedia/en/5/53/Dr._A.P.J._Abdul_Kalam_Technical_University_logo.png'
]

headers = {'User-Agent': 'Mozilla/5.0'}

for url in urls_to_try:
    try:
        filename = os.path.basename(url)
        filepath = os.path.join('report_assets', filename)
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            if len(data) > 1000:
                with open(filepath, 'wb') as f:
                    f.write(data)
                print(f"Downloaded {filename} ({len(data)} bytes)")
    except Exception as e:
        print(f"Failed {url}: {e}")

try:
    req = urllib.request.Request('https://rkgit.edu.in/', headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        matches = re.findall(r'src=["\']([^"\']*(?:logo|rkgit|aktu)[^"\']*\.(?:png|jpg|jpeg|svg))["\']', html, re.I)
        print("Matches from rkgit homepage:", set(matches))
        for m in set(matches):
            if not m.startswith('http'):
                full_url = 'https://rkgit.edu.in/' + m.lstrip('/')
            else:
                full_url = m
            fn = os.path.basename(m.split('?')[0])
            fp = os.path.join('report_assets', fn)
            try:
                r2 = urllib.request.Request(full_url, headers=headers)
                with urllib.request.urlopen(r2, timeout=10) as res2:
                    d2 = res2.read()
                    if len(d2) > 1000:
                        with open(fp, 'wb') as f:
                            f.write(d2)
                        print(f"Downloaded from homepage: {fn} ({len(d2)} bytes)")
            except Exception as ex:
                pass
except Exception as e:
    print(f"Failed scraping homepage: {e}")

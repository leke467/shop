"""
Check DNS records for multishopng.com and www.multishopng.com via Google DNS API.
"""
import requests

for domain in ["multishopng.com", "www.multishopng.com"]:
    url = f"https://dns.google/resolve?name={domain}&type=A"
    r = requests.get(url, timeout=10).json()
    print(f"=== DNS A Record for {domain} ===")
    if "Answer" in r:
        for ans in r["Answer"]:
            print(" ->", ans.get("data"))
    else:
        print(" -> No A record found:", r.get("Status"))

    url_cname = f"https://dns.google/resolve?name={domain}&type=CNAME"
    r_cname = requests.get(url_cname, timeout=10).json()
    print(f"=== DNS CNAME Record for {domain} ===")
    if "Answer" in r_cname:
        for ans in r_cname["Answer"]:
            print(" ->", ans.get("data"))
    else:
        print(" -> No CNAME record found")

import os, urllib.request, json
req = urllib.request.Request(
    'https://api.groq.com/openai/v1/models',
    headers={
        'Authorization': 'Bearer ' + os.environ.get("GROQ_API_KEY", ""),
        'User-Agent': 'Mozilla/5.0'
    }
)
try:
    with urllib.request.urlopen(req) as res:
        print(res.read())
except Exception as e:
    print(e)

import os, urllib.request, json
req = urllib.request.Request(
    'https://api.groq.com/openai/v1/chat/completions',
    data=b'{"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": "hola"}]}',
    headers={
        'Authorization': 'Bearer ' + os.environ.get("GROQ_API_KEY", ""),
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
    },
    method='POST'
)
try:
    with urllib.request.urlopen(req) as res:
        print(res.read())
except Exception as e:
    print(e)

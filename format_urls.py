import sys
import json

def to_json(link):
    return { "seedUrl": link , "instantStreetViewUrl": "" , "googleMapsUrl": ""}

links = [link.rstrip("\n") for link in open(sys.argv[1]).readlines()]
links_json = [to_json(link) for link in links]

final_json = {}

for i, link in enumerate(links_json):
    final_json[str(i)] = link

open(sys.argv[2], "w").write(json.dumps(final_json))


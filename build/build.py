# Assemble index.html from src/app.html + the two esbuild bundles.
# npm i cubing@0.63.8 cubejs@1.3.2 @moishy/cfop@0.4.0 esbuild
# npx esbuild build/entry.js --bundle --format=iife --minify --outfile=build/main.js
# npx esbuild build/worker.js --bundle --format=iife --minify --outfile=build/cfop-worker.js
import sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
main, worker = (pathlib.Path(p).read_text() for p in sys.argv[1:3])
app = (root / "src/app.html").read_text().replace("/*WORKER*/", worker).replace("/*BUNDLE*/", main)
head = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#0f1218">\n'
body = app.replace('<header class="bar">', '</head><body>\n<header class="bar">', 1)
(root / "index.html").write_text(head + body + "\n</body></html>\n")
(root / "build/artifact.html").write_text(app)

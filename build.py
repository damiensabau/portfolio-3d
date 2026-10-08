import glob, os
base = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(base, 'src')
head = open(os.path.join(src, '00_head.html')).read()
parts = sorted(f for f in glob.glob(os.path.join(src, '*.js')))
js = '\n'.join(open(f).read() for f in parts)
out = head + '<script type="module">\n' + js + '\n</script>\n'
open(os.path.join(base, 'index.html'), 'w').write(out)
open(os.path.join(base, 'app.mjs'), 'w').write(js)
print('built', len(out), 'bytes from', [os.path.basename(p) for p in parts])

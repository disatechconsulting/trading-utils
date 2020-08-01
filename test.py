import hashlib
import uuid

password = ('wl_app-a&b@!423^' + 'Bellise!101002').encode('utf-8')
md5_hash = hashlib.md5(password)

print md5_hash.hexdigest()
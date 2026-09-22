#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera a versão MÓVEL criptografada do ERP Home Capital.

Cifra o ERP (index.html da raiz) com AES-256-GCM (chave derivada por PBKDF2-
SHA256, 310k iterações) e embrulha numa tela de bloqueio com senha. O conteúdo
só é decifrado no navegador do usuário, com o código correto — o arquivo
publicado é apenas ciphertext, ilegível sem a senha.

Uso:
  python3 scripts/build_mobile.py --codigo SEU_CODIGO
"""
import argparse, base64, hashlib, json, os, re, shutil, sys
from Crypto.Cipher import AES  # pycryptodome

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(ROOT, 'scripts')
MOBILE = os.path.join(ROOT, 'mobile')
ITER = 310000  # deve casar com o WebCrypto no template


def _key(code: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac('sha256', code.encode(), salt, ITER, dklen=32)


def enc(data: bytes, code: str) -> dict:
    salt, iv = os.urandom(16), os.urandom(12)
    cipher = AES.new(_key(code, salt), AES.MODE_GCM, nonce=iv)
    ct, tag = cipher.encrypt_and_digest(data)
    # WebCrypto (SubtleCrypto) espera ciphertext || tag (tag de 16 bytes ao final)
    return {'s': base64.b64encode(salt).decode(),
            'i': base64.b64encode(iv).decode(),
            'c': base64.b64encode(ct + tag).decode()}


def dec_check(vault: dict, code: str):
    salt = base64.b64decode(vault['s'])
    iv = base64.b64decode(vault['i'])
    blob = base64.b64decode(vault['c'])
    ct, tag = blob[:-16], blob[-16:]
    cipher = AES.new(_key(code, salt), AES.MODE_GCM, nonce=iv)
    plain = cipher.decrypt_and_verify(ct, tag)
    assert plain.startswith(b'<!DOCTYPE'), 'conteudo decifrado invalido'
    return plain


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--codigo', required=True, help='Codigo de acesso (senha)')
    a = ap.parse_args()

    if len(a.codigo) < 4:
        print('AVISO: codigo curto (< 4). Recomendado 6+ digitos ou uma frase.')

    erp = open(os.path.join(ROOT, 'index.html'), 'rb').read()
    assert erp.startswith(b'<!DOCTYPE'), 'index.html da raiz nao parece um HTML valido'

    vault = enc(erp, a.codigo)

    logo_b64 = base64.b64encode(
        open(os.path.join(ROOT, 'assets', 'logo_homecapital.png'), 'rb').read()).decode()
    tpl = open(os.path.join(SCRIPTS, 'lock_erp_template.html')).read()
    tpl = tpl.replace('__HCM__', logo_b64)
    tpl = tpl.replace('__PAYLOAD__', json.dumps(vault))

    os.makedirs(MOBILE, exist_ok=True)
    out = os.path.join(MOBILE, 'index.html')
    open(out, 'w').write(tpl)

    # Copia os arquivos NAO sensiveis para a pasta a publicar
    shutil.copy(os.path.join(ROOT, 'manifest.webmanifest'), MOBILE)
    shutil.copy(os.path.join(ROOT, 'sw.js'), MOBILE)
    dst_assets = os.path.join(MOBILE, 'assets')
    os.makedirs(dst_assets, exist_ok=True)
    for f in ('logo_homecapital.png', 'icon-192.png', 'icon-512.png',
              'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-64.png'):
        shutil.copy(os.path.join(ROOT, 'assets', f), dst_assets)

    # ===== validacao obrigatoria =====
    html = open(out).read()
    assert '__' not in html.replace('__proto__', ''), 'placeholder nao substituido'
    m = re.search(r'<script id="vault" type="application/json">(.*?)</script>', html, re.S)
    v = json.loads(m.group(1))
    plain = dec_check(v, a.codigo)
    # confere que o conteudo decifrado e exatamente o ERP original
    assert plain == erp, 'conteudo decifrado difere do ERP original'
    # senha errada deve falhar
    try:
        dec_check(v, a.codigo + 'x')
        raise SystemExit('ERRO: senha errada nao falhou — criptografia invalida')
    except Exception:
        pass

    kb = len(html) // 1024
    print(f'OK — ERP movel gerado e validado: mobile/index.html ({kb} KB)')
    print(f'Codigo de acesso: {a.codigo}')
    print('Publique a PASTA mobile/ inteira (index.html + manifest + sw.js + assets/).')


if __name__ == '__main__':
    sys.exit(main())

#!/usr/bin/env bash
set -euo pipefail

# Supabase resolves certificate paths relative to its config directory.
tls_dir=.temp/integration-tls
mkdir -p "supabase/$tls_dir"
openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
  -subj '/CN=localhost' -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1' \
  -keyout "supabase/$tls_dir/gateway.key" -out "supabase/$tls_dir/gateway.crt"

{
  echo "SUPABASE_API_TLS_ENABLED=true"
  echo "SUPABASE_API_TLS_CERT_PATH=$tls_dir/gateway.crt"
  echo "SUPABASE_API_TLS_KEY_PATH=$tls_dir/gateway.key"
  echo "NODE_EXTRA_CA_CERTS=$PWD/supabase/$tls_dir/gateway.crt"
} >> "$GITHUB_ENV"

#! /bin/sh

gcloud functions deploy TypescriptFunction \
  --runtime nodejs16 \
  --trigger-http

#! /bin/sh
gcloud functions deploy GitlabWebhookAdoFunction \
  --runtime nodejs18 \
  --trigger-http

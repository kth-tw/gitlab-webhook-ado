#! /bin/sh
gcloud --project das-bc-lab functions deploy GitlabWebhookAdoFunction \
  --runtime nodejs18 \
  --trigger-http

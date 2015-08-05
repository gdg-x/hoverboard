# Deploy to Google Cloud Storage
#gsutil -m rm gs://$1/**
gsutil -m -h "Cache-Control:public,max-age=3600" cp -r -a public-read -z css,html,js,json,svg,txt dist/* gs://$1

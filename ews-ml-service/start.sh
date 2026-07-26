#!/bin/bash

cd /home/disdik/apps/EWS-ATS/ews-ml-service
source venv/bin/activate
exec uvicorn app:app --host 0.0.0.0 --port 8000

release: npm --prefix frontend install && npm --prefix frontend run build
web: uvicorn main:app --host=0.0.0.0 --port=${PORT:-5000}

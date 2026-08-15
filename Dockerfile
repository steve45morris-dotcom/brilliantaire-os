FROM python:3.12-slim

WORKDIR /app
COPY . /app

EXPOSE 8791

CMD ["python", "scripts/serve.py"]

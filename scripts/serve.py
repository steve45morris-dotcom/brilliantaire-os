from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HOST = "127.0.0.1"
PORT = 8791


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


def main():
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Brilliantaire OS running at http://{HOST}:{PORT}/dashboard/")
    print(f"Landing page running at http://{HOST}:{PORT}/landing/")
    server.serve_forever()


if __name__ == "__main__":
    main()

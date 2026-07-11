#!/usr/bin/env python3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from sys import argv


class NotFoundHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = Path(self.translate_path(self.path))
        status = 200

        if path.is_dir():
            path = path / "index.html"

        if not path.is_file():
            path = Path(self.directory) / "404.html"
            status = 404

        if not path.is_file():
            self.send_error(404, "File not found")
            return None

        content_type = self.guess_type(str(path))
        try:
            file = path.open("rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        file_size = path.stat().st_size
        self.send_response(status)
        self.send_header("Content-type", content_type)
        self.send_header("Content-Length", str(file_size))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        return file


def main():
    dist = Path(argv[1] if len(argv) > 1 else "dist").resolve()
    port = int(argv[2] if len(argv) > 2 else "4326")
    host = argv[3] if len(argv) > 3 else "127.0.0.1"

    handler = lambda *args, **kwargs: NotFoundHandler(*args, directory=str(dist), **kwargs)
    with ThreadingHTTPServer((host, port), handler) as server:
        print(f"Serving {dist} at http://{host}:{port}/")
        server.serve_forever()


if __name__ == "__main__":
    main()

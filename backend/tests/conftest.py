import os
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

# Asegurar imports del backend antes de cargar la app
BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))
os.chdir(BACKEND_ROOT)

# Evitar mock automático al importar main; usamos DB temporal por test
os.environ["SAVIOR_MOCK"] = "false"
os.environ["SAVIOR_AUTOCREATE_DB"] = "true"
os.environ["SAVIOR_ENTITY_DIR"] = "app/repositories/entity/"
os.environ["SAVIOR_CORS_ORIGINS"] = "http://localhost:5173"


@pytest.fixture()
def db_name(tmp_path, monkeypatch):
    name = str(tmp_path / "test_savior")
    monkeypatch.setenv("SAVIOR_DATABASE_NAME", name)
    import app.utils.sqlite.sqlite_util as sql

    sql.reset(name)
    yield name
    sql.reset()


@pytest.fixture()
def client(db_name):
    """FastAPI TestClient con DB limpia por test."""
    import main
    from fastapi.testclient import TestClient
    import app.utils.sqlite.sqlite_util as sql

    sql.reset(db_name)

    with TestClient(main.app) as c:
        yield c


@pytest.fixture()
def mock_http(monkeypatch):
    """Mockea requests según URL (status en el path)."""

    def _response(url, status=200, payload=None):
        return SimpleNamespace(
            status_code=status,
            text=f"status {status}",
            url=url,
            json=lambda: payload if payload is not None else {"ok": status < 400},
        )

    def fake_request(method, url, **kwargs):
        url_str = str(url)
        if "/status/503" in url_str:
            return _response(url_str, 503)
        if "/status/500" in url_str:
            return _response(url_str, 500)
        if "/status/200" in url_str or "example.com" in url_str:
            return _response(url_str, 200)
        return _response(url_str, 200)

    import requests as req

    monkeypatch.setattr(req, "get", lambda url, **kw: fake_request("get", url, **kw))
    monkeypatch.setattr(req, "post", lambda url, **kw: fake_request("post", url, **kw))
    monkeypatch.setattr(req, "put", lambda url, **kw: fake_request("put", url, **kw))
    monkeypatch.setattr(req, "patch", lambda url, **kw: fake_request("patch", url, **kw))
    monkeypatch.setattr(req, "delete", lambda url, **kw: fake_request("delete", url, **kw))
    return fake_request


@pytest.fixture()
def sample_yaml(tmp_path):
    """YAML de ejemplo estilo data_hard.yml para tests aislados."""
    content = """
services:
  - name: "pruebita"
    sources:
      - type: http_request
        variable: $response
        input:
          method: get
          url: https://httpbin.org/status/503
      - type: http_request
        name: input_alive
        variable: $response_alive
        input:
          method: get
          url: https://httpbin.org/status/200
    rules:
      - name: alive_status
        source:
          variables:
            - $response
        expression: "$response.status_code != 200"
        actions:
          - name: suggest-something
            type: suggest
            result: "El endpoint principal respondió mal"
          - name: check-alive
            type: http_action
            input:
              url: https://httpbin.org/status/200
              method: get
            result: "f'Alive check: {$response.status_code}'"
      - name: alive_status_posta
        source:
          names:
            - input_alive
          renames:
            response_alive: response
        expression: "$response.status_code != 200"
        actions:
          - name: suggest-something
            type: suggest
            result: "Ahhh el servicio no esta vivoo!"
"""
    path = tmp_path / "sample.yml"
    path.write_text(content, encoding="utf-8")
    return str(path)

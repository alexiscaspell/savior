from app.services import savior


def _seed(client, sample_yaml):
    savior.mock(sample_yaml)
    services = client.get("/api/v1/services").json()
    return services[0]["id"]


def test_pray_accepts_null_source(client, sample_yaml, mock_http):
    """Regresión: source=null no debe devolver 422."""
    service_id = _seed(client, sample_yaml)

    response = client.post(
        "/api/v1/savior/pray",
        json={"service_id": service_id, "source": None, "fast": False, "params": {}},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["service"] == "pruebita"
    assert isinstance(body["rules"], list)


def test_pray_happy_path_matches_failing_source(client, sample_yaml, mock_http):
    """Source 503 → expression status != 200 → consequences."""
    service_id = _seed(client, sample_yaml)

    response = client.post(
        "/api/v1/savior/pray",
        json={"service_id": service_id, "fast": False, "params": {}},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    matched = {r["name"] for r in body["rules"]}
    assert "alive_status" in matched

    alive = next(r for r in body["rules"] if r["name"] == "alive_status")
    actions = {c["action"] for c in alive["consequences"]}
    assert "suggest-something" in actions
    assert "check-alive" in actions


def test_pray_fast_stops_at_first_match(client, sample_yaml, mock_http):
    service_id = _seed(client, sample_yaml)

    response = client.post(
        "/api/v1/savior/pray",
        json={"service_id": service_id, "fast": True, "params": {}},
    )

    assert response.status_code == 200
    assert len(response.json()["rules"]) == 1


def test_pray_without_service_is_invalid(client):
    response = client.post("/api/v1/savior/pray", json={"params": {}})
    assert response.status_code == 409
    assert "Plegaria invalida" in response.json()["mensaje"]


def test_pray_unknown_service(client):
    response = client.post(
        "/api/v1/savior/pray",
        json={"service_id": 99999, "params": {}},
    )
    assert response.status_code == 409
    assert "Service no existente" in response.json()["mensaje"]


def test_pray_by_service_name(client, sample_yaml, mock_http):
    _seed(client, sample_yaml)

    response = client.post(
        "/api/v1/savior/pray",
        json={"service_name": "pruebita", "params": {}},
    )

    assert response.status_code == 200
    assert response.json()["service"] == "pruebita"

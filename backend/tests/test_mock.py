from app.services import savior


def test_mock_loads_sample_yaml(client, sample_yaml):
    result = savior.mock(sample_yaml)
    assert result["skipped"] is False
    assert result["loaded"] == 1

    response = client.get("/api/v1/services")
    assert response.status_code == 200
    services = response.json()
    assert len(services) == 1
    assert services[0]["name"] == "pruebita"
    assert len(services[0]["sources"]) == 2
    assert len(services[0]["rules"]) == 2


def test_mock_skips_when_db_has_data(client, sample_yaml):
    first = savior.mock(sample_yaml)
    second = savior.mock(sample_yaml)

    assert first["loaded"] == 1
    assert second["skipped"] is True
    assert second["loaded"] == 0

    services = client.get("/api/v1/services").json()
    assert len(services) == 1


def test_mock_force_reloads(client, sample_yaml):
    savior.mock(sample_yaml)
    forced = savior.mock(sample_yaml, force=True)

    assert forced["skipped"] is False
    assert forced["loaded"] == 1
    # force agrega otra vez (no limpia DB)
    assert len(client.get("/api/v1/services").json()) == 2


def test_mock_endpoint_with_repo_yaml(client):
    """Usa files/data_hard.yml del repo (mismo seed que docker)."""
    response = client.get("/mock")
    assert response.status_code == 200
    body = response.json()
    assert body["loaded"] >= 3
    assert body.get("labels_loaded", 0) >= 1

    services = {s["name"]: s for s in client.get("/api/v1/services").json()}
    assert "pruebita" in services
    assert "healthcheck_template" in services
    assert "api_consumidor" in services
    assert "health_not_ok" in {r["name"] for r in services["api_consumidor"]["rules"]}

    labels = client.get("/api/v1/labels").json()
    assert any(l["label"] == "http-health" for l in labels)

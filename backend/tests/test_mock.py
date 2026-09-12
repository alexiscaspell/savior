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
    assert body["loaded"] >= 1

    services = client.get("/api/v1/services").json()
    assert any(s["name"] == "pruebita" for s in services)

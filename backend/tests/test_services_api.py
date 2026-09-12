def test_list_services_empty(client):
    response = client.get("/api/v1/services")
    assert response.status_code == 200
    assert response.json() == []


def test_create_and_get_service(client):
    created = client.post(
        "/api/v1/services",
        json={"name": "svc-test", "vars": {"env": "test"}, "labels": [], "sources": [], "rules": []},
    )
    assert created.status_code == 200
    service_id = created.json()
    assert isinstance(service_id, int)

    fetched = client.get(f"/api/v1/services/{service_id}")
    assert fetched.status_code == 200
    body = fetched.json()
    assert body["name"] == "svc-test"
    assert body["vars"]["env"] == "test"


def test_update_service(client):
    service_id = client.post(
        "/api/v1/services",
        json={"name": "before", "vars": {}, "labels": [], "sources": [], "rules": []},
    ).json()

    updated = client.put(
        f"/api/v1/services/{service_id}",
        json={"name": "after", "vars": {"x": 1}, "labels": ["a"], "sources": [], "rules": []},
    )
    assert updated.status_code == 200

    body = client.get(f"/api/v1/services/{service_id}").json()
    assert body["name"] == "after"
    assert body["vars"]["x"] == 1
    assert body["labels"] == ["a"]


def test_delete_service(client):
    service_id = client.post(
        "/api/v1/services",
        json={"name": "to-delete", "vars": {}, "labels": [], "sources": [], "rules": []},
    ).json()

    deleted = client.delete(f"/api/v1/services/{service_id}")
    assert deleted.status_code == 200

    missing = client.get(f"/api/v1/services/{service_id}")
    assert missing.status_code == 409


def test_source_crud_and_link(client):
    source_id = client.post(
        "/api/v1/sources",
        json={
            "name": "src1",
            "type": "http_request",
            "variable": "$response",
            "input": {"method": "get", "url": "https://example.com"},
        },
    ).json()

    service_id = client.post(
        "/api/v1/services",
        json={"name": "with-src", "vars": {}, "labels": [], "sources": [], "rules": []},
    ).json()

    linked = client.post(f"/api/v1/services/{service_id}/sources/{source_id}")
    assert linked.status_code == 200

    service = client.get(f"/api/v1/services/{service_id}").json()
    assert len(service["sources"]) == 1
    assert service["sources"][0]["id"] == source_id

    unlinked = client.delete(f"/api/v1/services/{service_id}/sources/{source_id}")
    assert unlinked.status_code == 200
    assert client.get(f"/api/v1/services/{service_id}").json()["sources"] == []


def test_ping(client):
    assert client.get("/ping").json() == "pong"

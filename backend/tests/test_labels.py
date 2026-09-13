from app.services import savior


def test_mock_loads_labels_from_yaml(client, labels_yaml):
    result = savior.mock(labels_yaml)

    assert result["loaded"] == 2
    assert result["labels_loaded"] == 1

    labels = client.get("/api/v1/labels").json()
    assert len(labels) == 1
    assert labels[0]["label"] == "http-health"
    assert labels[0]["service"]["id"] is not None


def test_consumer_inherits_template_vars_and_rules(client, labels_yaml):
    savior.mock(labels_yaml)

    services = {s["name"]: s for s in client.get("/api/v1/services").json()}
    consumer = services["api_consumidor"]

    assert consumer["labels"] == ["http-health"]
    # vars de plantilla + propias
    assert consumer["vars"]["team"] == "platform"
    assert consumer["vars"]["alert_channel"] == "#ops"
    assert consumer["vars"]["env"] == "staging"
    # rule heredada
    rule_names = {r["name"] for r in consumer["rules"]}
    assert "health_not_ok" in rule_names


def test_create_label_via_api_and_apply(client):
    template_id = client.post(
        "/api/v1/services",
        json={
            "name": "tpl",
            "vars": {"from_template": True},
            "labels": [],
            "sources": [],
            "rules": [
                {
                    "name": "always_true",
                    "expression": "True",
                    "source": {"variables": [], "names": [], "renames": {}},
                    "actions": [
                        {
                            "name": "say-hi",
                            "type": "suggest",
                            "result": "hola desde template",
                            "input": {},
                        }
                    ],
                    "preconditions": [],
                }
            ],
        },
    ).json()

    created = client.post(
        "/api/v1/labels",
        json={"label": "shared-rules", "service": {"id": template_id, "name": "tpl"}},
    )
    assert created.status_code == 200
    assert created.json()["label"] == "shared-rules"

    consumer_id = client.post(
        "/api/v1/services",
        json={
            "name": "child",
            "vars": {"local": 1},
            "labels": ["shared-rules"],
            "sources": [],
            "rules": [],
        },
    ).json()

    child = client.get(f"/api/v1/services/{consumer_id}").json()
    assert child["vars"]["from_template"] is True
    assert child["vars"]["local"] == 1
    assert any(r["name"] == "always_true" for r in child["rules"])


def test_delete_label_association(client, labels_yaml):
    savior.mock(labels_yaml)
    labels = client.get("/api/v1/labels").json()
    assert labels[0]["label"] == "http-health"

    deleted = client.delete("/api/v1/labels", params={"label": "http-health"})
    assert deleted.status_code == 200
    assert client.get("/api/v1/labels").json() == []

    # sin asociación, el consumidor ya no hereda por label name (no hay service llamado http-health)
    consumer = next(s for s in client.get("/api/v1/services").json() if s["name"] == "api_consumidor")
    assert consumer["rules"] == []
    assert "team" not in consumer["vars"]


def test_tag_only_label_without_template(client):
    created = client.post("/api/v1/labels", json={"label": "node"})
    assert created.status_code == 200
    assert created.json()["label"] == "node"
    assert created.json()["service_id"] is None

    labels = client.get("/api/v1/labels").json()
    assert any(l["label"] == "node" and (l.get("service") is None or l.get("service", {}).get("id") is None) for l in labels)

    consumer_id = client.post(
        "/api/v1/services",
        json={
            "name": "node-dell",
            "vars": {"name": "dell"},
            "labels": ["node"],
            "sources": [],
            "rules": [],
        },
    ).json()

    child = client.get(f"/api/v1/services/{consumer_id}").json()
    assert child["labels"] == ["node"]
    assert child["rules"] == []
    assert child["vars"] == {"name": "dell"}

    # pray must not 409 just because of the tag
    pray = client.post("/api/v1/savior/pray", json={"service_name": "node-dell", "params": {}})
    # no rules → FailedPrayException 409 historically; with zero rules, check behavior
    # savior raises FailedPrayException only if rule_failed_counter==len(rules) and len(rules)>0
    assert pray.status_code == 200
    assert pray.json()["rules"] == []


def test_pray_uses_inherited_rule(client, labels_yaml, mock_http):
    savior.mock(labels_yaml)
    consumer = next(s for s in client.get("/api/v1/services").json() if s["name"] == "api_consumidor")

    response = client.post(
        "/api/v1/savior/pray",
        json={"service_id": consumer["id"], "params": {}},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["service"] == "api_consumidor"
    assert any(r["name"] == "health_not_ok" for r in body["rules"])
    consequences = body["rules"][0]["consequences"]
    assert consequences[0]["action"] == "suggest-health"

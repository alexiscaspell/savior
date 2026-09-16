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


def test_update_label_template(client):
    tpl_a = client.post(
        "/api/v1/services",
        json={"name": "tpl-a", "vars": {"__template": True, "wh": "a"}, "labels": [], "sources": [], "rules": []},
    ).json()
    tpl_b = client.post(
        "/api/v1/services",
        json={"name": "tpl-b", "vars": {"__template": True, "wh": "b"}, "labels": [], "sources": [], "rules": []},
    ).json()

    created = client.post("/api/v1/labels", json={"label": "switchable", "service": {"id": tpl_a}})
    assert created.status_code == 200
    assert created.json()["service_id"] == tpl_a

    updated = client.put("/api/v1/labels", json={"label": "switchable", "service": {"id": tpl_b}})
    assert updated.status_code == 200
    assert updated.json()["service_id"] == tpl_b

    labels = client.get("/api/v1/labels").json()
    row = next(l for l in labels if l["label"] == "switchable")
    assert row["service"]["id"] == tpl_b

    cleared = client.put("/api/v1/labels", json={"label": "switchable", "service": None})
    assert cleared.status_code == 200
    assert cleared.json()["service_id"] is None


def test_upsert_label_keeps_row_on_rebind(client):
    """Re-binding a template must update service_id without deleting the catalog row."""
    tpl = client.post(
        "/api/v1/services",
        json={"name": "node-tpl", "vars": {"__template": True}, "labels": [], "sources": [], "rules": []},
    ).json()
    other = client.post(
        "/api/v1/services",
        json={"name": "other-tpl", "vars": {"__template": True}, "labels": [], "sources": [], "rules": []},
    ).json()

    assert client.post("/api/v1/labels", json={"label": "node", "service": None}).status_code == 200
    assert any(l["label"] == "node" for l in client.get("/api/v1/labels").json())

    # POST upsert (same path the create form uses for an existing name)
    rebound = client.post("/api/v1/labels", json={"label": "node", "service": {"id": tpl}})
    assert rebound.status_code == 200
    assert rebound.json()["service_id"] == tpl
    assert any(l["label"] == "node" and l["service"]["id"] == tpl for l in client.get("/api/v1/labels").json())

    # PUT rebind to another template
    rebound2 = client.put("/api/v1/labels", json={"label": "node", "service": {"id": other}})
    assert rebound2.status_code == 200
    assert rebound2.json()["service_id"] == other
    labels = client.get("/api/v1/labels").json()
    assert sum(1 for l in labels if l["label"] == "node") == 1
    assert next(l for l in labels if l["label"] == "node")["service"]["id"] == other


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


def test_template_wearing_own_label_does_not_500(client):
    """Binding a template that itself has the catalog label must not recurse."""
    tpl_id = client.post(
        "/api/v1/services",
        json={
            "name": "node-template",
            "vars": {"__template": True, "role": "tpl"},
            "labels": ["node"],
            "sources": [],
            "rules": [
                {
                    "name": "from-tpl",
                    "expression": "True",
                    "source": {"variables": [], "names": [], "renames": {}},
                    "actions": [
                        {"name": "hi", "type": "suggest", "result": "from template", "input": {}}
                    ],
                    "preconditions": [],
                }
            ],
        },
    ).json()

    assert (
        client.post("/api/v1/labels", json={"label": "node", "service": {"id": tpl_id}}).status_code
        == 200
    )

    labels = client.get("/api/v1/labels").json()
    row = next(l for l in labels if l["label"] == "node")
    assert row["service"]["id"] == tpl_id

    tpl = client.get(f"/api/v1/services/{tpl_id}").json()
    assert "node" not in (tpl.get("labels") or [])

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

    listed = client.get("/api/v1/services")
    assert listed.status_code == 200, listed.text
    child = client.get(f"/api/v1/services/{consumer_id}").json()
    assert child["vars"]["role"] == "tpl"
    assert child["vars"]["name"] == "dell"
    assert any(r["name"] == "from-tpl" for r in child["rules"])

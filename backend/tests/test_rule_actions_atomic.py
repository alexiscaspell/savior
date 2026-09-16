from app.services import savior


def test_rule_actions_are_duplicated_not_shared(client):
    """Each rule owns its own action rows; editing one rule must not mutate another."""
    catalog_id = client.post(
        "/api/v1/actions",
        json={
            "name": "shared-suggest",
            "type": "suggest",
            "result": "from-catalog",
            "input": {},
        },
    ).json()

    rule_a = client.post(
        "/api/v1/rules",
        json={
            "name": "rule-a",
            "expression": "True",
            "source": {"variables": [], "names": [], "renames": {}},
            "preconditions": [],
            "actions": [
                {
                    "id": catalog_id,
                    "name": "shared-suggest",
                    "type": "suggest",
                    "result": "owned-by-a",
                    "input": {},
                }
            ],
        },
    )
    assert rule_a.status_code == 200
    rule_a_id = rule_a.json()

    rule_b = client.post(
        "/api/v1/rules",
        json={
            "name": "rule-b",
            "expression": "True",
            "source": {"variables": [], "names": [], "renames": {}},
            "preconditions": [],
            "actions": [
                {
                    "id": catalog_id,
                    "name": "shared-suggest",
                    "type": "suggest",
                    "result": "owned-by-b",
                    "input": {},
                }
            ],
        },
    )
    assert rule_b.status_code == 200
    rule_b_id = rule_b.json()

    a = client.get(f"/api/v1/rules/{rule_a_id}").json()
    b = client.get(f"/api/v1/rules/{rule_b_id}").json()

    assert len(a["actions"]) == 1
    assert len(b["actions"]) == 1
    assert a["actions"][0]["id"] != b["actions"][0]["id"]
    assert a["actions"][0]["id"] != catalog_id
    assert b["actions"][0]["id"] != catalog_id
    assert a["actions"][0]["result"] == "owned-by-a"
    assert b["actions"][0]["result"] == "owned-by-b"

    # catalog original untouched
    catalog = client.get(f"/api/v1/actions/{catalog_id}").json()
    assert catalog["result"] == "from-catalog"

    # update rule A must not change rule B's action
    client.put(
        f"/api/v1/rules/{rule_a_id}",
        json={
            "name": "rule-a",
            "expression": "True",
            "source": {"variables": [], "names": [], "renames": {}},
            "preconditions": [],
            "actions": [
                {
                    "name": "shared-suggest",
                    "type": "suggest",
                    "result": "owned-by-a-updated",
                    "input": {},
                }
            ],
        },
    )
    b_after = client.get(f"/api/v1/rules/{rule_b_id}").json()
    assert b_after["actions"][0]["result"] == "owned-by-b"


def test_link_action_clones_instead_of_sharing(client):
    catalog_id = client.post(
        "/api/v1/actions",
        json={"name": "tpl", "type": "suggest", "result": "tpl", "input": {}},
    ).json()
    rule_id = client.post(
        "/api/v1/rules",
        json={
            "name": "r-link",
            "expression": "True",
            "source": {"variables": [], "names": [], "renames": {}},
            "preconditions": [],
            "actions": [],
        },
    ).json()

    linked = client.post(f"/api/v1/rules/{rule_id}/actions/{catalog_id}")
    assert linked.status_code == 200

    rule = client.get(f"/api/v1/rules/{rule_id}").json()
    assert len(rule["actions"]) == 1
    assert rule["actions"][0]["id"] != catalog_id
    assert rule["actions"][0]["result"] == "tpl"

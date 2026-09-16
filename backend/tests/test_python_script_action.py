from unittest.mock import MagicMock, patch

from app.model.action import Action, ActionType
from app.model.context import Context
from app.model.exception import InvalidActionException
from app.model.rule import Rule, SourceRule
from app.model.service import Service


def _ctx(svc: Service) -> tuple[Context, Rule]:
    rule = Rule(name="r", expression="True", source=SourceRule(names=[]), actions=[])
    ctx = Context.from_dict({"service": svc})
    rule.context = ctx
    ctx.current_rule = rule
    return ctx, rule


def test_python_script_sets_result_from_svc_vars():
    svc = Service(
        id=1,
        name="node-dell",
        vars={"name": "dell", "ip": "1.2.3.4"},
        sources=[],
        rules=[],
        labels=["node"],
    )
    ctx, rule = _ctx(svc)
    action = Action.from_dict(
        {
            "name": "fix-node",
            "type": "python_script",
            "result": "",
            "input": {
                "script": "result = {'node': svc.vars.name, 'ip': svc.vars.ip}",
            },
        }
    )
    action.context = ctx
    out = action.apply()
    assert out == {"node": "dell", "ip": "1.2.3.4"}


def test_python_script_can_call_http_and_format_result():
    svc = Service(id=1, name="node-nitro", vars={"name": "nitro"}, sources=[], rules=[], labels=[])
    ctx, _ = _ctx(svc)
    action = Action.from_dict(
        {
            "name": "fix",
            "type": "python_script",
            "result": "f\"fixed {result['node']} -> {result['status']}\"",
            "input": {
                "script": (
                    "r = requests.post(f'http://127.0.0.1:8090/fix/{svc.vars.name}')\n"
                    "result = {'node': svc.vars.name, 'status': r.status_code}"
                ),
            },
        }
    )
    action.context = ctx
    fake = MagicMock()
    fake.status_code = 200
    with patch("app.model.action.req.post", return_value=fake) as post:
        out = action.apply()
    post.assert_called_once()
    assert post.call_args.args[0] == "http://127.0.0.1:8090/fix/nitro"
    assert out == "fixed nitro -> 200"


def test_custom_is_alias_of_python_script():
    svc = Service(id=1, name="x", vars={"name": "x"}, sources=[], rules=[], labels=[])
    ctx, _ = _ctx(svc)
    action = Action.from_dict(
        {
            "name": "c",
            "type": "custom",
            "input": {"script": "result = svc.vars.name"},
        }
    )
    action.context = ctx
    assert action.type == ActionType.custom
    assert action.apply() == "x"


def test_python_script_requires_script():
    svc = Service(id=1, name="x", vars={}, sources=[], rules=[], labels=[])
    ctx, _ = _ctx(svc)
    action = Action.from_dict({"name": "empty", "type": "python_script", "input": {}})
    action.context = ctx
    try:
        action.apply()
        assert False, "expected InvalidActionException"
    except InvalidActionException:
        pass

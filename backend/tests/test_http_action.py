from unittest.mock import MagicMock, patch

from app.model.action import Action
from app.model.context import Context
from app.model.rule import Rule, SourceRule
from app.model.service import Service


def test_http_action_evals_url_from_service_vars():
    svc = Service(
        id=1,
        name="node-dell",
        vars={"name": "dell", "ip": "192.168.68.113"},
        sources=[],
        rules=[],
        labels=["node"],
    )
    rule = Rule(
        name="flannel",
        expression="True",
        source=SourceRule(names=[]),
        actions=[],
    )
    action = Action.from_dict(
        {
            "name": "fix-one",
            "type": "http_action",
            "result": "f'{response.status_code}:{svc.vars.name}'",
            "input": {
                "method": "post",
                "url": "f'http://127.0.0.1:8090/fix/{svc.vars.name}'",
            },
        }
    )
    ctx = Context.from_dict({"service": svc})
    rule.context = ctx
    ctx.current_rule = rule
    action.context = ctx

    fake_resp = MagicMock()
    fake_resp.status_code = 200
    fake_resp.text = '{"ok":true}'

    with patch("app.model.action.req.post", return_value=fake_resp) as post:
        out = action.apply()

    post.assert_called_once()
    assert post.call_args.args[0] == "http://127.0.0.1:8090/fix/dell"
    assert out == "200:dell"

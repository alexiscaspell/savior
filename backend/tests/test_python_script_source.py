from app.model.context import Context
from app.model.exception import InvalidSourceException
from app.model.service import Service
from app.model.source import Source, SourceType


def test_python_script_source_returns_result():
    svc = Service(id=1, name="node-dell", vars={"name": "dell"}, sources=[], rules=[], labels=[])
    src = Source.from_dict(
        {
            "name": "probe",
            "type": "python_script",
            "variable": "$response",
            "input": {
                "script": "result = {'node': svc.vars.name, 'ok': True}",
            },
            "output": None,
        }
    )
    svc.sources = [src]
    src.context = Context.from_dict({"service": svc})
    data = src.get_data()
    assert data == {"node": "dell", "ok": True}


def test_python_script_source_output_formats_result():
    svc = Service(id=1, name="node-nitro", vars={"name": "nitro"}, sources=[], rules=[], labels=[])
    src = Source.from_dict(
        {
            "name": "probe",
            "type": "python_script",
            "variable": "$response",
            "input": {"script": "result = svc.vars.name"},
            "output": "f'node={result}'",
        }
    )
    svc.sources = [src]
    src.context = Context.from_dict({"service": svc})
    assert src.get_data() == "node=nitro"


def test_custom_source_is_alias():
    svc = Service(id=1, name="x", vars={"name": "x"}, sources=[], rules=[], labels=[])
    src = Source.from_dict(
        {
            "name": "c",
            "type": "custom",
            "variable": "$response",
            "input": {"script": "result = 42"},
        }
    )
    assert src.type == SourceType.custom
    svc.sources = [src]
    src.context = Context.from_dict({"service": svc})
    assert src.get_data() == 42


def test_python_script_source_requires_script():
    svc = Service(id=1, name="x", vars={}, sources=[], rules=[], labels=[])
    src = Source.from_dict(
        {
            "name": "empty",
            "type": "python_script",
            "variable": "$response",
            "input": {},
        }
    )
    svc.sources = [src]
    src.context = Context.from_dict({"service": svc})
    try:
        src.get_data()
        assert False, "expected InvalidSourceException"
    except InvalidSourceException:
        pass

"""Tests for CLI daemon Flask app."""

import pytest
from app import app, build_command, SUPPORTED_AGENTS


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "ok"
    assert "daemon_id" in data
    assert "machine" in data
    assert "timestamp" in data


def test_list_agents_no_auth(client):
    import app as app_module
    app_module.AUTH_TOKEN = ""
    resp = client.get("/api/agents")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "agents" in data
    assert isinstance(data["agents"], list)
    agent_ids = [a["id"] for a in data["agents"]]
    for key in SUPPORTED_AGENTS:
        assert key in agent_ids


def test_execute_missing_agent(client):
    import app as app_module
    app_module.AUTH_TOKEN = ""
    resp = client.post("/api/execute", json={"prompt": "hello"})
    assert resp.status_code == 400
    assert "agent" in resp.get_json()["error"]


def test_execute_unknown_agent(client):
    import app as app_module
    app_module.AUTH_TOKEN = ""
    resp = client.post("/api/execute", json={"agent": "unknown", "prompt": "hello"})
    assert resp.status_code == 400
    assert "Unknown agent" in resp.get_json()["error"]


def test_execute_missing_prompt(client):
    import app as app_module
    app_module.AUTH_TOKEN = ""
    resp = client.post("/api/execute", json={"agent": "copilot"})
    assert resp.status_code == 400
    assert "prompt" in resp.get_json()["error"]


def test_build_command_copilot():
    cmd = build_command("copilot", "list files")
    assert cmd == ["gh", "copilot", "suggest", "list files"]


def test_build_command_with_flags():
    cmd = build_command("claude", "explain this", ["-v"])
    assert cmd[-1] == "explain this"
    assert "-v" in cmd


def test_shared_context_get(client):
    import app as app_module
    app_module.AUTH_TOKEN = ""
    app_module._context_store = {}
    resp = client.get("/api/context")
    assert resp.status_code == 200
    assert resp.get_json()["context"] == {}


def test_shared_context_post(client):
    import app as app_module
    app_module.AUTH_TOKEN = ""
    app_module._context_store = {}
    resp = client.post("/api/context", json={"key": "foo", "value": "bar"})
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "stored"

    resp2 = client.get("/api/context")
    assert resp2.get_json()["context"]["foo"] == "bar"


def test_auth_required(client):
    import app as app_module
    app_module.AUTH_TOKEN = "secret"
    resp = client.get("/api/agents")
    assert resp.status_code == 401

    resp2 = client.get("/api/agents", headers={"X-Auth-Token": "secret"})
    assert resp2.status_code == 200
    app_module.AUTH_TOKEN = ""

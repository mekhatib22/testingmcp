"""
CLI Host Daemon - Flask server that executes AI CLI commands locally.
Supports: GitHub Copilot CLI, OpenAI Codex, Anthropic Claude, Google Gemini
"""

import os
import subprocess
import uuid
import logging
from datetime import datetime, timezone

from flask import Flask, request, jsonify
from flask_cors import CORS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.environ.get("ALLOWED_ORIGINS", "*")}})

DAEMON_ID = os.environ.get("DAEMON_ID", str(uuid.uuid4()))
MACHINE_NAME = os.environ.get("MACHINE_NAME", os.uname().nodename)
AUTH_TOKEN = os.environ.get("DAEMON_AUTH_TOKEN", "")

SUPPORTED_AGENTS = {
    "copilot": {
        "name": "GitHub Copilot CLI",
        "cmd_prefix": ["gh", "copilot", "suggest"],
        "env_check": None,
    },
    "codex": {
        "name": "OpenAI Codex",
        "cmd_prefix": ["codex"],
        "env_check": "OPENAI_API_KEY",
    },
    "claude": {
        "name": "Anthropic Claude",
        "cmd_prefix": ["claude"],
        "env_check": "ANTHROPIC_API_KEY",
    },
    "gemini": {
        "name": "Google Gemini",
        "cmd_prefix": ["gemini"],
        "env_check": "GEMINI_API_KEY",
    },
}

COMMAND_TIMEOUT = int(os.environ.get("COMMAND_TIMEOUT", "60"))


def require_auth(f):
    """Decorator to require authentication token when AUTH_TOKEN is set."""
    from functools import wraps

    @wraps(f)
    def decorated(*args, **kwargs):
        if AUTH_TOKEN:
            token = request.headers.get("X-Auth-Token", "")
            if token != AUTH_TOKEN:
                return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)

    return decorated


def build_command(agent: str, prompt: str, flags: list[str] | None = None) -> list[str]:
    """Build the shell command for the given agent and prompt."""
    agent_cfg = SUPPORTED_AGENTS[agent]
    cmd = list(agent_cfg["cmd_prefix"])
    if flags:
        cmd.extend(flags)
    cmd.append(prompt)
    return cmd


def run_command(cmd: list[str], extra_env: dict | None = None) -> dict:
    """Execute a shell command and return structured result."""
    env = {**os.environ}
    if extra_env:
        env.update(extra_env)

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=COMMAND_TIMEOUT,
            env=env,
        )
        return {
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "success": result.returncode == 0,
        }
    except subprocess.TimeoutExpired:
        return {
            "returncode": -1,
            "stdout": "",
            "stderr": f"Command timed out after {COMMAND_TIMEOUT}s",
            "success": False,
        }
    except FileNotFoundError as exc:
        return {
            "returncode": -1,
            "stdout": "",
            "stderr": f"Command not found: {exc}",
            "success": False,
        }


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "daemon_id": DAEMON_ID,
            "machine": MACHINE_NAME,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


@app.route("/api/agents", methods=["GET"])
@require_auth
def list_agents():
    """Return available agents and whether their CLI tools appear installed."""
    agents = []
    for key, cfg in SUPPORTED_AGENTS.items():
        available = _check_agent_available(key, cfg)
        agents.append(
            {
                "id": key,
                "name": cfg["name"],
                "available": available,
            }
        )
    return jsonify({"agents": agents, "machine": MACHINE_NAME})


def _check_agent_available(key: str, cfg: dict) -> bool:
    """Check whether an agent CLI is available on this machine."""
    env_key = cfg.get("env_check")
    if env_key and not os.environ.get(env_key):
        return False
    try:
        subprocess.run(
            cfg["cmd_prefix"] + ["--version"],
            capture_output=True,
            timeout=5,
        )
        return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


@app.route("/api/execute", methods=["POST"])
@require_auth
def execute():
    """Execute a prompt via the requested AI CLI agent."""
    body = request.get_json(force=True)

    agent = body.get("agent", "").lower()
    prompt = body.get("prompt", "").strip()
    flags = body.get("flags", [])

    if not agent:
        return jsonify({"error": "Missing 'agent' field"}), 400
    if agent not in SUPPORTED_AGENTS:
        return jsonify({"error": f"Unknown agent '{agent}'. Supported: {list(SUPPORTED_AGENTS)}"}), 400
    if not prompt:
        return jsonify({"error": "Missing 'prompt' field"}), 400
    if not isinstance(flags, list):
        return jsonify({"error": "'flags' must be a list"}), 400

    cmd = build_command(agent, prompt, flags)
    logger.info("Executing [%s]: %s", agent, cmd)

    result = run_command(cmd)

    return jsonify(
        {
            "agent": agent,
            "machine": MACHINE_NAME,
            "daemon_id": DAEMON_ID,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "command": cmd,
            "result": result,
        }
    )


@app.route("/api/context", methods=["GET", "POST"])
@require_auth
def shared_context():
    """
    Simple in-memory shared context store so multiple agents can read/write
    collaborative state. For production use, replace with a persistent store.
    """
    global _context_store
    if request.method == "POST":
        body = request.get_json(force=True)
        key = body.get("key")
        value = body.get("value")
        if not key:
            return jsonify({"error": "Missing 'key'"}), 400
        _context_store[key] = value
        return jsonify({"status": "stored", "key": key})
    return jsonify({"context": _context_store})


_context_store: dict = {}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    logger.info("Starting CLI daemon on port %d (machine=%s)", port, MACHINE_NAME)
    app.run(host="0.0.0.0", port=port, debug=debug)

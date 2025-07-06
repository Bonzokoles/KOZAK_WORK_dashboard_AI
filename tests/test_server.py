import pytest
from backend.server import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_index(client):
    """Test the index page."""
    rv = client.get("/")
    assert rv.status_code == 200


def test_system_resources(client):
    """Test the system resources endpoint."""
    rv = client.get("/api/system/resources")
    assert rv.status_code == 200
    json_data = rv.get_json()
    assert json_data["success"] is True
    assert "cpu_percent" in json_data["data"]


def test_system_info(client):
    """Test the system info endpoint."""
    rv = client.get("/api/system/info")
    assert rv.status_code == 200
    json_data = rv.get_json()
    assert json_data["success"] is True
    assert "hostname" in json_data["data"]


def test_network_stats(client):
    """Test the network stats endpoint."""
    rv = client.get("/api/network/stats")
    assert rv.status_code == 200
    json_data = rv.get_json()
    assert json_data["success"] is True
    assert "download" in json_data["data"]


def test_system_processes(client):
    """Test the system processes endpoint."""
    rv = client.get("/api/system/processes")
    assert rv.status_code == 200
    json_data = rv.get_json()
    assert json_data["success"] is True
    assert isinstance(json_data["data"], list)

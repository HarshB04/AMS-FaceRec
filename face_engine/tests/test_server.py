"""Tests for ``face_engine/server.py`` Flask API and helpers."""

from __future__ import annotations

import pickle
from unittest.mock import MagicMock, patch

import numpy as np
import pytest

import server


@pytest.fixture(autouse=True)
def reset_server_globals():
    """Avoid cross-test leakage of session state."""
    server.logged_students.clear()
    server.recognized_log.clear()
    server.scan_active = False
    server.enroll_active = False
    server.enroll_count = 0
    server.enroll_faces.clear()
    server.enroll_name = ""
    yield


@pytest.fixture
def client():
    server.app.config["TESTING"] = True
    with server.app.test_client() as c:
        yield c


class TestRoutes:
    def test_home_returns_status_and_endpoints(self, client):
        res = client.get("/")
        assert res.status_code == 200
        data = res.get_json()
        assert data["status"] == "running"
        assert "endpoints" in data
        assert "GET /video_feed" in data["endpoints"]

    def test_recognized_defaults_empty(self, client):
        res = client.get("/recognized")
        assert res.status_code == 200
        assert res.get_json() == []

    def test_enroll_status_shape(self, client):
        res = client.get("/enroll_status")
        assert res.status_code == 200
        body = res.get_json()
        assert body["count"] == 0
        assert body["active"] is False
        assert body["name"] == ""

    def test_stop_returns_ok(self, client):
        res = client.post("/stop")
        assert res.status_code == 200
        assert res.get_json()["message"] == "Camera stopped"


class TestLoadModel:
    def test_returns_none_when_data_missing(self, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        monkeypatch.setattr(server, '__file__', str(tmp_path / "server.py"))
        (tmp_path / "data").mkdir()
        assert server.load_model() is None

    def test_returns_fitted_knn_when_data_valid(self, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        monkeypatch.setattr(server, '__file__', str(tmp_path / "server.py"))
        data_dir = tmp_path / "data"
        data_dir.mkdir()
        n_samples = 6
        dim = 50 * 50 * 3
        faces = np.random.RandomState(0).rand(n_samples, dim).astype(np.float64)
        labels = ["test_user"] * n_samples
        with open(data_dir / "names.pkl", "wb") as f:
            pickle.dump(labels, f)
        with open(data_dir / "faces_data.npy", "wb") as f:
            np.save(f, faces)

        knn = server.load_model()
        assert knn is not None
        pred = knn.predict(faces[:1])
        assert pred[0] == "test_user"


class TestLogAttendance:
    def test_skips_when_already_logged(self):
        server.logged_students.add("DupUser")
        with patch.object(server.http_requests, "post") as mock_post:
            server.log_attendance_via_backend("DupUser", 85.0)
        mock_post.assert_not_called()

    def test_unknown_student_does_not_post_and_adds_to_logged(self):
        post_mock = MagicMock()
        post_mock.status_code = 404
        
        with patch.object(server.http_requests, "post", return_value=post_mock) as mock_post:
            server.log_attendance_via_backend("Ghost", 75.0)
            
        mock_post.assert_called_once()
        assert "Ghost" in server.logged_students

    def test_posts_attendance_with_course_context(self):
        post_mock = MagicMock()
        post_mock.status_code = 201
        post_mock.json.return_value = {"student_name": "Alice"}

        course_context = {"course_code": "CS101", "department": "CS"}
        
        with patch.object(server.http_requests, "post", return_value=post_mock) as mock_post:
            server.log_attendance_via_backend("Alice", 92.5, course_context)

        mock_post.assert_called_once()
        payload = mock_post.call_args.kwargs["json"]
        assert payload["sbrn"] == "Alice"
        assert payload["confidence"] == 92.5
        assert payload["course_code"] == "CS101"
        assert payload["department"] == "CS"
        assert "date" in payload
        assert "time" in payload
        assert "Alice" in server.logged_students

    def test_posts_without_course_context(self):
        post_mock = MagicMock()
        post_mock.status_code = 200
        post_mock.json.return_value = {"student_name": "Bob"}

        with patch.object(server.http_requests, "post", return_value=post_mock) as mock_post:
            server.log_attendance_via_backend("Bob", 88.0)

        payload = mock_post.call_args.kwargs["json"]
        assert "course_code" not in payload
        assert "Bob" in server.logged_students

    def test_adds_to_logged_on_forbidden_status(self):
        post_mock = MagicMock()
        post_mock.status_code = 403
        post_mock.json.return_value = {"message": "Not Enrolled"}

        with patch.object(server.http_requests, "post", return_value=post_mock):
            server.log_attendance_via_backend("Carol", 90.0)

        assert "Carol" in server.logged_students

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def run_all():
    # 1. Health & Public endpoints
    r = client.get("/api/health")
    assert r.status_code == 200 and r.json()["status"] == "ok", r.text

    plans = client.get("/api/public/plans").json()["plans"]
    assert len(plans) == 3

    cats = client.get("/api/public/categories").json()["categories"]
    assert len(cats) == 13

    # 2. Register & Login
    reg = client.post(
        "/api/auth/register",
        json={"email": "testuser@formaspace.ai", "password": "Password123!", "full_name": "Test Architect"},
    )
    assert reg.status_code in (200, 409), reg.text

    login = client.post(
        "/api/auth/login",
        json={"email": "studio@formaspace.ai", "password": "FormaSpace2026!"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Studio generate (Interior Redesign + 2 variations)
    gen = client.post(
        "/api/studio/generate",
        headers=headers,
        json={
            "original_image_url": "/images/hero-before.jpg",
            "feature_type": "interior_redesign",
            "category": "Living Room",
            "room_type": "Living Room",
            "style": "Japandi",
            "intervention_level": "Medium",
            "prompt": "Warm oak and limewash plaster",
            "variations_count": 2,
            "settings": {"wall_color": "Warm Ivory Plaster"},
        },
    )
    assert gen.status_code == 200, gen.text
    d = gen.json()["design"]
    assert len(d["variations"]) == 2
    assert d["is_demo_mode"] is True

    # 4. Save design & verify history
    save_res = client.patch(f"/api/studio/designs/{d['id']}/save", headers=headers, json={"is_saved": True})
    assert save_res.status_code == 200

    hist = client.get("/api/studio/history", headers=headers)
    assert hist.status_code == 200 and len(hist.json()["designs"]) >= 1

    # 4b. Masked inpainting + Inspiration transfer test
    import base64, io
    from PIL import Image, ImageDraw
    m_img = Image.new("RGBA", (200, 120), (0, 0, 0, 0))
    ImageDraw.Draw(m_img).rectangle([40, 30, 140, 90], fill=(200, 121, 96, 180))
    mbuf = io.BytesIO()
    m_img.save(mbuf, format="PNG")
    mask_url = "data:image/png;base64," + base64.b64encode(mbuf.getvalue()).decode("utf-8")

    masked_gen = client.post(
        "/api/studio/generate",
        headers=headers,
        json={
            "original_image_url": "/images/hero-before.jpg",
            "inspiration_image_url": "/images/style-japandi.jpg",
            "mask_data_url": mask_url,
            "feature_type": "inspiration_transfer",
            "category": "Living Room",
            "room_type": "Living Room",
            "style": "Japandi",
            "intervention_level": "Medium",
            "prompt": "Match warm oak and travertine inspiration",
            "variations_count": 1,
            "settings": {},
        },
    )
    assert masked_gen.status_code == 200, masked_gen.text
    mg = masked_gen.json()["design"]
    assert mg["inspiration_analysis"] and len(mg["inspiration_analysis"]["palette"]) == 5

    # 4c. Runtime AI provider status + demo configure
    cfg = client.post("/api/studio/configure-ai", headers=headers, json={"provider": "demo", "api_key": ""})
    assert cfg.status_code == 200 and cfg.json()["ai_provider"] == "demo"

    # 5. Floor plan 2D->3D
    fp = client.post(
        "/api/modules/floor-plans/generate",
        headers=headers,
        json={
            "title": "Test Loft Plan",
            "source_plan_url": "/images/floorplan-2d.jpg",
            "layout_style": "Modern Luxury",
            "furniture_arrangement": "Open Concept Entertaining",
        },
    )
    assert fp.status_code == 200, fp.text

    # 6. Video Walkthrough
    vid = client.post(
        "/api/modules/videos/generate",
        headers=headers,
        json={
            "title": "Living Room Walk",
            "source_image_url": "/images/hero-after.jpg",
            "camera_movement": "Slow Dolly In",
            "duration_seconds": 6,
        },
    )
    assert vid.status_code == 200 and vid.json()["video_project"]["requires_external_provider"] is True

    # 7. Budget estimator
    est = client.post(
        "/api/modules/budget/estimate",
        headers=headers,
        json={"room_type": "Living Room", "length_ft": 20, "width_ft": 15, "height_ft": 10},
    )
    assert est.status_code == 200 and est.json()["estimated_total"] > 0, est.text

    # 8. Furniture discover
    furn = client.get("/api/modules/furniture/discover?style=Modern%20Luxury")
    assert furn.status_code == 200 and len(furn.json()["products"]) > 0

    # 9. Admin login & analytics
    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@formaspace.ai", "password": "AdminForma2026!"},
    )
    assert admin_login.status_code == 200, admin_login.text
    ah = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    ov = client.get("/api/admin/overview", headers=ah)
    assert ov.status_code == 200 and ov.json()["metrics"]["ai_generations"] >= 1, ov.text

    print("ALL BACKEND TESTS PASSED:", ov.json()["metrics"])


if __name__ == "__main__":
    run_all()


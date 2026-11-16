"""
FormaSpace AI - Comprehensive End-to-End Deep Test Suite
Tests every endpoint, permission boundary, role behavior (User & Admin),
and AI image/object pipelines.
"""

import base64
import io
import sys
import unittest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.main import app

client = TestClient(app)


class FormaSpaceDeepTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # 1. Obtain User Token (studio@formaspace.ai)
        res_user = client.post(
            "/api/auth/login",
            json={"email": "studio@formaspace.ai", "password": "FormaSpace2026!"},
        )
        assert res_user.status_code == 200, f"User login failed: {res_user.text}"
        cls.user_data = res_user.json()["user"]
        cls.user_token = res_user.json()["access_token"]
        cls.user_headers = {"Authorization": f"Bearer {cls.user_token}"}

        # 2. Obtain Admin Token (admin@formaspace.ai)
        res_admin = client.post(
            "/api/auth/login",
            json={"email": "admin@formaspace.ai", "password": "AdminForma2026!"},
        )
        assert res_admin.status_code == 200, f"Admin login failed: {res_admin.text}"
        cls.admin_data = res_admin.json()["user"]
        cls.admin_token = res_admin.json()["access_token"]
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

    # =========================================================================
    # PART 1: PUBLIC ENDPOINTS
    # =========================================================================
    def test_01_health_check(self):
        r = client.get("/api/health")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "ok")

    def test_02_public_plans(self):
        r = client.get("/api/public/plans")
        self.assertEqual(r.status_code, 200)
        plans = r.json().get("plans", [])
        self.assertGreaterEqual(len(plans), 3)
        for p in plans:
            self.assertIn("id", p)
            self.assertIn("name", p)
            self.assertIn("monthly_price", p)
            self.assertIn("credits_per_month", p)

    def test_03_public_categories(self):
        r = client.get("/api/public/categories")
        self.assertEqual(r.status_code, 200)
        cats = r.json().get("categories", [])
        self.assertGreaterEqual(len(cats), 5)

    def test_04_public_newsletter(self):
        r = client.post("/api/public/newsletter", json={"email": "deep_test@formaspace.ai"})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json().get("subscribed"))

    def test_05_google_config(self):
        r = client.get("/api/auth/google-config")
        self.assertEqual(r.status_code, 200)
        self.assertIn("configured", r.json())

    # =========================================================================
    # PART 2: AUTHENTICATION & PROFILE
    # =========================================================================
    def test_06_user_profile_me(self):
        r = client.get("/api/auth/me", headers=self.user_headers)
        self.assertEqual(r.status_code, 200)
        u = r.json()["user"]
        self.assertEqual(u["email"], "studio@formaspace.ai")

    def test_07_user_update_profile(self):
        r = client.patch(
            "/api/auth/profile",
            headers=self.user_headers,
            json={"full_name": "Elena Vance (Principal Architect)"},
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["user"]["full_name"], "Elena Vance (Principal Architect)")

    def test_08_invalid_login(self):
        r = client.post(
            "/api/auth/login",
            json={"email": "studio@formaspace.ai", "password": "WrongPassword123!"},
        )
        self.assertEqual(r.status_code, 401)

    # =========================================================================
    # PART 3: USER DASHBOARD (PROJECTS & FOLDERS)
    # =========================================================================
    def test_09_dashboard_overview(self):
        r = client.get("/api/dashboard/overview", headers=self.user_headers)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("stats", data)
        self.assertIn("recent_projects", data)

    def test_10_folders_crud(self):
        # Create
        c_res = client.post(
            "/api/dashboard/folders",
            headers=self.user_headers,
            json={"name": "Test Villa Sanctuary", "color": "#172B3A"},
        )
        self.assertEqual(c_res.status_code, 200)
        folder = c_res.json()["folder"]
        fid = folder["id"]

        # List
        l_res = client.get("/api/dashboard/folders", headers=self.user_headers)
        self.assertEqual(l_res.status_code, 200)
        self.assertTrue(any(f["id"] == fid for f in l_res.json()["folders"]))

        # Delete
        d_res = client.delete(f"/api/dashboard/folders/{fid}", headers=self.user_headers)
        self.assertEqual(d_res.status_code, 200)

    def test_11_projects_crud(self):
        # Create
        c_res = client.post(
            "/api/dashboard/projects",
            headers=self.user_headers,
            json={
                "title": "Kyoto Courtyard Residence",
                "category": "Living Room",
                "style": "Japandi",
                "cover_image": "/images/hero-after.jpg",
            },
        )
        self.assertEqual(c_res.status_code, 200)
        pid = c_res.json()["project"]["id"]

        # List
        l_res = client.get("/api/dashboard/projects", headers=self.user_headers)
        self.assertEqual(l_res.status_code, 200)
        self.assertTrue(any(p["id"] == pid for p in l_res.json()["projects"]))

        # Delete
        d_res = client.delete(f"/api/dashboard/projects/{pid}", headers=self.user_headers)
        self.assertEqual(d_res.status_code, 200)

    def test_12_subscription_switch(self):
        r = client.post("/api/dashboard/subscription/switch/pro", headers=self.user_headers)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["plan_id"], "professional")

    # =========================================================================
    # PART 4: AI STUDIO - OBJECT DETECTION (ROOM-AWARE)
    # =========================================================================
    def test_13_detect_objects_kitchen(self):
        # Before
        r1 = client.post(
            "/api/studio/detect-objects",
            headers=self.user_headers,
            json={"image_url": "/images/kitchen-before.jpg", "room_type": "Kitchen"},
        )
        self.assertEqual(r1.status_code, 200)
        labels1 = [o["label"] for o in r1.json()["objects"]]
        self.assertTrue(any("Counter" in l or "Cabinet" in l or "Kitchen" in l for l in labels1))
        self.assertFalse(any("Sofa" in l for l in labels1))

        # After
        r2 = client.post(
            "/api/studio/detect-objects",
            headers=self.user_headers,
            json={"image_url": "/images/kitchen-after.jpg", "room_type": "Kitchen"},
        )
        self.assertEqual(r2.status_code, 200)
        labels2 = [o["label"] for o in r2.json()["objects"]]
        self.assertTrue(any("Island" in l or "Cooktop" in l for l in labels2))
        self.assertFalse(any("Sofa" in l for l in labels2))

    def test_14_detect_objects_bathroom(self):
        r = client.post(
            "/api/studio/detect-objects",
            headers=self.user_headers,
            json={"image_url": "/images/bathroom-after.jpg", "room_type": "Bathroom"},
        )
        self.assertEqual(r.status_code, 200)
        labels = [o["label"] for o in r.json()["objects"]]
        self.assertTrue(any("Vanity" in l or "Mirror" in l or "Shower" in l for l in labels))
        self.assertFalse(any("Sofa" in l for l in labels))

    def test_15_detect_objects_bedroom(self):
        r = client.post(
            "/api/studio/detect-objects",
            headers=self.user_headers,
            json={"image_url": "/images/bedroom-after.jpg", "room_type": "Bedroom"},
        )
        self.assertEqual(r.status_code, 200)
        labels = [o["label"] for o in r.json()["objects"]]
        self.assertTrue(any("Bed" in l for l in labels))

    def test_16_detect_objects_living_room(self):
        r = client.post(
            "/api/studio/detect-objects",
            headers=self.user_headers,
            json={"image_url": "/images/hero-after.jpg", "room_type": "Living Room"},
        )
        self.assertEqual(r.status_code, 200)
        labels = [o["label"] for o in r.json()["objects"]]
        self.assertTrue(any("Sofa" in l for l in labels))

    # =========================================================================
    # PART 5: AI STUDIO - GENERATION PIPELINES
    # =========================================================================
    def test_17_generate_interior_redesign(self):
        r = client.post(
            "/api/studio/generate",
            headers=self.user_headers,
            json={
                "original_image_url": "/images/kitchen-before.jpg",
                "feature_type": "interior_redesign",
                "category": "Kitchen",
                "room_type": "Kitchen",
                "style": "Modern Luxury",
                "intervention_level": "Medium",
                "prompt": "Honed marble waterfall island and fluted oak cabinetry",
                "variations_count": 2,
                "settings": {"wall_color": "Warm Ivory Plaster"},
            },
        )
        self.assertEqual(r.status_code, 200)
        d = r.json()["design"]
        self.assertIn("generated_image_url", d)
        self.assertIn("variations", d)
        self.assertEqual(len(d["variations"]), 2)
        # Store for save / delete tests
        self.__class__.generated_design_id = d["id"]

    def test_18_save_and_history_design(self):
        did = getattr(self.__class__, "generated_design_id", None)
        self.assertIsNotNone(did)

        # Save / bookmark
        s_res = client.patch(
            f"/api/studio/designs/{did}/save",
            headers=self.user_headers,
            json={"is_saved": True},
        )
        self.assertEqual(s_res.status_code, 200)
        self.assertTrue(s_res.json()["is_saved"])

        # History check
        h_res = client.get("/api/studio/history", headers=self.user_headers)
        self.assertEqual(h_res.status_code, 200)
        self.assertTrue(any(item["id"] == did for item in h_res.json()["designs"]))

    def test_19_generate_masked_inpainting(self):
        # Create a small valid data URI mask
        m_img = Image.new("RGBA", (150, 100), (0, 0, 0, 0))
        ImageDraw.Draw(m_img).rectangle([20, 20, 120, 80], fill=(200, 121, 96, 200))
        mbuf = io.BytesIO()
        m_img.save(mbuf, format="PNG")
        mask_data = "data:image/png;base64," + base64.b64encode(mbuf.getvalue()).decode("utf-8")

        r = client.post(
            "/api/studio/generate",
            headers=self.user_headers,
            json={
                "original_image_url": "/images/hero-before.jpg",
                "mask_data_url": mask_data,
                "feature_type": "interior_redesign",
                "category": "Living Room",
                "room_type": "Living Room",
                "style": "Contemporary",
                "intervention_level": "High",
                "prompt": "Custom contemporary seating",
                "variations_count": 1,
                "settings": {},
            },
        )
        self.assertEqual(r.status_code, 200)
        d = r.json()["design"]
        self.assertIn("generated_image_url", d)

    def test_20_generate_sky_weather(self):
        r = client.post(
            "/api/studio/generate",
            headers=self.user_headers,
            json={
                "original_image_url": "/images/exterior-before.jpg",
                "feature_type": "sky_weather",
                "category": "House Exterior",
                "room_type": "House Exterior",
                "style": "Contemporary",
                "intervention_level": "Medium",
                "prompt": "Golden hour twilight illumination",
                "variations_count": 1,
                "settings": {"weather": "Golden Hour"},
            },
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn("generated_image_url", r.json()["design"])

    # =========================================================================
    # PART 6: SPECIALIZED MODULES (FLOOR PLANS, VIDEOS, FURNITURE, ESTIMATOR)
    # =========================================================================
    def test_21_floor_plans_generate_and_list(self):
        g = client.post(
            "/api/modules/floor-plans/generate",
            headers=self.user_headers,
            json={
                "title": "Minimalist Penthouse Plan",
                "source_plan_url": "/images/floorplan-2d.jpg",
                "layout_style": "Minimalist",
                "furniture_arrangement": "Executive Architecture",
            },
        )
        self.assertEqual(g.status_code, 200)
        fp = g.json()["floor_plan"]
        self.assertIn("render_3d_url", fp)

        l_res = client.get("/api/modules/floor-plans", headers=self.user_headers)
        self.assertEqual(l_res.status_code, 200)
        self.assertGreaterEqual(len(l_res.json()["floor_plans"]), 1)

    def test_22_video_walkthrough_generate_and_list(self):
        v = client.post(
            "/api/modules/videos/generate",
            headers=self.user_headers,
            json={
                "title": "Kitchen Island Walkthrough",
                "source_image_url": "/images/kitchen-after.jpg",
                "camera_movement": "Orbit Left to Right",
                "duration_seconds": 6,
            },
        )
        self.assertEqual(v.status_code, 200)
        self.assertIn("video_project", v.json())

        l_res = client.get("/api/modules/videos", headers=self.user_headers)
        self.assertEqual(l_res.status_code, 200)
        self.assertGreaterEqual(len(l_res.json()["videos"]), 1)

    def test_23_furniture_discover_and_collection(self):
        # Discover
        f_res = client.get("/api/modules/furniture/discover?style=Modern%20Luxury&category=Living%20Room")
        self.assertEqual(f_res.status_code, 200)
        prods = f_res.json()["products"]
        self.assertGreaterEqual(len(prods), 1)
        first = prods[0]

        # Save to collection
        s_res = client.post(
            "/api/modules/furniture/collection",
            headers=self.user_headers,
            json={
                "product_id": first["id"],
                "product_name": first["name"],
                "category": first["category"],
                "material": first["material"],
                "approx_price": first["price"],
                "image_url": first["image_url"],
                "product_url": first["product_url"],
            },
        )
        self.assertEqual(s_res.status_code, 200)
        item_id = s_res.json()["id"]

        # List collection
        c_res = client.get("/api/modules/furniture/collection", headers=self.user_headers)
        self.assertEqual(c_res.status_code, 200)
        self.assertTrue(any(item["id"] == item_id for item in c_res.json()["items"]))

        # Remove from collection
        del_res = client.delete(f"/api/modules/furniture/collection/{item_id}", headers=self.user_headers)
        self.assertEqual(del_res.status_code, 200)

    def test_24_furniture_order_checkout(self):
        r = client.post(
            "/api/modules/furniture/order",
            headers=self.user_headers,
            json={
                "items": [{"name": "Pietra Travertine Table", "qty": 1, "price": "$1,450"}],
                "total_amount": 1450.0,
                "shipping_name": "Elena Vance",
            },
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "Confirmed")

    def test_25_budget_estimator(self):
        r = client.post(
            "/api/modules/budget/estimate",
            headers=self.user_headers,
            json={
                "room_type": "Kitchen",
                "length_ft": 16,
                "width_ft": 14,
                "height_ft": 10,
                "flooring_material": "Honed Roman Travertine",
                "wall_material": "Warm Ivory Plaster",
                "save_estimate": True,
                "title": "Kitchen Renovation Estimate",
            },
        )
        self.assertEqual(r.status_code, 200)
        self.assertGreater(r.json()["estimated_total"], 0)

        # List saved estimates
        l_res = client.get("/api/modules/budget/estimates", headers=self.user_headers)
        self.assertEqual(l_res.status_code, 200)
        self.assertGreaterEqual(len(l_res.json()["estimates"]), 1)

    def test_26_smart_furniture_cost_estimator(self):
        # 1. INR Currency
        r_inr = client.post(
            "/api/modules/smart-estimator/analyze",
            json={
                "image_url": "/images/kitchen-after.jpg",
                "room_type": "Kitchen",
                "style": "Modern Luxury",
                "currency": "INR",
            },
        )
        self.assertEqual(r_inr.status_code, 200)
        data_inr = r_inr.json()
        self.assertEqual(data_inr["currency"], "INR")
        self.assertEqual(data_inr["currency_symbol"], "₹")
        self.assertGreater(data_inr["detected_items_count"], 0)
        self.assertGreater(data_inr["total_estimated_furniture_cost"], 0)

        # 2. USD Currency
        r_usd = client.post(
            "/api/modules/smart-estimator/analyze",
            json={
                "image_url": "/images/bedroom-after.jpg",
                "room_type": "Bedroom",
                "style": "Modern Luxury",
                "currency": "USD",
            },
        )
        self.assertEqual(r_usd.status_code, 200)
        data_usd = r_usd.json()
        self.assertEqual(data_usd["currency"], "USD")
        self.assertEqual(data_usd["currency_symbol"], "$")
        self.assertGreater(data_usd["total_estimated_furniture_cost"], 0)

    # =========================================================================
    # PART 7: ADMIN ROLE END-TO-END
    # =========================================================================
    def test_27_admin_overview(self):
        r = client.get("/api/admin/overview", headers=self.admin_headers)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("metrics", data)
        self.assertIn("total_users", data["metrics"])
        self.assertIn("ai_generations", data["metrics"])

    def test_28_admin_users_list_and_update(self):
        # List users
        r = client.get("/api/admin/users", headers=self.admin_headers)
        self.assertEqual(r.status_code, 200)
        users = r.json()["users"]
        self.assertGreaterEqual(len(users), 2)

        # Update test user credits
        target_uid = self.user_data["id"]
        u_res = client.patch(
            f"/api/admin/users/{target_uid}",
            headers=self.admin_headers,
            json={"credits": 250},
        )
        self.assertEqual(u_res.status_code, 200)
        self.assertTrue(u_res.json()["updated"])

    def test_29_admin_plans_list_and_update(self):
        r = client.get("/api/admin/plans", headers=self.admin_headers)
        self.assertEqual(r.status_code, 200)
        plans = r.json()["plans"]
        self.assertGreaterEqual(len(plans), 1)

        # Update plan
        p_res = client.patch(
            f"/api/admin/plans/{plans[0]['id']}",
            headers=self.admin_headers,
            json={"credits_per_month": 50},
        )
        self.assertEqual(p_res.status_code, 200)

    def test_30_admin_categories_crud(self):
        # List
        r = client.get("/api/admin/categories", headers=self.admin_headers)
        self.assertEqual(r.status_code, 200)

        # Create
        c_res = client.post(
            "/api/admin/categories",
            headers=self.admin_headers,
            json={
                "name": "Luxury Wine Cellar",
                "slug": "luxury-wine-cellar",
                "group_name": "Interior",
                "description": "Temperature-controlled oak and glass tasting rooms",
                "cover_image": "/images/hero-after.jpg",
                "sort_order": 99,
            },
        )
        self.assertEqual(c_res.status_code, 200)
        cid = c_res.json()["id"]

        # Toggle
        t_res = client.patch(f"/api/admin/categories/{cid}/toggle", headers=self.admin_headers)
        self.assertEqual(t_res.status_code, 200)

    def test_31_admin_projects_and_logs(self):
        # Projects
        p_res = client.get("/api/admin/projects", headers=self.admin_headers)
        self.assertEqual(p_res.status_code, 200)
        self.assertIn("projects", p_res.json())

        # Error logs
        l_res = client.get("/api/admin/error-logs", headers=self.admin_headers)
        self.assertEqual(l_res.status_code, 200)
        self.assertIn("logs", l_res.json())

    def test_32_admin_configure_ai(self):
        r = client.post(
            "/api/studio/configure-ai",
            headers=self.admin_headers,
            json={"provider": "demo", "api_key": ""},
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["ai_provider"], "demo")

    # =========================================================================
    # PART 8: SECURITY & ROLE BOUNDARY ENFORCEMENT
    # =========================================================================
    def test_33_user_forbidden_from_admin_overview(self):
        r = client.get("/api/admin/overview", headers=self.user_headers)
        self.assertEqual(r.status_code, 403, "Non-admin user MUST NOT access /api/admin/overview")

    def test_34_user_forbidden_from_admin_users(self):
        r = client.get("/api/admin/users", headers=self.user_headers)
        self.assertEqual(r.status_code, 403, "Non-admin user MUST NOT access /api/admin/users")

    def test_35_unauthenticated_forbidden_from_protected_routes(self):
        r1 = client.get("/api/dashboard/overview")
        self.assertEqual(r1.status_code, 401)

        r2 = client.post("/api/studio/generate", json={})
        self.assertEqual(r2.status_code, 401)

        r3 = client.get("/api/admin/overview")
        self.assertEqual(r3.status_code, 401)


if __name__ == "__main__":
    unittest.main()

from typing import Any, Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class GenerateDesignRequest(BaseModel):
    original_image_url: str
    inspiration_image_url: Optional[str] = None
    mask_data_url: Optional[str] = None
    feature_type: str = "interior_redesign"
    category: str = "Living Room"
    room_type: str = "Living Room"
    style: str = "Modern Luxury"
    intervention_level: str = "Medium"
    prompt: str = ""
    variations_count: int = Field(default=2, ge=1, le=4)
    project_id: Optional[str] = None
    settings: dict[str, Any] = Field(default_factory=dict)


class ConfigureAIRequest(BaseModel):
    provider: str = Field(pattern="^(demo|openai|gemini|stability|fal)$")
    api_key: str = ""
    model: str = ""


class DetectObjectsRequest(BaseModel):
    image_url: str
    room_type: str = "Living Room"


class SaveDesignRequest(BaseModel):
    is_saved: bool = True
    project_id: Optional[str] = None


class CreateFolderRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    color: str = "#172B3A"


class CreateProjectRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    category: str = "Living Room"
    style: str = "Modern Luxury"
    folder_id: Optional[str] = None
    cover_image: Optional[str] = None


class FloorPlanGenerateRequest(BaseModel):
    title: str = "Architectural Floor Plan Study"
    source_plan_url: str
    layout_style: str = "Modern Luxury"
    furniture_arrangement: str = "Open Concept Entertaining"
    lighting_mood: str = "Natural Morning Daylight"
    perspective: str = "3D Isometric Cutaway"


class VideoGenerateRequest(BaseModel):
    title: str = "Cinematic Space Walkthrough"
    source_image_url: str
    camera_movement: str = "Slow Dolly In"
    duration_seconds: int = Field(default=6, ge=4, le=15)
    angles: list[str] = Field(default_factory=lambda: ["Wide Establishing", "Material Close-Up", "Window Pan"])
    transition_style: str = "Smooth Architectural Ease"


class BudgetEstimateRequest(BaseModel):
    title: str = "Room Renovation Estimate"
    room_type: str = "Living Room"
    length_ft: float = Field(default=18, gt=2, le=200)
    width_ft: float = Field(default=14, gt=2, le=200)
    height_ft: float = Field(default=10, gt=6, le=30)
    flooring_material: str = "European White Oak"
    wall_material: str = "Limewash Plaster"
    furniture_category: str = "Curated Designer Suite"
    lighting_requirements: str = "Layered Architectural & Pendant"
    renovation_quality: str = "Curated Mid-Range"
    location: str = "Major Metro (US/EU)"
    save_estimate: bool = True


class SaveFurnitureRequest(BaseModel):
    design_id: Optional[str] = None
    product_id: str
    product_name: str
    category: str
    material: str
    approx_price: float
    image_url: str
    product_url: str


class FurnitureOrderRequest(BaseModel):
    items: list[dict[str, Any]]
    total_amount: float
    shipping_name: Optional[str] = "Client"
    shipping_address: Optional[str] = "742 Evergreen Terrace, San Francisco, CA"
    payment_method: Optional[str] = "Credit Card (•••• 4242)"


class SmartEstimatorAnalyzeRequest(BaseModel):
    image_url: str
    room_type: Optional[str] = "Bedroom"
    style: Optional[str] = "Modern Luxury"
    currency: Optional[str] = "INR"


class NewsletterRequest(BaseModel):
    email: EmailStr


class AdminPlanUpdateRequest(BaseModel):
    name: Optional[str] = None
    monthly_price: Optional[float] = None
    annual_price: Optional[float] = None
    credits_per_month: Optional[int] = None
    features: Optional[list[str]] = None
    is_active: Optional[bool] = None


class AdminUserUpdateRequest(BaseModel):
    role: Optional[str] = None
    plan_id: Optional[str] = None
    credits: Optional[int] = None


class AdminCategoryCreateRequest(BaseModel):
    name: str
    slug: str
    group_name: str = "Interior"
    description: str = ""
    cover_image: str = "/images/hero-after.jpg"
    sort_order: int = 99


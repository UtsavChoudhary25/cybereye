from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.models.database import Asset
from app.schemas.schemas import AssetResponse

router = APIRouter()

@router.get("/assets", response_model=List[AssetResponse], tags=["Assets"])
async def list_assets(
    organization: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Asset)
    if organization:
        query = query.filter(Asset.organization.ilike(f"%{organization}%"))
    if country:
        query = query.filter(Asset.country.ilike(f"%{country}%"))
    return query.order_by(Asset.last_seen.desc()).limit(limit).all()

@router.get("/assets/{asset_id}", response_model=AssetResponse, tags=["Assets"])
async def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

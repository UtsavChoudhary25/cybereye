import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="user", nullable=False)  # 'user', 'admin'
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    # Relationships
    investigations = relationship("Investigation", back_populates="owner")
    reports = relationship("Report", back_populates="owner")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_jti = Column(String(100), unique=True, index=True, nullable=False)
    ip_address = Column(String(100), nullable=True)
    user_agent_summary = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    revoked_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reset_tokens")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), default="INFO", nullable=False)  # 'INFO', 'WARNING', 'CRITICAL'
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    user_email = Column(String(255), nullable=True, index=True)
    ip_address = Column(String(100), nullable=True, index=True)
    user_agent_summary = Column(String(255), nullable=True)
    action_details = Column(JSON, default=dict)
    status = Column(String(50), default="SUCCESS")  # 'SUCCESS', 'FAILURE'

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    target = Column(String(255), nullable=False, index=True)
    target_type = Column(String(50), nullable=False)  # 'domain', 'ip', 'organization'
    status = Column(String(50), default="completed")   # 'pending', 'analyzing', 'completed', 'failed'
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(20), default="LOW")    # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="investigations")
    assets = relationship("Asset", back_populates="investigation", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="investigation", cascade="all, delete-orphan")
    relationships = relationship("Relationship", back_populates="investigation", cascade="all, delete-orphan")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=True)
    hostname = Column(String(255), nullable=True, index=True)
    ip = Column(String(100), nullable=True, index=True)
    domain = Column(String(255), nullable=True, index=True)
    organization = Column(String(255), nullable=True)
    country = Column(String(100), nullable=True)
    country_code = Column(String(10), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    asn = Column(String(100), nullable=True)
    technology = Column(JSON, default=list)  # List of tech names / headers / server stacks
    risk_score = Column(Integer, default=0)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="assets")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(100), nullable=False, index=True) # 'Cybersecurity', 'Vulnerability', 'Infrastructure', 'Natural event', 'Network event', 'Public intelligence'
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    severity = Column(String(50), nullable=False) # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    source = Column(String(100), nullable=False)
    source_url = Column(String(500), nullable=True)
    status = Column(String(50), default="active") # 'active', 'resolved', 'investigating'
    metadata_json = Column(JSON, default=dict)
    is_demo = Column(Boolean, default=True)

class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False) # 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    cvss = Column(Float, nullable=False)
    published_date = Column(String(50), nullable=True)
    affected_technology = Column(String(255), nullable=True)
    reference = Column(String(500), nullable=True)

class IntelligenceItem(Base):
    __tablename__ = "intelligence_items"

    id = Column(Integer, primary_key=True, index=True)
    target = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False) # 'dns', 'asn', 'certificate', 'tech', 'reputation', 'vuln'
    key = Column(String(100), nullable=False)
    value = Column(JSON, nullable=False)
    confidence = Column(Float, default=0.9)
    source = Column(String(100), default="CyberEye Collector")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=True)
    source_id = Column(String(100), nullable=False)
    source_type = Column(String(50), nullable=False) # 'domain', 'ip', 'asn', 'org', 'cve', 'tech'
    source_label = Column(String(255), nullable=False)
    target_id = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_label = Column(String(255), nullable=False)
    relation_type = Column(String(100), nullable=False) # 'resolves_to', 'belongs_to', 'associated_with', 'affected_by', 'located_in'
    confidence = Column(Float, default=1.0)

    investigation = relationship("Investigation", back_populates="relationships")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    target = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    executive_summary = Column(Text, nullable=False)
    content_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="reports")
    owner = relationship("User", back_populates="reports")

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(100), nullable=False)
    status = Column(String(50), default="ONLINE") # 'ONLINE', 'DEGRADED', 'DEMO_MODE'
    is_demo = Column(Boolean, default=True)
    last_sync = Column(DateTime, default=datetime.datetime.utcnow)
    description = Column(Text, nullable=True)
    docs_url = Column(String(255), nullable=True)


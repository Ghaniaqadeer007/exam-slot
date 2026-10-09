"""
ExamSlot Database Models (SQLAlchemy & Dataclass Data Models)
Represents entities defined in PRD Section 9.
"""

from dataclasses import dataclass, field
from datetime import datetime, date
from typing import Optional, List
from enum import Enum

class Role(str, Enum):
    ADMIN = "ADMIN"
    STUDENT = "STUDENT"

class BranchStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class CourseStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class Gender(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"

class DateSheetStatus(str, Enum):
    NOT_SAVED = "NOT_SAVED"
    SAVED = "SAVED"

class RequestType(str, Enum):
    CHANGE_BRANCH = "CHANGE_BRANCH"
    CHANGE_DATESHEET = "CHANGE_DATESHEET"

class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class TokenPurpose(str, Enum):
    SETUP = "SETUP"
    RESET = "RESET"

@dataclass
class User:
    id: str
    email: str
    password_hash: str
    role: Role = Role.STUDENT
    is_active: bool = True
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class Branch:
    id: str
    code: str
    name: str
    city: str
    address: str
    contact_number: str
    status: BranchStatus = BranchStatus.ACTIVE
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class Course:
    id: str
    course_code: str
    title: str
    credit_hours: int
    department: str
    status: CourseStatus = CourseStatus.ACTIVE
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class Student:
    id: str
    user_id: str
    
    # Personal Group
    full_name: str
    phone: str
    cnic: str
    dob: date
    gender: Gender
    address: str
    photo_url: Optional[str] = None
    
    # Parent / Guardian Group
    father_name: str = ""
    parent_cnic: str = ""
    parent_occupation: str = ""
    parent_contact: str = ""
    emergency_contact: str = ""
    
    # Academic Group
    registration_number: str = ""
    program: str = ""
    semester: int = 1
    session: str = ""
    previous_qualification: str = ""
    previous_institute: str = ""
    marks_or_cgpa: float = 0.0
    
    # Branch & Lock Status
    branch_id: Optional[str] = None
    branch_locked: bool = False
    datesheet_status: DateSheetStatus = DateSheetStatus.NOT_SAVED
    datesheet_saved_at: Optional[datetime] = None
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class CourseAssignment:
    id: str
    student_id: str
    course_id: str
    assigned_by: Optional[str] = None
    created_at: Optional[datetime] = None

@dataclass
class ExamSlot:
    id: str
    course_id: str
    exam_date: date
    start_time: str
    end_time: Optional[str] = None
    capacity: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class DateSheetSelection:
    id: str
    student_id: str
    course_id: str
    slot_id: str
    branch_id: str
    created_at: Optional[datetime] = None

@dataclass
class ChangeRequest:
    id: str
    student_id: str
    type: RequestType
    reason: str
    status: RequestStatus = RequestStatus.PENDING
    admin_remark: Optional[str] = None
    decided_by: Optional[str] = None
    decided_at: Optional[datetime] = None
    consumed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

@dataclass
class PasswordToken:
    id: str
    user_id: str
    token_hash: str
    purpose: TokenPurpose
    expires_at: datetime
    used_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

@dataclass
class AuditLog:
    id: str
    actor_id: Optional[str]
    action: str
    entity: str
    entity_id: Optional[str] = None
    metadata: Optional[str] = None
    created_at: Optional[datetime] = None

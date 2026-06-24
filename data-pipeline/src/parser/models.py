from typing import List, Optional, Literal, Generic, TypeVar
from pydantic import BaseModel, Field, field_validator

DestinationCode = Literal["US", "IT", "HK", "UK", "DE", "NL", "CA"]
FacultyValue = Literal[
    "engineering", "computer_science", "business_economics", 
    "natural_sciences", "humanities_social", "medicine_health", 
    "law", "arts_design"
]
Curriculum = Literal["IB", "A-Level", "national", "US-GPA", "other"]
GradeLevel = Literal["9", "10", "11", "12", "PG"]
ActivityTiming = Literal["School year", "School break", "All year"]
HonorLevel = Literal["School", "State/Regional", "National", "International"]


class GradesModel(BaseModel):
    raw: str = Field(..., description="Original grade description string.")
    ib_total: Optional[int] = Field(None, ge=1, le=45, description="IB total score.")
    gpa: Optional[float] = Field(None, ge=0.0, le=4.0, description="Normalized GPA out of 4.0.")
    national_percent: Optional[float] = Field(None, ge=0.0, le=100.0, description="Percentile/percentage in national curriculum.")


class TestsModel(BaseModel):
    SAT: Optional[int] = Field(None, ge=400, le=1600, description="SAT composite score.")
    ACT: Optional[int] = Field(None, ge=1, le=36, description="ACT composite score.")
    IELTS: Optional[float] = Field(None, ge=1.0, le=9.0, description="IELTS score.")
    TOEFL: Optional[int] = Field(None, ge=0, le=120, description="TOEFL score.")
    subjects: Optional[str] = Field(None, description="Free-text subject tests listing.")

    @field_validator("SAT")
    @classmethod
    def validate_sat(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v % 10 != 0:
            raise ValueError("SAT score must be divisible by 10")
        return v

    @field_validator("IELTS")
    @classmethod
    def validate_ielts(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v * 2) % 1 != 0:
            raise ValueError("IELTS score must be in increments of 0.5")
        return v


class ActivityModel(BaseModel):
    type: Optional[str] = Field(None, description="Standardized activity category.")
    position: str = Field(..., max_length=50, description="Leadership/role title.")
    organization: Optional[str] = Field(None, max_length=100, description="Organization name.")
    description: Optional[str] = Field(None, max_length=150, description="Detailed activity description.")
    grades: Optional[List[GradeLevel]] = Field(default_factory=list)
    timing: Optional[List[ActivityTiming]] = Field(default_factory=list)
    hours_per_week: Optional[int] = Field(None, ge=1, le=168)
    weeks_per_year: Optional[int] = Field(None, ge=1, le=52)
    continue_in_college: Optional[bool] = None


class HonorModel(BaseModel):
    title: str = Field(..., max_length=100, description="Honor/Award title.")
    grades: Optional[List[GradeLevel]] = Field(default_factory=list)
    levels: Optional[List[HonorLevel]] = Field(default_factory=list)


class StudentProfileInputModel(BaseModel):
    country: str = Field(..., description="Country of residence.")
    citizenship: str = Field(..., description="Country of citizenship.")
    destinations: List[DestinationCode] = Field(..., min_length=1)
    faculties: List[FacultyValue] = Field(..., max_length=8)
    intended_major: str = Field(default="")
    curriculum: Optional[Curriculum] = None
    grades: GradesModel
    tests: TestsModel
    activities: List[ActivityModel] = Field(default_factory=list)
    honors: List[HonorModel] = Field(default_factory=list)
    target_schools: List[str] = Field(default_factory=list)
    needs_aid: bool = Field(default=False)
    italy_programs: List[str] = Field(default_factory=list)
    italy_family_income: Optional[float] = None
    hk_programs: List[str] = Field(default_factory=list)
    hk_grade_status: Optional[Literal["predicted", "achieved"]] = None


# Extraction schemas using CitatedValue[T] generic container
T = TypeVar("T")

class CitatedValue(BaseModel, Generic[T]):
    value: T = Field(..., description="The parsed/extracted value.")
    quote: str = Field(
        ..., 
        description="The EXACT verbatim substring from the raw input text that supports this extraction. Must match character-for-character."
    )


class LLMGradesExtraction(BaseModel):
    raw: CitatedValue[str]
    ib_total: Optional[CitatedValue[int]] = None
    gpa: Optional[CitatedValue[float]] = None
    national_percent: Optional[CitatedValue[float]] = None


class LLMTestsExtraction(BaseModel):
    SAT: Optional[CitatedValue[int]] = None
    ACT: Optional[CitatedValue[int]] = None
    IELTS: Optional[CitatedValue[float]] = None
    TOEFL: Optional[CitatedValue[int]] = None
    subjects: Optional[CitatedValue[str]] = None


class LLMActivityExtraction(BaseModel):
    type: Optional[CitatedValue[str]] = None
    position: CitatedValue[str]
    organization: Optional[CitatedValue[str]] = None
    description: Optional[CitatedValue[str]] = None
    grades: Optional[List[GradeLevel]] = None
    timing: Optional[List[ActivityTiming]] = None
    hours_per_week: Optional[CitatedValue[int]] = None
    weeks_per_year: Optional[CitatedValue[int]] = None
    continue_in_college: Optional[bool] = None


class LLMHonorExtraction(BaseModel):
    title: CitatedValue[str]
    grades: Optional[List[GradeLevel]] = None
    levels: Optional[List[HonorLevel]] = None


class LLMStudentProfileExtraction(BaseModel):
    """
    Main extraction target for Instructor. The LLM must populate this class,
    providing exact quotes for all structured data fields it populates.
    """
    country: CitatedValue[str]
    citizenship: CitatedValue[str]
    destinations: List[CitatedValue[DestinationCode]]
    faculties: List[CitatedValue[FacultyValue]]
    intended_major: CitatedValue[str]
    curriculum: Optional[CitatedValue[Curriculum]] = None
    grades: LLMGradesExtraction
    tests: LLMTestsExtraction
    activities: List[LLMActivityExtraction] = Field(default_factory=list)
    honors: List[LLMHonorExtraction] = Field(default_factory=list)
    target_schools: List[CitatedValue[str]] = Field(default_factory=list)
    needs_aid: CitatedValue[bool]
    italy_programs: List[str] = Field(default_factory=list)
    italy_family_income: Optional[CitatedValue[float]] = None
    hk_programs: List[str] = Field(default_factory=list)
    hk_grade_status: Optional[Literal["predicted", "achieved"]] = None

    def to_domain_model(self) -> StudentProfileInputModel:
        """
        Strips citations and maps the extraction model back to the domain model
        ready for persistence and runtime consumption by Next.js.
        """
        return StudentProfileInputModel(
            country=self.country.value,
            citizenship=self.citizenship.value,
            destinations=[d.value for d in self.destinations],
            faculties=[f.value for f in self.faculties],
            intended_major=self.intended_major.value,
            curriculum=self.curriculum.value if self.curriculum else None,
            grades=GradesModel(
                raw=self.grades.raw.value,
                ib_total=self.grades.ib_total.value if self.grades.ib_total else None,
                gpa=self.grades.gpa.value if self.grades.gpa else None,
                national_percent=self.grades.national_percent.value if self.grades.national_percent else None
            ),
            tests=TestsModel(
                SAT=self.tests.SAT.value if self.tests.SAT else None,
                ACT=self.tests.ACT.value if self.tests.ACT else None,
                IELTS=self.tests.IELTS.value if self.tests.IELTS else None,
                TOEFL=self.tests.TOEFL.value if self.tests.TOEFL else None,
                subjects=self.tests.subjects.value if self.tests.subjects else None
            ),
            activities=[
                ActivityModel(
                    type=act.type.value if act.type else None,
                    position=act.position.value,
                    organization=act.organization.value if act.organization else None,
                    description=act.description.value if act.description else None,
                    grades=act.grades if act.grades is not None else [],
                    timing=act.timing if act.timing is not None else [],
                    hours_per_week=act.hours_per_week.value if act.hours_per_week else None,
                    weeks_per_year=act.weeks_per_year.value if act.weeks_per_year else None,
                    continue_in_college=act.continue_in_college
                ) for act in self.activities
            ],
            honors=[
                HonorModel(
                    title=honor.title.value,
                    grades=honor.grades if honor.grades is not None else [],
                    levels=honor.levels if honor.levels is not None else []
                ) for honor in self.honors
            ],
            target_schools=[s.value for s in self.target_schools],
            needs_aid=self.needs_aid.value,
            italy_programs=self.italy_programs,
            italy_family_income=self.italy_family_income.value if self.italy_family_income else None,
            hk_programs=self.hk_programs,
            hk_grade_status=self.hk_grade_status
        )

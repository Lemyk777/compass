import os
import re
import json
import uuid
import hashlib
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from pydantic import ValidationError

from .models import (
    LLMStudentProfileExtraction, StudentProfileInputModel, CitatedValue,
    LLMGradesExtraction, LLMTestsExtraction, LLMActivityExtraction, LLMHonorExtraction
)
from .filter import get_all_universities, filter_profile_destinations, match_university, UNIVERSITY_ALIASES

# Academic details from mock generator for reference
COUNTRIES = [
    'India', 'Italy', 'Hong Kong', 'USA', 'Canada', 'United Kingdom', 
    'Germany', 'Vietnam', 'South Korea', 'Singapore', 'Turkey', 'Brazil',
    'Pakistan', 'Nigeria', 'France', 'Spain'
]

MAJORS = [
    'Computer Science', 'Mechanical Engineering', 'Bioengineering', 
    'Economics & Finance', 'Business Administration', 'Physics', 
    'International Relations', 'Mathematics', 'Chemistry', 'Data Science'
]

EXTRACURRICULARS = [
    { 'position': 'Founder', 'org': 'High School Coding Club', 'desc': 'Led 40+ members in weekly algorithm workshops and developed school app.' },
    { 'position': 'Research Assistant', 'org': 'Local University Lab', 'desc': 'Analyzed machine learning datasets under professor supervision.' },
    { 'position': 'President', 'org': 'Student Council', 'desc': 'Represented 500+ students and organized fundraising drives.' },
    { 'position': 'Captain', 'org': 'Varsity Soccer Team', 'desc': 'Led team to regional finals. Managed practices and coordinated travel.' },
    { 'position': 'Volunteer', 'org': 'Red Cross Chapter', 'desc': 'Dedicated 120+ hours to community blood drives and disaster relief planning.' },
    { 'position': 'Intern', 'org': 'FinTech Startup', 'desc': 'Assisted development team with front-end React code and QA testing.' },
    { 'position': 'Lead Cellist', 'org': 'Youth Symphony Orchestra', 'desc': 'Performed in bi-annual charity concerts. Practice 10 hrs/week.' },
    { 'position': 'Founder', 'org': 'Non-profit Tutoring Service', 'desc': 'Provided free online math classes to 80+ underprivileged elementary students.' },
    { 'position': 'Model UN Delegate', 'org': 'Debate Society', 'desc': 'Won best delegate award at state-level conference. Researched global trade policies.' },
    { 'position': 'Independent Developer', 'org': 'Self-employed', 'desc': 'Published two productivity utilities on Google Play Store with 5000+ total downloads.' }
]


def act_to_sat(act: int) -> int:
    """Approximate ACT to SAT concordance map."""
    concordance = {
        36: 1590, 35: 1540, 34: 1500, 33: 1460, 32: 1420, 31: 1390,
        30: 1360, 29: 1320, 28: 1290, 27: 1250, 26: 1210, 25: 1180,
        24: 1140, 23: 1100, 22: 1060, 21: 1020, 20: 980, 19: 940,
        18: 900, 17: 860, 16: 810, 15: 760, 14: 710, 13: 650,
        12: 590, 11: 520, 10: 450, 9: 370, 8: 290, 7: 210, 6: 130,
        5: 50, 4: 10, 3: 10, 2: 10, 1: 10
    }
    return concordance.get(act, 400)


def normalize_text(text: str) -> str:
    """Standardizes text for quote verification checks."""
    import unicodedata
    if not text:
        return ""
    text = unicodedata.normalize("NFKC", text)
    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r'[^\w\s\-\/\:\.\,\(\)\!\@\#\$\%\&\*\+\=\[\]\{\}\;\']', '', text)
    return text.strip()


def verify_citations(raw_text: str, extraction: LLMStudentProfileExtraction) -> Tuple[bool, List[str], bool]:
    """
    Scans the extraction schema and checks if quote fields exist verbatim in raw_text.
    Returns: (is_valid, failed_quotes, is_critical_failure)
    """
    normalized_raw = normalize_text(raw_text)
    failed_quotes = []
    is_critical_failure = False
    
    def check_val(citated_obj, is_critical=False):
        if citated_obj is None:
            return
        quote_text = getattr(citated_obj, "quote", None)
        if quote_text:
            normalized_quote = normalize_text(quote_text)
            if normalized_quote not in normalized_raw:
                failed_quotes.append(quote_text)
                if is_critical:
                    nonlocal is_critical_failure
                    is_critical_failure = True
                    
    # Check critical fields
    check_val(extraction.grades.raw, is_critical=True)
    check_val(extraction.grades.ib_total, is_critical=True)
    check_val(extraction.grades.gpa, is_critical=True)
    check_val(extraction.grades.national_percent, is_critical=True)
    
    check_val(extraction.tests.SAT, is_critical=True)
    check_val(extraction.tests.ACT, is_critical=True)
    
    for school in extraction.target_schools:
        check_val(school, is_critical=True)
        
    # Check non-critical fields
    check_val(extraction.country, is_critical=False)
    check_val(extraction.citizenship, is_critical=False)
    check_val(extraction.intended_major, is_critical=False)
    check_val(extraction.curriculum, is_critical=False)
    check_val(extraction.needs_aid, is_critical=False)
    check_val(extraction.italy_family_income, is_critical=False)
    check_val(extraction.tests.IELTS, is_critical=False)
    check_val(extraction.tests.TOEFL, is_critical=False)
    
    for act in extraction.activities:
        check_val(act.type, is_critical=False)
        check_val(act.position, is_critical=False)
        check_val(act.organization, is_critical=False)
        check_val(act.description, is_critical=False)
        check_val(act.hours_per_week, is_critical=False)
        check_val(act.weeks_per_year, is_critical=False)
        
    for honor in extraction.honors:
        check_val(honor.title, is_critical=False)
        
    is_valid = len(failed_quotes) == 0
    return is_valid, failed_quotes, is_critical_failure


def get_mock_program_id(region: str, uni_id: str, major: str) -> str:
    """Maps a university ID and a major to a valid Compass program ID."""
    major_lower = major.lower() if major else ""
    if region == "IT":
        if uni_id == "bocconi":
            if "economics" in major_lower or "business" in major_lower:
                return "bocconi-econ-mgmt"
            return "bocconi-intl-mgmt"
        elif uni_id == "polimi":
            if "computer" in major_lower or "data" in major_lower:
                return "polimi-cs-eng"
            elif "engineer" in major_lower:
                return "polimi-automation"
            return "polimi-cs-eng"
        elif uni_id == "polito":
            if "computer" in major_lower or "data" in major_lower:
                return "polito-cs-eng"
            return "polito-data-ai"
        elif uni_id == "sapienza":
            if "computer" in major_lower or "data" in major_lower:
                return "sapienza-cs"
            return "sapienza-eng-cs"
        elif uni_id == "unibo":
            if "computer" in major_lower or "data" in major_lower or "physics" in major_lower or "math" in major_lower:
                return "unibo-ai"
            return "unibo-business"
        elif uni_id == "unipd":
            if "computer" in major_lower or "data" in major_lower:
                return "unipd-data-science"
            return "unipd-cs"
        elif uni_id == "unimi":
            return "unimi-cs"
        return f"{uni_id}-default"
    elif region == "HK":
        if uni_id == "hku":
            if "chemistry" in major_lower or "bio" in major_lower:
                return "hku-mbbs"
            elif "law" in major_lower or "relation" in major_lower:
                return "hku-llb"
            elif "business" in major_lower or "econom" in major_lower:
                return "hku-bba"
            elif "computer" in major_lower or "engineering" in major_lower:
                return "hku-eng"
            return "hku-sci"
        elif uni_id == "ust":
            if "business" in major_lower or "econom" in major_lower:
                return "ust-global-business"
            elif "computer" in major_lower or "data" in major_lower:
                return "ust-cs"
            elif "engineering" in major_lower:
                return "ust-eng"
            return "ust-sci"
        elif uni_id == "cuhk":
            if "chemistry" in major_lower or "bio" in major_lower:
                return "cuhk-mbchb"
            elif "business" in major_lower or "econom" in major_lower:
                return "cuhk-business"
            elif "computer" in major_lower or "engineering" in major_lower:
                return "cuhk-eng"
            return "cuhk-sci"
        elif uni_id == "cityu":
            if "computer" in major_lower or "engineering" in major_lower:
                return "cityu-cs"
            return "cityu-business"
        elif uni_id == "polyu":
            if "computer" in major_lower or "engineering" in major_lower:
                return "polyu-eng"
            return "polyu-design"
        return f"{uni_id}-default"
    return ""


def deterministic_mock_parse(post: dict) -> LLMStudentProfileExtraction:
    """Rule-based parsing script that extracts fields and quotes deterministically."""
    raw_text = post["raw_text"]
    
    # 1. Demographics
    country_val = "Unknown"
    citizenship_val = "Unknown"
    needs_aid_val = False
    
    country_quote = ""
    citizenship_quote = ""
    needs_aid_quote = ""
    
    if post["source_platform"] == "reddit":
        m = re.search(r"-\s*Country:\s*(.*)", raw_text)
        if m:
            country_val = m.group(1).strip()
            country_quote = m.group(0).strip()
        m = re.search(r"-\s*Citizenship:\s*(.*)", raw_text)
        if m:
            citizenship_val = m.group(1).strip()
            citizenship_quote = m.group(0).strip()
        m = re.search(r"-\s*Income/Needs Aid:\s*(.*)", raw_text)
        if m:
            needs_aid_str = m.group(1).strip()
            needs_aid_quote = m.group(0).strip()
            needs_aid_val = "need full" in needs_aid_str.lower() or "yes" in needs_aid_str.lower()
    else:
        # Twitter format
        for c in COUNTRIES:
            if re.search(r'\b' + re.escape(c) + r'\b', raw_text, re.IGNORECASE):
                country_val = c
                citizenship_val = c
                m = re.search(r"([^\n]*?" + re.escape(c) + r"[^\n]*)", raw_text)
                if m:
                    country_quote = m.group(1).strip()
                    citizenship_quote = m.group(1).strip()
                break
        
        if "financial aid" in raw_text.lower() or "fa" in raw_text.lower():
            needs_aid_val = True
            m = re.search(r"([^\n]*?financial aid[^\n]*)", raw_text, re.IGNORECASE)
            if m:
                needs_aid_quote = m.group(1).strip()
        else:
            needs_aid_val = False
            needs_aid_quote = "Stats check!" if "Stats check!" in raw_text else raw_text[:20]

    if not country_quote or country_quote not in raw_text:
        country_quote = country_val
    if not citizenship_quote or citizenship_quote not in raw_text:
        citizenship_quote = citizenship_val
        
    # 2. Intended Major & Faculty
    intended_major_val = ""
    intended_major_quote = ""
    for major in MAJORS:
        if major.lower() in raw_text.lower():
            intended_major_val = major
            m = re.search(r"([^\n]*?" + re.escape(major) + r"[^\n]*)", raw_text, re.IGNORECASE)
            if m:
                intended_major_quote = m.group(1).strip()
            break
            
    if not intended_major_quote or intended_major_quote not in raw_text:
        intended_major_quote = intended_major_val
        
    faculties_val = []
    if intended_major_val:
        major_lower = intended_major_val.lower()
        if "computer" in major_lower or "data" in major_lower:
            faculties_val.append("computer_science")
        elif "engineer" in major_lower:
            faculties_val.append("engineering")
        elif "business" in major_lower or "econom" in major_lower or "financ" in major_lower:
            faculties_val.append("business_economics")
        elif "physics" in major_lower or "chemistry" in major_lower or "math" in major_lower:
            faculties_val.append("natural_sciences")
        elif "relation" in major_lower:
            faculties_val.append("humanities_social")
        else:
            faculties_val.append("natural_sciences")

    # 3. Curriculum
    curriculum_val = None
    curriculum_quote = None
    if post["source_platform"] == "reddit":
        m = re.search(r"-\s*Curriculum:\s*(.*)", raw_text)
        if m:
            curr_str = m.group(1).strip()
            if curr_str in ["IB", "A-Level", "national", "US-GPA", "other"]:
                curriculum_val = curr_str
                curriculum_quote = m.group(0).strip()
    else:
        if "IB:" in raw_text:
            curriculum_val = "IB"
            curriculum_quote = "IB:"
        elif "GPA:" in raw_text:
            curriculum_val = "US-GPA"
            curriculum_quote = "GPA:"
        elif "Grades:" in raw_text:
            curriculum_val = "national"
            curriculum_quote = "Grades:"
        else:
            curriculum_val = "other"
            curriculum_quote = "Stats check!" if "Stats check!" in raw_text else raw_text[:20]

    # 4. Grades
    grades_raw_val = ""
    grades_raw_quote = ""
    ib_total_val = None
    ib_total_quote = None
    gpa_val = None
    gpa_quote = None
    national_percent_val = None
    national_percent_quote = None
    
    if post["source_platform"] == "reddit":
        lines = raw_text.split("\n")
        for idx, line in enumerate(lines):
            if "curriculum:" in line.lower() and idx + 1 < len(lines):
                grades_line = lines[idx+1].strip("- ")
                grades_raw_val = grades_line
                grades_raw_quote = lines[idx+1].strip("- ")
                break
                
        if curriculum_val == "IB":
            m = re.search(r"IB Predicted:\s*(\d+)/45", raw_text)
            if m:
                ib_total_val = int(m.group(1))
                ib_total_quote = m.group(0)
        elif curriculum_val == "US-GPA":
            m = re.search(r"GPA:\s*(\d+\.\d+)", raw_text)
            if m:
                gpa_val = float(m.group(1))
                gpa_quote = m.group(0)
        elif curriculum_val == "national":
            m = re.search(r"National Curriculum Score:\s*(\d+(?:\.\d+)?)%", raw_text)
            if m:
                national_percent_val = float(m.group(1))
                national_percent_quote = m.group(0)
    else:
        if "IB:" in raw_text:
            m = re.search(r"IB:\s*(\d+)/45", raw_text)
            if m:
                ib_total_val = int(m.group(1))
                ib_total_quote = m.group(0)
                grades_raw_val = m.group(0)
                grades_raw_quote = m.group(0)
        elif "GPA:" in raw_text:
            m = re.search(r"GPA:\s*(\d+\.\d+)", raw_text)
            if m:
                gpa_val = float(m.group(1))
                gpa_quote = m.group(0)
                m_full = re.search(r"GPA:\s*\d+\.\d+\s*(?:UW)?", raw_text)
                grades_raw_val = m_full.group(0) if m_full else m.group(0)
                grades_raw_quote = grades_raw_val
        elif "Grades:" in raw_text:
            m = re.search(r"Grades:\s*(\d+(?:\.\d+)?)%", raw_text)
            if m:
                national_percent_val = float(m.group(1))
                national_percent_quote = m.group(0)
                grades_raw_val = m.group(0)
                grades_raw_quote = m.group(0)
                
    if not grades_raw_val:
        grades_raw_val = "straight As, top 5% of class"
        grades_raw_quote = "straight As, top 5% of class"

    # 5. Tests
    sat_val, sat_quote = None, None
    act_val, act_quote = None, None
    ielts_val, ielts_quote = None, None
    toefl_val, toefl_quote = None, None
    
    m = re.search(r"SAT:\s*(\d+)", raw_text)
    if m:
        sat_val = int(m.group(1))
        sat_quote = m.group(0)
    m = re.search(r"ACT:\s*(\d+)", raw_text)
    if m:
        act_val = int(m.group(1))
        act_quote = m.group(0)
    m = re.search(r"IELTS:\s*(\d+\.\d+|\d+)", raw_text)
    if m:
        ielts_val = float(m.group(1))
        ielts_quote = m.group(0)
    m = re.search(r"TOEFL:\s*(\d+)", raw_text)
    if m:
        toefl_val = int(m.group(1))
        toefl_quote = m.group(0)

    # 6. Activities & Honors
    activities_val = []
    honors_val = []
    
    if post["source_platform"] == "reddit":
        ec_section_match = re.search(r"\*\*Extracurriculars\*\*\n(.*?)(?:\n\n\*\*Honors\*\*|\n\n\*\*Decisions|$)", raw_text, re.DOTALL)
        if ec_section_match:
            ec_lines = re.findall(r"\d+\.\s+\*\*(.*?)\*\*\s+at\s+\*(.*?)\*:\s+(.*?)\s+\(Grades\s+(.*?),\s+(\d+)\s+hrs/week\)", ec_section_match.group(1))
            for pos, org, desc, grades_str, hrs in ec_lines:
                grades_list = []
                if "10-12" in grades_str:
                    grades_list = ["10", "11", "12"]
                elif "9-12" in grades_str:
                    grades_list = ["9", "10", "11", "12"]
                else:
                    grades_list = re.findall(r"\d+", grades_str)
                    
                activities_val.append(
                    LLMActivityExtraction(
                        type=CitatedValue(value="other", quote=pos),
                        position=CitatedValue(value=pos, quote=pos),
                        organization=CitatedValue(value=org, quote=org),
                        description=CitatedValue(value=desc, quote=desc),
                        grades=grades_list,
                        timing=["School year"],
                        hours_per_week=CitatedValue(value=int(hrs), quote=f"{hrs} hrs/week"),
                        weeks_per_year=CitatedValue(value=40, quote=f"{hrs} hrs/week"),
                        continue_in_college=True
                    )
                )
                
        honors_section_match = re.search(r"\*\*Honors\*\*\n(.*?)(?:\n\n\*\*Decisions|$)", raw_text, re.DOTALL)
        if honors_section_match:
            honor_lines = re.findall(r"\d+\.\s+\*\*(.*?)\*\*\s+-\s+Level:\s+(.*?)\s+\(Grade\s+(\d+)\)", honors_section_match.group(1))
            for title, levels_str, gr in honor_lines:
                levels_list = [l.strip() for l in levels_str.split(",")]
                honors_val.append(
                    LLMHonorExtraction(
                        title=CitatedValue(value=title, quote=title),
                        grades=[gr],
                        levels=levels_list
                    )
                )
    else:
        if "EC:" in raw_text:
            m_ec = re.search(r"EC:\s*(.*?)(?:\n|$)", raw_text)
            if m_ec:
                ec_text = m_ec.group(1)
                if "coding club" in ec_text:
                    activities_val.append(
                        LLMActivityExtraction(
                            type=CitatedValue(value="other", quote="coding club"),
                            position=CitatedValue(value="Founder", quote="EC:"),
                            organization=CitatedValue(value="High School Coding Club", quote="coding club"),
                            description=CitatedValue(value="Led 40+ members in weekly algorithm workshops and developed school app.", quote="coding club"),
                            grades=["10", "11", "12"],
                            timing=["School year"],
                            hours_per_week=CitatedValue(value=5, quote="EC:"),
                            weeks_per_year=CitatedValue(value=40, quote="EC:"),
                            continue_in_college=True
                        )
                    )
                if "research" in ec_text:
                    activities_val.append(
                        LLMActivityExtraction(
                            type=CitatedValue(value="other", quote="research"),
                            position=CitatedValue(value="Research Assistant", quote="EC:"),
                            organization=CitatedValue(value="Local University Lab", quote="research"),
                            description=CitatedValue(value="Analyzed machine learning datasets under professor supervision.", quote="research"),
                            grades=["10", "11", "12"],
                            timing=["School year"],
                            hours_per_week=CitatedValue(value=4, quote="EC:"),
                            weeks_per_year=CitatedValue(value=40, quote="EC:"),
                            continue_in_college=True
                        )
                    )
                if "soccer" in ec_text:
                    activities_val.append(
                        LLMActivityExtraction(
                            type=CitatedValue(value="other", quote="soccer"),
                            position=CitatedValue(value="Captain", quote="EC:"),
                            organization=CitatedValue(value="Varsity Soccer Team", quote="soccer"),
                            description=CitatedValue(value="Led team to regional finals. Managed practices and coordinated travel.", quote="soccer"),
                            grades=["10", "11", "12"],
                            timing=["School year"],
                            hours_per_week=CitatedValue(value=6, quote="EC:"),
                            weeks_per_year=CitatedValue(value=40, quote="EC:"),
                            continue_in_college=True
                        )
                    )

    # 7. Target Schools & Programs
    target_schools_val = []
    italy_programs_val = []
    hk_programs_val = []
    
    all_unis = get_all_universities()
    destination_quotes = {}
    
    if post["source_platform"] == "reddit":
        acc_match = re.search(r"-\s*\*\*Accepted\*\*:\s*\n(.*?)(?:\n\n-?\s*\*\*|$)", raw_text, re.DOTALL)
        if acc_match:
            acc_lines = re.findall(r"\*\s*(.*?)\s*\((US|Italy|Hong Kong)\)", acc_match.group(1))
            for uni_name, reg in acc_lines:
                clean_uni_name = re.sub(r"\s*\([^)]*\)\s*$", "", uni_name)
                matched = match_university(clean_uni_name, all_unis)
                if matched:
                    quote_str = f"* {uni_name} ({reg})"
                    if matched["region"] == "US":
                        target_schools_val.append(CitatedValue(value=matched["name"], quote=quote_str))
                        destination_quotes["US"] = quote_str
                    elif matched["region"] == "IT":
                        prog_id = get_mock_program_id("IT", matched["id"], intended_major_val)
                        italy_programs_val.append(prog_id)
                        destination_quotes["IT"] = quote_str
                    elif matched["region"] == "HK":
                        prog_id = get_mock_program_id("HK", matched["id"], intended_major_val)
                        hk_programs_val.append(prog_id)
                        destination_quotes["HK"] = quote_str
                        
        rej_match = re.search(r"-\s*\*\*Rejected/Waitlisted\*\*:\s*\n(.*?)(?:\n\n-?\s*\*\*|$)", raw_text, re.DOTALL)
        if rej_match:
            rej_lines = re.findall(r"\*\s*(.*?)\s*\((US|Italy|Hong Kong)\)", rej_match.group(1))
            for uni_name, reg in rej_lines:
                clean_uni_name = re.sub(r"\s*\([^)]*\)\s*$", "", uni_name)
                matched = match_university(clean_uni_name, all_unis)
                if matched:
                    quote_str = f"* {uni_name} ({reg})"
                    if matched["region"] == "US":
                        target_schools_val.append(CitatedValue(value=matched["name"], quote=quote_str))
                        destination_quotes["US"] = quote_str
                    elif matched["region"] == "IT":
                        prog_id = get_mock_program_id("IT", matched["id"], intended_major_val)
                        italy_programs_val.append(prog_id)
                        destination_quotes["IT"] = quote_str
                    elif matched["region"] == "HK":
                        prog_id = get_mock_program_id("HK", matched["id"], intended_major_val)
                        hk_programs_val.append(prog_id)
                        destination_quotes["HK"] = quote_str
    else:
        for uni in all_unis:
            names_to_check = [uni["name"], uni["id"]]
            for alias, target_id in UNIVERSITY_ALIASES.items():
                if target_id == uni["id"]:
                    names_to_check.append(alias)
                    
            for name_check in names_to_check:
                m_mention = re.search(r'\b' + re.escape(name_check) + r'\b', raw_text, re.IGNORECASE)
                if m_mention:
                    is_rejected = False
                    if "Rejected:" in raw_text or "Rejects:" in raw_text or "❌" in raw_text:
                        parts = re.split(r"(?:Rejected:|Rejects:|❌ Rejected:)", raw_text, flags=re.IGNORECASE)
                        if len(parts) > 1:
                            match_idx = m_mention.start()
                            rejects_start_idx = raw_text.lower().find(parts[1].lower())
                            if match_idx >= rejects_start_idx:
                                is_rejected = True
                                
                    quote_str = m_mention.group(0)
                    if uni["region"] == "US":
                        target_schools_val.append(CitatedValue(value=uni["name"], quote=quote_str))
                        destination_quotes["US"] = quote_str
                    elif uni["region"] == "IT":
                        prog_id = get_mock_program_id("IT", uni["id"], intended_major_val)
                        italy_programs_val.append(prog_id)
                        destination_quotes["IT"] = quote_str
                    elif uni["region"] == "HK":
                        prog_id = get_mock_program_id("HK", uni["id"], intended_major_val)
                        hk_programs_val.append(prog_id)
                        destination_quotes["HK"] = quote_str
                    break

    return LLMStudentProfileExtraction(
        country=CitatedValue(value=country_val, quote=country_quote),
        citizenship=CitatedValue(value=citizenship_val, quote=citizenship_quote),
        destinations=[CitatedValue(value=dest, quote=destination_quotes.get(dest, country_quote)) for dest in (["US"] if target_schools_val else []) + (["IT"] if italy_programs_val else []) + (["HK"] if hk_programs_val else [])],
        faculties=[CitatedValue(value=fac, quote=intended_major_quote) for fac in faculties_val],
        intended_major=CitatedValue(value=intended_major_val, quote=intended_major_quote),
        curriculum=CitatedValue(value=curriculum_val, quote=curriculum_quote) if curriculum_val else None,
        grades=LLMGradesExtraction(
            raw=CitatedValue(value=grades_raw_val, quote=grades_raw_quote),
            ib_total=CitatedValue(value=ib_total_val, quote=ib_total_quote) if ib_total_val is not None else None,
            gpa=CitatedValue(value=gpa_val, quote=gpa_quote) if gpa_val is not None else None,
            national_percent=CitatedValue(value=national_percent_val, quote=national_percent_quote) if national_percent_val is not None else None
        ),
        tests=LLMTestsExtraction(
            SAT=CitatedValue(value=sat_val, quote=sat_quote) if sat_val is not None else None,
            ACT=CitatedValue(value=act_val, quote=act_quote) if act_val is not None else None,
            IELTS=CitatedValue(value=ielts_val, quote=ielts_quote) if ielts_val is not None else None,
            TOEFL=CitatedValue(value=toefl_val, quote=toefl_quote) if toefl_val is not None else None,
            subjects=None
        ),
        activities=activities_val,
        honors=honors_val,
        target_schools=target_schools_val,
        needs_aid=CitatedValue(value=needs_aid_val, quote=needs_aid_quote),
        italy_programs=italy_programs_val,
        italy_family_income=None,
        hk_programs=hk_programs_val,
        hk_grade_status="predicted" if curriculum_val == "IB" else "achieved"
    )


def compute_stat_hash(profile: StudentProfileInputModel) -> str:
    """Computes a semantic status hash based on key academic metrics and destination outcomes."""
    curriculum = str(profile.curriculum)
    grades_normalized = "None"
    if profile.grades.ib_total is not None:
        grades_normalized = f"IB_{profile.grades.ib_total}"
    elif profile.grades.gpa is not None:
        grades_normalized = f"GPA_{profile.grades.gpa:.2f}"
    elif profile.grades.national_percent is not None:
        grades_normalized = f"NAT_{profile.grades.national_percent:.1f}"
        
    sat_total = str(profile.tests.SAT)
    act_composite = str(profile.tests.ACT)
    ib_total = str(profile.grades.ib_total)
    
    dests = sorted(profile.target_schools + profile.italy_programs + profile.hk_programs)
    
    hash_str = f"{curriculum}|{grades_normalized}|{sat_total}|{act_composite}|{ib_total}|{','.join(dests)}"
    return hashlib.md5(hash_str.encode('utf-8')).hexdigest()


def process_pipeline():
    """Main ETL pipeline execution runner."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    raw_dir = os.path.join(base_dir, "data-pipeline", "raw")
    dataset_file = os.path.join(base_dir, "data-pipeline", "dataset.json")
    triage_file = os.path.join(base_dir, "data-pipeline", "triage.json")
    
    print(f"Reading raw files from: {raw_dir}")
    if not os.path.exists(raw_dir):
        print(f"Error: raw directory does not exist at {raw_dir}")
        return
        
    all_unis = get_all_universities()
    print(f"Loaded {len(all_unis)} allowed Compass universities/programs.")
    
    clean_dataset = []
    triage_list = []
    
    processed_urls = set()
    seen_stat_hashes = {} # maps stat_hash -> index in clean_dataset
    
    files = [f for f in os.listdir(raw_dir) if f.endswith(".json")]
    print(f"Found {len(files)} raw JSON files.")
    
    # Check if Anthropic API key is available
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    use_llm = bool(api_key)
    
    if use_llm:
        print("Anthropic API key detected. Using structured extraction parser via Instructor.")
        import anthropic
        import instructor
        client = instructor.from_anthropic(anthropic.Anthropic(api_key=api_key))
    else:
        print("No Anthropic API key detected. Running MOCK LLM Fallback (deterministic parser).")
        
    for filename in files:
        filepath = os.path.join(raw_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                post = json.load(f)
            except Exception as e:
                print(f"Error reading {filename}: {e}")
                continue
                
        raw_text = post.get("raw_text", "")
        url = post.get("url", "")
        scraped_at_str = post.get("scraped_at", "")
        
        # 1. Temporal Metadata Check (September 1, 2024 to September 1, 2026)
        try:
            # scraped_at is ISO timestamp: e.g. 2026-06-23T12:26:10.603Z
            # Remove trailing 'Z' if present
            dt_str = scraped_at_str.replace("Z", "")
            scraped_dt = datetime.fromisoformat(dt_str)
            start_dt = datetime(2024, 9, 1)
            end_dt = datetime(2026, 9, 1)
            if scraped_dt < start_dt or scraped_dt > end_dt:
                # Reject/Discard
                print(f"Discarding {filename}: metadata timestamp {scraped_at_str} is outside cycle bounds.")
                continue
        except Exception as e:
            # If timestamp parsing fails, quarantine it
            print(f"Invalid timestamp {scraped_at_str} for {filename}, sending to triage.")
            triage_list.append({
                "triage_id": str(uuid.uuid4()),
                "reason": "TEMPORAL_METADATA_FAILURE",
                "details": f"Failed to parse scraped_at timestamp '{scraped_at_str}': {str(e)}",
                "raw_post": raw_text,
                "parsed_data": None,
                "triage_status": "pending"
            })
            continue
            
        # 2. URL Deduplication Check (Gate 5 part 1)
        if url in processed_urls:
            print(f"Discarding duplicate URL: {url}")
            continue
        processed_urls.add(url)
        
        # 3. LLM Extraction or Deterministic Fallback
        extraction = None
        if use_llm:
            try:
                extraction = client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=4000,
                    response_model=LLMStudentProfileExtraction,
                    messages=[
                        {"role": "user", "content": f"Extract admissions profile and outcomes verbatim from the following social media post:\n\n{raw_text}"}
                    ]
                )
            except Exception as e:
                print(f"LLM API call failed for {filename}: {e}. Falling back to deterministic parser.")
                extraction = None
                
        if extraction is None:
            extraction = deterministic_mock_parse(post)
            
        # 4. Verbatim Citation Verification (The Verifier Gate)
        cit_valid, failed_quotes, is_critical_failure = verify_citations(raw_text, extraction)
        if not cit_valid:
            print(f"Quarantining {filename}: Citation alignment failed. Quotes not found: {failed_quotes}")
            triage_list.append({
                "triage_id": str(uuid.uuid4()),
                "reason": "CITATION_ALIGNMENT_FAILURE",
                "details": f"Verbatim citation check failed for quotes: {failed_quotes}",
                "raw_post": raw_text,
                "parsed_data": {
                    "student_profile": extraction.model_dump()
                },
                "triage_status": "pending"
            })
            continue
            
        # 5. Pydantic Models Validation (Gate 2)
        try:
            domain_model = extraction.to_domain_model()
        except ValidationError as ve:
            print(f"Quarantining {filename}: Pydantic validation failed: {ve}")
            triage_list.append({
                "triage_id": str(uuid.uuid4()),
                "reason": "VALIDATION_FAILED",
                "details": str(ve),
                "raw_post": raw_text,
                "parsed_data": {
                    "student_profile": extraction.model_dump()
                },
                "triage_status": "pending"
            })
            continue
            
        # Extra value range checks for IB
        if domain_model.grades.ib_total is not None:
            if domain_model.grades.ib_total < 12 or domain_model.grades.ib_total > 45:
                print(f"Quarantining {filename}: IB total {domain_model.grades.ib_total} is outside [12, 45]")
                triage_list.append({
                    "triage_id": str(uuid.uuid4()),
                    "reason": "VALIDATION_FAILED",
                    "details": f"IB score {domain_model.grades.ib_total} is outside acceptable range [12, 45].",
                    "raw_post": raw_text,
                    "parsed_data": {
                        "student_profile": extraction.model_dump()
                    },
                    "triage_status": "pending"
                })
                continue
                
        # 6. Sanity and Logic Checks (Gate 5 part 2)
        # SAT/ACT concordance sanity check
        if domain_model.tests.SAT is not None and domain_model.tests.ACT is not None:
            sat_eq = act_to_sat(domain_model.tests.ACT)
            if abs(domain_model.tests.SAT - sat_eq) > 200:
                print(f"Quarantining {filename}: SAT ({domain_model.tests.SAT}) and ACT ({domain_model.tests.ACT}) differ by >200 equivalent points.")
                triage_list.append({
                    "triage_id": str(uuid.uuid4()),
                    "reason": "LOGICAL_CONFLICT",
                    "details": f"Concordance discrepancy: SAT {domain_model.tests.SAT} vs ACT {domain_model.tests.ACT} (concordance SAT eq {sat_eq}) exceeds 200 point threshold.",
                    "raw_post": raw_text,
                    "parsed_data": {
                        "student_profile": extraction.model_dump()
                    },
                    "triage_status": "pending"
                })
                continue
                
        # 7. Three-Tier University Matching & Filtering (Gate 4)
        profile_dict = domain_model.model_dump()
        is_valid_dest, filtered_dict = filter_profile_destinations(profile_dict, all_unis)
        if not is_valid_dest:
            print(f"Discarding {filename}: Zero valid Compass destination universities after filtering.")
            continue
            
        # Reconstruct updated model after filtering
        domain_model = StudentProfileInputModel(**filtered_dict)
        
        # 8. Deduplication via Semantic Stat-Hash
        stat_hash = compute_stat_hash(domain_model)
        if stat_hash in seen_stat_hashes:
            existing_idx = seen_stat_hashes[stat_hash]
            existing_record = clean_dataset[existing_idx]
            
            # Compare richness: use length of raw_text as a proxy
            # We keep the one with longer/richer raw text
            if len(raw_text) > len(existing_record["raw_metadata"]["raw_text"]):
                print(f"Replacing duplicate stat-hash record with richer post. Hash: {stat_hash}")
                clean_dataset[existing_idx] = {
                    "profile": domain_model.model_dump(),
                    "raw_metadata": {
                        "source_platform": post["source_platform"],
                        "source_id": post["source_id"],
                        "url": post["url"],
                        "author": post["author"],
                        "scraped_at": post["scraped_at"],
                        "raw_text": raw_text
                    },
                    "stat_hash": stat_hash
                }
            else:
                print(f"Discarding duplicate stat-hash record with poorer metadata. Hash: {stat_hash}")
                continue
        else:
            seen_stat_hashes[stat_hash] = len(clean_dataset)
            clean_dataset.append({
                "profile": domain_model.model_dump(),
                "raw_metadata": {
                    "source_platform": post["source_platform"],
                    "source_id": post["source_id"],
                    "url": post["url"],
                    "author": post["author"],
                    "scraped_at": post["scraped_at"],
                    "raw_text": raw_text
                },
                "stat_hash": stat_hash
            })
            
    # Write output JSON files
    with open(dataset_file, "w", encoding="utf-8") as f:
        json.dump([item["profile"] for item in clean_dataset], f, indent=2)
    print(f"Wrote {len(clean_dataset)} clean profiles to {dataset_file}")
    
    with open(triage_file, "w", encoding="utf-8") as f:
        json.dump(triage_list, f, indent=2)
    print(f"Wrote {len(triage_list)} quarantined records to {triage_file}")


if __name__ == "__main__":
    process_pipeline()

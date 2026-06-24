import os
import re
from typing import List, Dict, Optional, Tuple

UNIVERSITY_ALIASES = {
    # US Aliases
    "penn": "upenn",
    "u of penn": "upenn",
    "upennsylvania": "upenn",
    "mit": "mit",
    "mass institute of tech": "mit",
    "caltech": "caltech",
    "georgia tech": "gatech",
    "gt": "gatech",
    "ga tech": "gatech",
    "wash u": "washu",
    "washington university": "washu",
    "carnegie mellon": "cmu",
    "berkeley": "berkeley",
    "uc berkeley": "berkeley",
    "ucb": "berkeley",
    "la": "ucla",
    "uc la": "ucla",
    "michigan": "umich",
    "u of m": "umich",
    "nyu": "nyu",
    "new york university": "nyu",
    "unc": "unc",
    "unc-chapel hill": "unc",
    "boston college": "bc",
    "boston university": "bu",
    "u of washington": "uw",
    "udub": "uw",
    "illinois": "uiuc",
    "texas at austin": "ut-austin",
    "ut austin": "ut-austin",
    "uc san diego": "ucsd",
    "penn state": "psu",
    "ohio state": "ohio-state",
    "osu": "ohio-state",
    "arizona state": "asu",
    "iu": "indiana",
    
    # Italy Aliases
    "polimi": "polimi",
    "politecnico di milano": "polimi",
    "polito": "polito",
    "politecnico di torino": "polito",
    "sapienza": "sapienza",
    "sapienza university": "sapienza",
    "unibo": "unibo",
    "bologna": "unibo",
    "unipd": "unipd",
    "padova": "unipd",
    "padua": "unipd",
    "unimi": "unimi",
    "state university of milan": "unimi",
    "bocconi": "bocconi",
    "bocconi university": "bocconi",
    
    # HK Aliases
    "hku": "hku",
    "hong kong u": "hku",
    "university of hong kong": "hku",
    "hkust": "ust",
    "hong kong university of science and technology": "ust",
    "ust": "ust",
    "cuhk": "cuhk",
    "chinese university of hong kong": "cuhk",
    "cityu": "cityu",
    "city university of hong kong": "cityu",
    "polyu": "polyu",
    "hong kong polytechnic university": "polyu"
}

ITALIAN_UNIS = {
    "polimi": "Politecnico di Milano",
    "polito": "Politecnico di Torino",
    "sapienza": "Sapienza University of Rome",
    "unibo": "University of Bologna",
    "unipd": "University of Padova",
    "unimi": "University of Milan",
    "bocconi": "Bocconi University",
}

HK_UNIS = {
    "hku": "The University of Hong Kong",
    "ust": "Hong Kong University of Science and Technology",
    "cuhk": "The Chinese University of Hong Kong",
    "cityu": "City University of Hong Kong",
    "polyu": "The Hong Kong Polytechnic University",
}


def jaro_similarity(s1: str, s2: str) -> float:
    if s1 == s2:
        return 1.0
        
    len1, len2 = len(s1), len(s2)
    if len1 == 0 or len2 == 0:
        return 0.0
        
    max_dist = max(len1, len2) // 2 - 1
    if max_dist < 0:
        max_dist = 0
        
    match1 = [False] * len1
    match2 = [False] * len2
    
    matches = 0
    transpositions = 0
    
    for i in range(len1):
        start = max(0, i - max_dist)
        end = min(len2, i + max_dist + 1)
        
        for j in range(start, end):
            if not match2[j] and s1[i] == s2[j]:
                match1[i] = True
                match2[j] = True
                matches += 1
                break
                
    if matches == 0:
        return 0.0
        
    k = 0
    for i in range(len1):
        if match1[i]:
            while not match2[k]:
                k += 1
            if s1[i] != s2[k]:
                transpositions += 1
            k += 1
            
    transpositions //= 2
    
    return (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3.0


def jaro_winkler_similarity(s1: str, s2: str, p: float = 0.1) -> float:
    j_sim = jaro_similarity(s1, s2)
    
    prefix_len = 0
    for c1, c2 in zip(s1[:4], s2[:4]):
        if c1 == c2:
            prefix_len += 1
        else:
            break
            
    return j_sim + prefix_len * p * (1.0 - j_sim)


def levenshtein_distance(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
        
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
        
    return previous_row[-1]


def get_all_universities() -> List[Dict]:
    """Loads all allowed universities from the TS files in lib/data."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    us_file = os.path.join(base_dir, "lib", "data", "universities.ts")
    
    unis = []
    
    # Add Italian
    for uid, name in ITALIAN_UNIS.items():
        unis.append({"id": uid, "name": name, "region": "IT"})
        
    # Add HK
    for uid, name in HK_UNIS.items():
        unis.append({"id": uid, "name": name, "region": "HK"})
        
    # Add US from TS file
    if os.path.exists(us_file):
        with open(us_file, "r", encoding="utf-8") as f:
            content = f.read()
            matches = re.findall(r'id:\s*["\']([^"\']+)["\'],\s*name:\s*["\']([^"\']+)["\']', content)
            for uid, uname in matches:
                unis.append({"id": uid, "name": uname, "region": "US"})
                
    return unis


def match_university(extracted_name: str, all_unis: List[Dict]) -> Optional[Dict]:
    """Resolves an extracted school name/ID to a Compass university details dict."""
    name_clean = extracted_name.lower().strip()
    
    # Tier 1: Exact Match (either ID or name)
    for uni in all_unis:
        if name_clean == uni["id"].lower() or name_clean == uni["name"].lower():
            return uni
            
    # Tier 2: Static Alias Table
    if name_clean in UNIVERSITY_ALIASES:
        alias_id = UNIVERSITY_ALIASES[name_clean]
        for uni in all_unis:
            if uni["id"] == alias_id:
                return uni
                
    # Tier 3: Fuzzy Matching (Jaro-Winkler >= 0.90)
    best_uni = None
    best_score = 0.0
    
    for uni in all_unis:
        score_name = jaro_winkler_similarity(name_clean, uni["name"].lower())
        score_id = jaro_winkler_similarity(name_clean, uni["id"].lower())
        score = max(score_name, score_id)
        if score > best_score:
            best_score = score
            best_uni = uni
            
    if best_score >= 0.90:
        return best_uni
        
    # Levenshtein distance fallback
    for uni in all_unis:
        for candidate_str in [uni["name"].lower(), uni["id"].lower()]:
            dist = levenshtein_distance(name_clean, candidate_str)
            limit = 1 if len(candidate_str) <= 10 else 2
            if dist <= limit:
                return uni
                
    return None


def filter_profile_destinations(profile_dict: dict, all_unis: List[Dict]) -> Tuple[bool, dict]:
    """
    Filters profile target schools and programs.
    Returns: (is_valid, filtered_profile_dict)
    If no valid Compass destinations remain, is_valid is False.
    """
    target_schools = profile_dict.get("target_schools", [])
    italy_programs = profile_dict.get("italy_programs", [])
    hk_programs = profile_dict.get("hk_programs", [])
    
    valid_schools = []
    valid_italy_programs = []
    valid_hk_programs = []
    
    # Filter US target schools
    for school in target_schools:
        matched = match_university(school, all_unis)
        if matched and matched["region"] == "US":
            # Keep official name
            valid_schools.append(matched["name"])
            
    # Filter Italy programs (format: e.g. 'polimi-cs-eng')
    for prog in italy_programs:
        # Extract prefix before first dash
        parts = prog.split("-")
        if parts:
            matched = match_university(parts[0], all_unis)
            if matched and matched["region"] == "IT":
                valid_italy_programs.append(prog)
                
    # Filter HK programs (format: e.g. 'hku-mbbs' or 'ust-cs')
    for prog in hk_programs:
        parts = prog.split("-")
        if parts:
            matched = match_university(parts[0], all_unis)
            if matched and matched["region"] == "HK":
                valid_hk_programs.append(prog)
                
    # Update profile dictionary
    profile_dict["target_schools"] = valid_schools
    profile_dict["italy_programs"] = valid_italy_programs
    profile_dict["hk_programs"] = valid_hk_programs
    
    # Update destinations list based on actual valid entries
    destinations = []
    if valid_schools:
        destinations.append("US")
    if valid_italy_programs:
        destinations.append("IT")
    if valid_hk_programs:
        destinations.append("HK")
        
    profile_dict["destinations"] = destinations
    
    # If destinations is empty, the profile is rejected
    is_valid = len(destinations) > 0
    return is_valid, profile_dict

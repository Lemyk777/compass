import unittest
from .filter import jaro_winkler_similarity, levenshtein_distance, match_university, get_all_universities, filter_profile_destinations
from .main import verify_citations, deterministic_mock_parse, compute_stat_hash, act_to_sat
from .models import LLMStudentProfileExtraction, StudentProfileInputModel, CitatedValue, LLMGradesExtraction, LLMTestsExtraction

class TestParserPipeline(unittest.TestCase):
    def setUp(self):
        self.all_unis = get_all_universities()

    def test_jaro_winkler_similarity(self):
        # Equal strings
        self.assertAlmostEqual(jaro_winkler_similarity("harvard", "harvard"), 1.0)
        # Empty string
        self.assertAlmostEqual(jaro_winkler_similarity("harvard", ""), 0.0)
        # Prefix matching test
        sim = jaro_winkler_similarity("upenn", "penn")
        self.assertTrue(sim >= 0.8)

    def test_levenshtein_distance(self):
        self.assertEqual(levenshtein_distance("yale", "yale"), 0)
        self.assertEqual(levenshtein_distance("yale", "vale"), 1)
        self.assertEqual(levenshtein_distance("stanford", "standford"), 1)

    def test_university_matching(self):
        # Tier 1: Exact Match
        m = match_university("Harvard University", self.all_unis)
        self.assertIsNotNone(m)
        self.assertEqual(m["id"], "harvard")
        self.assertEqual(m["region"], "US")

        # Tier 2: Static Alias
        m_alias = match_university("Penn", self.all_unis)
        self.assertIsNotNone(m_alias)
        self.assertEqual(m_alias["id"], "upenn")

        m_alias_hk = match_university("HKU", self.all_unis)
        self.assertIsNotNone(m_alias_hk)
        self.assertEqual(m_alias_hk["id"], "hku")

        # Tier 3: Fuzzy Match (Jaro-Winkler / Levenshtein)
        m_fuzzy = match_university("Herward University", self.all_unis)
        self.assertIsNotNone(m_fuzzy)
        self.assertEqual(m_fuzzy["id"], "harvard")

    def test_citation_verification(self):
        raw_text = "Academics: GPA: 3.8 UW | SAT: 1540. Intended Major: Computer Science."
        
        # Valid extraction
        extraction = LLMStudentProfileExtraction(
            country=CitatedValue(value="USA", quote="GPA: 3.8"), # USA not in text, but quote "GPA: 3.8" is in text
            citizenship=CitatedValue(value="USA", quote="SAT: 1540"),
            destinations=[],
            faculties=[],
            intended_major=CitatedValue(value="Computer Science", quote="Intended Major: Computer Science"),
            curriculum=None,
            grades=LLMGradesExtraction(
                raw=CitatedValue(value="GPA: 3.8 UW", quote="GPA: 3.8 UW"),
                gpa=CitatedValue(value=3.8, quote="GPA: 3.8 UW")
            ),
            tests=LLMTestsExtraction(
                SAT=CitatedValue(value=1540, quote="SAT: 1540")
            ),
            activities=[],
            honors=[],
            target_schools=[],
            needs_aid=CitatedValue(value=False, quote="SAT: 1540"),
            italy_programs=[],
            hk_programs=[]
        )
        
        valid, failed, is_critical = verify_citations(raw_text, extraction)
        self.assertTrue(valid)
        self.assertEqual(len(failed), 0)

        # Invalid citation
        extraction.grades.gpa.quote = "GPA: 4.0 UW" # Not in text
        valid, failed, is_critical = verify_citations(raw_text, extraction)
        self.assertFalse(valid)
        self.assertIn("GPA: 4.0 UW", failed)
        self.assertTrue(is_critical) # GPA is critical field

    def test_filter_profile_destinations(self):
        # Profile with valid and invalid destinations
        profile = {
            "target_schools": ["Stanford University", "Oxford University", "Harvard University"], # Oxford is invalid
            "italy_programs": ["polimi-cs-eng", "unknown-program-id"], # unknown-program-id is invalid
            "hk_programs": ["hku-mbbs"],
            "destinations": ["US", "IT", "HK"]
        }
        
        valid, filtered = filter_profile_destinations(profile, self.all_unis)
        self.assertTrue(valid)
        self.assertEqual(filtered["target_schools"], ["Stanford University", "Harvard University"])
        self.assertEqual(filtered["italy_programs"], ["polimi-cs-eng"])
        self.assertEqual(filtered["hk_programs"], ["hku-mbbs"])
        self.assertEqual(sorted(filtered["destinations"]), ["HK", "IT", "US"])

        # Profile with zero valid destinations
        profile_invalid = {
            "target_schools": ["Oxford University", "Cambridge University"],
            "italy_programs": [],
            "hk_programs": [],
            "destinations": ["US"]
        }
        valid_inv, filtered_inv = filter_profile_destinations(profile_invalid, self.all_unis)
        self.assertFalse(valid_inv)
        self.assertEqual(len(filtered_inv["destinations"]), 0)

    def test_stat_hash_deduplication(self):
        # Create student profiles with identical stats
        p1 = StudentProfileInputModel(
            country="Kazakhstan",
            citizenship="Kazakhstan",
            destinations=["US"],
            faculties=["computer_science"],
            intended_major="Computer Science",
            curriculum="IB",
            grades={"raw": "42/45", "ib_total": 42},
            tests={"SAT": 1550},
            target_schools=["Stanford University"],
            needs_aid=True
        )
        p2 = StudentProfileInputModel(
            country="Kazakhstan",
            citizenship="Kazakhstan",
            destinations=["US"],
            faculties=["computer_science"],
            intended_major="Computer Science",
            curriculum="IB",
            grades={"raw": "Predicted 42/45", "ib_total": 42},
            tests={"SAT": 1550},
            target_schools=["Stanford University"],
            needs_aid=True
        )
        
        hash1 = compute_stat_hash(p1)
        hash2 = compute_stat_hash(p2)
        self.assertEqual(hash1, hash2)

    def test_act_to_sat_concordance(self):
        self.assertEqual(act_to_sat(36), 1590)
        self.assertEqual(act_to_sat(30), 1360)
        self.assertEqual(act_to_sat(24), 1140)

    def test_regex_fixes_and_quote_mapping(self):
        post = {
            "source_platform": "reddit",
            "raw_text": (
                "**Demographics**\n"
                "- Country: Hong Kong\n"
                "- Citizenship: Hong Kong\n"
                "- Income/Needs Aid: Yes\n"
                "**Decisions / Outcomes**\n"
                "- **Accepted**:\n"
                "  * UC Berkeley (US)\n"
                "  \n"
                "  * University of Milan (Italy)\n"
                "\n"
                "- **Rejected/Waitlisted**:\n"
                "  * MIT (US)\n"
                "  \n"
                "  * Chinese University of Hong Kong (CUHK) (Hong Kong)\n"
            )
        }
        res = deterministic_mock_parse(post)
        
        # Verify destinations are all correctly extracted despite the blank lines
        extracted_dests = [d.value for d in res.destinations]
        self.assertIn("US", extracted_dests)
        self.assertIn("IT", extracted_dests)
        self.assertIn("HK", extracted_dests)
        
        # Verify correct quote mapping to the actual school's quote_str
        quotes_dict = {d.value: d.quote for d in res.destinations}
        self.assertEqual(quotes_dict["US"], "* MIT (US)")
        self.assertEqual(quotes_dict["IT"], "* University of Milan (Italy)")
        self.assertEqual(quotes_dict["HK"], "* Chinese University of Hong Kong (CUHK) (Hong Kong)")

if __name__ == "__main__":
    unittest.main()

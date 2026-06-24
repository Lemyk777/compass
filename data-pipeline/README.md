# Compass Data Pipeline

This is an isolated dataset pipeline for scraping and parsing student profile datasets for the Compass admissions system.

## Project Structure
- `src/ingestion/`: Scraper implementations for Reddit and Twitter using Playwright Stealth, and a mock fallback generator.
- `src/parser/`: Python ETL parsing & validation tier.
  - `main.py`: Coordinates the ETL process (structured parsing, citation verification, Pydantic validation, filtering, deduplication).
  - `models.py`: Pydantic models for structured LLM extraction.
  - `filter.py`: Programmatic filtering and fuzzy matching rules for target universities.
  - `test_parser.py`: Unit tests for the parser tier.
- `dataset.json`: Generated final dataset of 200 student profiles.
- `triage.json`: Quarantine file for profiles failing validation/citations.

## Running the Scraper
First, install Node dependencies:
```bash
npm install
```

To run the scrapers (which will fallback to mock resilient generation if proxy keys are missing):
```bash
npm run scrape:reddit
npm run scrape:twitter
```

## Running the Parser
Install Python dependencies:
```bash
pip install -r requirements.txt
```

To run the parser ETL pipeline:
```bash
python -m src.parser.main
```

## Running Unit Tests
To execute parser unit tests:
```bash
python -m unittest src.parser.test_parser
```

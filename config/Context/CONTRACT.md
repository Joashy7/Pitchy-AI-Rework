This is a markdown file to track all guardrail prompts that the Agent should follow. 

Load _API_KEY from os.getenv() only. Never write the key value in source code.
Load credentials from service_account.json; do not embed private keys in source code.
README.md is for end users, not course staff. Remove any references to labs, assignments, or submission requirements.
If a new test reveals a bug in the implementation, fix the implementation.
Keep the 3-tier boundary intact: frontend only calls backend API helpers, engine owns validation and AI workflows, and storage owns Google Sheets/local persistence.
Keep mock/local tests isolated from real Gemini, ElevenLabs, and Google Sheets calls unless a smoke-test flag explicitly opts in.
Use documented Gemini model codes in default examples and fallback chains; avoid stale or invented model names.

Add this line at the end of each prompt to make sure Agent accesses this file to consider
Read CONTRACT.md and FUNCTIONALITY.md to keep track of structure and guardrails

# Projects

<!-- Fill in your notable projects — personal, open source, professional, side projects. -->

Projects

Here are the anonymized, uniform project summaries:

Project 1: Digital Avatar Assistant

- What it is: An AI-powered digital avatar that answers medication-related questions for healthcare providers (HCPs) who lack dedicated sales rep support
- Target user: HCPs seeking drug information in a more engaging format than traditional online search
- Tech stack: LLM (GPT-based), digital human platform (speech-to-text/text-to-speech), RAG pipeline with approved knowledge base
- Key features:
  - Voice-based conversational interface with transcript, mute, interrupt, and leave controls
  - Content cards (prompt suggestions, video, image/link, adverse event reporting)
  - In-conversation and exit-screen feedback mechanisms
  - Exit screen with conversation transcript and supporting resources
- Guardrails:
  - Knowledge base context check — restricts responses to approved sources; canned fallback for off-topic queries
  - Adverse event detection — semantic search flags AE mentions, triggers reporting card and standard response
  - PII check — detects and anonymizes names, phone numbers, addresses, and org names in transcripts
  - Profanity check — cloud provider out-of-the-box filter for hate speech/abuse
  - Gibberish check — cloud provider validation for clean text output
- Experiments conducted:
  - Off-label handling — validated knowledge base with in-scope, pressure-test, and out-of-scope questions; custom vector DB outperformed out-of-the-box indexer
  - Model temperature — tested 0 vs 0.9; no significant variation due to fixed context; defaulted to 0
  - PII detection — confirmed guardrail working as intended across sample inputs
  - Adverse event detection — few-shot learning approach flagged all AEs correctly in dataset
  - Sentiment analysis — tested GenAI, traditional ML (NLTK), and cloud sentiment APIs across sample transcripts; model selection pending
- Sentiment analysis (draft): conversation-level sentiment detection as a secondary feedback metric
- Open items for Beta: storing/using feedback data, tying content cards to the knowledge base (vs. keyword triggers), improving response speed, and product discovery with Beta stakeholders

Project 2: Product Authentication & Classification Tool ("Sentry")

- What it is: An API-based tool that classifies product scan submissions to determine if scanned items are legitimate, counterfeit, illegally diverted, compounded, or general inquiries
- Target user: Internal compliance agents who previously processed electronic form submissions manually
- Problem: Compliance agents lacked automated data sorting for product complaints, illegal imports, counterfeits, etc., and their existing tool wasn't designed for it
- Classification logic:
  - Suspect counterfeit — product claims to be from the company but is not found in the ERP system, or has invalid disposition codes
  - Illegal diversion — non-domestic product reported or scanned domestically
  - Compounding — product contains the active ingredient but does not bear company branding
  - General inquiry — product not found, no company-associated identifiers
- Key features:
  - Automated classification based on form inputs and ERP data
  - Email integration — sends templated emails to legal teams or customers based on classification
  - AI OCR capabilities — evaluates user-submitted images for form pre-population, counterfeit detection (packaging color, labeled contents), and correct image validation
- Architecture: Deployed to internal production cluster (dev environment) with CI/CD via GitHub Actions; separate frontend and backend deployment configs

Project 3: Security Documentation Evaluator ("DockIT")

- What it is: An AI-powered tool that evaluates security plans and SOPs against internal compliance criteria, providing automated initial review before human reviewers
- Target user: Security documentation authors (creators) and reviewers (compliance officers, quality assurance, system owners)
- Problem: Manual security document reviews are time-consuming (up to 2 hours per document per reviewer), quality varies significantly, and security compliance has been a persistent top finding in audits
- Tech stack: Python FastAPI backend, Next.js frontend, GPT-based LLMs (4o and o1) hosted on internal cloud infrastructure
- Key features:
  - Evaluates security plans against compliance criteria and reviewer job aid standards
  - Evaluates security administration SOPs against the same criteria
  - Cross-document consistency checks (plan vs. SOP, data diagram vs. plan text)
  - Supports .doc and .pdf uploads
  - Risk category coverage for categories 3–4
  - Standalone app UI for scaled testing
- Note: Team was directed to pivot from security evaluation to test plan generation mid-Beta; security evaluation work ended at that point

Project 4: AI Test Plan Generator ("PlanIT")

- What it is: A generative AI tool that creates test plan content from project documentation, using quality standards and test templates to produce structured outputs
- Target user: Test plan creators and reviewers in validation/quality teams
- Beta timeline: ~3.5 weeks of active development after a mid-cycle pivot and a cloud policy delay
- Tech stack: Python FastAPI backend, Next.js frontend, GPT-based LLM on internal cloud, Redis for job status tracking
- How it works:
  - User inputs project context (e.g., task tracker exports, data flow diagrams, test tool info)
  - Creator and evaluator agents for each of 8 test plan sections generate and self-refine content (up to 2 refinement loops)
  - Agents reference internal quality standards and templates to inform generation
  - Output is copy-pasteable into a Word document
- Recommended next steps:
  - Incorporate cross-functional reviewer insights to standardize outputs
  - Explore fine-tuning (vs. direct prompting) to ingest more reference materials at scale
  - Add decider nodes to determine section relevance per system/risk category
- Implementation learnings:
  - Agentic approach (creator + evaluator) improved quality but increased latency and cost; A/B testing against non-agentic recommended
  - Creator agents initially produced generic content; resolved by prompting the evaluator to strictly flag generic output
  - Human-in-the-loop remains necessary for prompt creation/maintenance

Project 5: AI Gowning Compliance Checker ("BrightEyes")

- What it is: An AI-powered tool that uses a hybrid ML + GenAI approach to evaluate whether manufacturing personnel meet gowning compliance standards before entering production areas
- Target user: Manufacturing operators and compliance teams
- Problem: Current gowning evaluations are ad hoc (gemba walks, self-enforcement), leading to variability, human error, and potential product quality/safety risks
- Approach: ML for person/item detection, GenAI for compliance evaluation — chosen as the most cost-effective and scalable hybrid option
- Compliance criteria evaluated: Cap, hairnet, goggles, beard net, coveralls/frock, gloves, shoe covers — each with compliant, compliant-with-warning, and non-compliant states
- Out of scope: Back-facing criteria, hand sanitizer checks
- Experiments & results:
  - Proved feasibility of video-based GenAI evaluation (~20s initially)
  - Reduced latency by ~7 seconds through multi-frame capture and prompt splitting
  - Achieved 94% detection accuracy in Alpha
  - Item detection rates: 94–100%; full compliance accuracy: 88–100%
- Success metric: Precision (minimizing false positives where system says compliant when user is not)

Project 6: Robotic Teleoperation Data Pipeline ("Groot")

- What it is: An Alpha effort implementing a robotic teleoperation stack to establish a foundational data pipeline for training autonomous robots with company-specific data
- Problem: The organization lacks a structured mechanism to generate and collect robotic training data, making it difficult to develop, test, or scale autonomous robotic behaviors for manufacturing
- Opportunity: Capture real-world robotic motion through teleoperation to build company-specific "intelligence" — task-specific training data that enables foundational robot models to be trained, simulated at scale, and deployed in production environments

Project 7: AI Lab Documentation Tool ("SciLens")

- What it is: An AI-powered tool that transforms raw experiment video footage and audio into structured lab notes — complete with transcript and timeline for easy verification
- Target user: Lab scientists seeking to reduce manual documentation burden while maintaining quality and compliance
- Tech stack: LLM (GPT-based), video/audio processing, OCR (stretch goal)
- Problem: Scientists face challenges accurately documenting experiments due to manual data capture, leading to inconsistent/incomplete electronic lab notebook (ELN) entries — time-consuming, prone to data loss, and detracts from research time
- Alpha goals:
  - Identify and extract procedural steps from video
  - Identify additional audio from the scientist and associate it with the correct procedural step
  - Create structured output of procedural steps
  - Stretch: Capture information from video using OCR
- Alpha use case: Drug product compatibility testing — routine lab studies assessing compatibility with various clinical supplies/components (IV bags, tubing, needles, syringes, etc.). A subject matter expert provided a note template to inform output structure.
- Key output: Structured lab note from raw video/audio, with transcript and timeline for verification

Project 8: Voice-Based Clinical Survey Platform ("Blueberry")

- What it is: An agentic AI platform that replaces static paper surveys in clinical trials with natural voice conversations, converting spoken patient feedback into structured survey data
- Target user: Patients enrolled in digital health technology (DHT) clinical trials and studies
- Problem: Static paper surveys lead to incomplete data, low patient engagement, and high manual follow-up burden
- Tech stack: React Vite frontend, real-time middleware using voice API (WebSocket-based), FastAPI backend, PostgreSQL, GPT-based LLMs for response analysis and real-time voice conversation
- Key features:
  - Automated survey metadata creation from example surveys via API
  - Conversational agent handles complex scenarios: multiple answers in one response, vague/partial answers, topic deviation, delayed information, contradictions, minimal responses, and sensitive questions
  - Tool calls for response recording, survey termination, and relative date calculation
  - Structured output: full transcript, question-to-answer mapping with verbatim responses and rationale, JSON export for downstream systems
- Architecture: WebSocket-based real-time communication, modular microservices, deployed on internal cloud infrastructure
- Learnings:
  - Built-in voice activity detection and interruption handling improve natural feel
  - Real-time tool calling with structured arguments improved survey workflow accuracy
  - Dynamic system prompt regeneration based on survey context keeps interactions relevant
- Limitations: WebSocket latency (vs. WebRTC), external API dependency, session complexity, token window constraints (32K), cost sensitivity for audio sessions, single-session-per-instance limitation
- Proposed future enhancements: Admin portal, progressive web app, personalization, PII/adverse event detection, multilingual support, phone call option, feedback collection

Project 9: AI Video Generation Tool ("Dragon")

- What it is: A GenAI-powered tool that generates training and IT walkthrough videos from uploaded documents with one-click generation
- Target user: IT support teams and training content creators
- Problem: Creating training and IT self-help videos requires specialized skills and manual effort, contributing to high IT service desk call volume
- Alpha scope: Added step-by-step walkthrough video type (in addition to training videos); an agent determines video type from uploaded documents; supports images from source documents in generated videos
- Tech stack: FastAPI orchestration layer, GPT-based LLM for scene/storyline creation, cloud-based video generation models, external AI video platform for template-based rendering, cloud text-to-speech for voiceovers, Redis for session management
- Workflow: Document upload → parsing & image extraction → agent selects template → slide data generation → assets sent to video platform → video created
- Alpha timeline: ~2 weeks (Sept 22 – Oct 3, 2025)

Project 10: Voice-Based IT Support Assistant ("Vicki")

- What it is: A voice-enabled IT assistant that lets employees report and troubleshoot conference room technology issues by scanning an in-room QR code and describing the issue through natural voice conversation
- Target user: Employees experiencing conference room IT issues
- Problem: Reporting in-room IT problems is manual, disruptive to meetings, and often results in incomplete tickets that slow resolution
- Key features:
  - Mobile-first web app with real-time animations and confirmation screens
  - Voice-based issue reporting with guided conversational flow (captures device type, issue description, urgency)
  - Structured data capture — converts voice input into structured IT support ticket fields
  - Direct integration with IT service management platform for ticket submission
- Beta goals: Demonstrate voice-based reporting, validate structured ticket generation, implement service management platform integration

Project 11: Smart Glasses Remote Assist Platform

- What it is: A WebRTC-based proof-of-concept enabling a field technician wearing smart glasses to stream a live first-person video feed to a remote expert, who can view the feed and place real-time AR annotations visible on the technician's display
- Target user: Field technicians needing specialist guidance and remote subject matter experts
- Problem: Expert travel is costly and slow; verbal/photo-based remote guidance is error-prone and lacks real-time visual context. No existing solution provides a live, hands-free view with annotation capability, especially within a restricted corporate network
- Tech stack:
  - Smart glasses Android app (native SDK) — video/audio capture, HUD display, annotation rendering
  - Python/FastAPI signaling server — stateless WebRTC session negotiation via HTTP POST + SSE
  - React web app (expert console) — live video viewer, freehand annotation canvas, two-way audio
  - WebRTC for encrypted peer-to-peer media; STUN/TURN for NAT traversal
- Key characteristics: 1:1 session model, peer-to-peer encrypted media (DTLS-SRTP), annotations via data channel as normalized JSON coordinates, all components deployed on internal infrastructure with zero external data transit
- Alpha goals:
  - Stable low-latency video streaming over corporate network
  - Real-time AR annotation from expert to technician's glasses
  - Full deployment on internal infrastructure
  - Validate WebRTC within corporate firewall/UDP constraints
  - Assess smart glasses hardware desirability and user adoption willingness
- Success metrics: Successful internal deployment, WebRTC connectivity across multiple facilities, ≥30-min stream stability, ~500ms annotation latency, <15s connection establishment, ≥70% hardware desirability from pilot participants
- Security model: DTLS-SRTP for media, DTLS/SCTP for data channel; signaling currently cleartext HTTP (acceptable for POC); no authentication (POC scope)
- Out of scope for Alpha: On-device AI, cloud AI co-pilot, video conferencing platform integration, spatial anchoring, multi-party calls, session recording, authentication/SSO
- Risks: Corporate firewall blocking WebRTC ICE candidates (TURN server setup in progress), internal platform UDP/WebSocket support validation needed, smart glasses SDK API sufficiency
- Beta transition criteria: All Alpha metrics achieved, hardware desirability data collected, WebRTC confirmed across multiple facilities, TURN server validated, architecture confirmed extensible for AI and platform integrations
- Deployment status: App onboarded to internal platform; initial deployment files and CI still pending

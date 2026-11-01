import type { ResumeTemplate, ResumeData } from "./types";

/* ══════════════════════════════════════════════════════════════════════════════
   1. JAKE'S RESUME (ATS GOLD STANDARD SWE)
══════════════════════════════════════════════════════════════════════════════ */
export const jakesResumeLatex = `%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape Alex Rivera} \\\\ \\vspace{1pt}
    \\small +1 (555) 234-5678 $|$ \\href{mailto:alex.rivera@example.com}{\\underline{alex.rivera@example.com}} $|$ 
    \\href{https://linkedin.com/in/alexrivera-dev}{\\underline{linkedin.com/in/alexrivera-dev}} $|$
    \\href{https://github.com/alexrivera}{\\underline{github.com/alexrivera}}
\\end{center}

\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {University of California, Berkeley}{Berkeley, CA}
      {Bachelor of Science in Computer Science; GPA: 3.85}{Aug 2018 -- May 2022}
      \\resumeItemListStart
        \\resumeItem{Relevant Coursework: Data Structures, Algorithms, Operating Systems, Database Systems, Computer Networks}
        \\resumeItem{Dean's Honor List for 6 consecutive academic terms}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Software Development Engineer}{Jun 2023 -- Present}
      {Stripe}{San Francisco, CA}
      \\resumeItemListStart
        \\resumeItem{Architected and deployed a distributed payment processing pipeline in Go and PostgreSQL, handling over 2.5M daily transactions with 99.99\\% uptime.}
        \\resumeItem{Optimized database query caching using Redis, reducing P99 latency by 35\\% and saving \\$45,000 in monthly AWS infrastructure expenses.}
        \\resumeItem{Collaborated with cross-functional engineering teams to implement automated CI/CD canary deployments across Kubernetes clusters.}
      \\resumeItemListEnd

    \\resumeSubheading
      {Associate Software Engineer}{Jan 2022 -- May 2023}
      {DoorDash}{San Jose, CA}
      \\resumeItemListStart
        \\resumeItem{Engineered real-time order tracking WebSocket services in Node.js and TypeScript, serving 500k+ active mobile app users.}
        \\resumeItem{Refactored legacy monolithic services into containerized microservices, boosting team deployment velocity by 50\\%.}
        \\resumeItem{Wrote unit and integration test suites using Jest, increasing overall test coverage from 62\\% to 91\\%.}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Projects}
    \\resumeSubHeadingListStart
      \\resumeProjectHeading
          {\\textbf{CloudScale -- Load Balancer} $|$ \\emph{Go, Docker, gRPC, Prometheus, Grafana}}{2023}
          \\resumeItemListStart
            \\resumeItem{Constructed a high-concurrency Layer 7 load balancer in Go utilizing round-robin and least-connections routing algorithms.}
            \\resumeItem{Benchmarked throughput to sustain 100,000+ simultaneous requests per second with sub-5ms routing overhead.}
            \\resumeItem{Integrated Prometheus metrics exporter with custom Grafana telemetry dashboards for real-time traffic monitoring.}
          \\resumeItemListEnd
      \\resumeProjectHeading
          {\\textbf{CodePulse -- Collaborative IDE} $|$ \\emph{Next.js, TypeScript, WebSockets, Monaco Editor}}{2022}
          \\resumeItemListStart
            \\resumeItem{Developed a browser-based collaborative coding environment with CRDT operational transform algorithms for multi-user editing.}
            \\resumeItem{Integrated Monaco Editor with multi-language syntax highlighting, real-time cursor presence, and code execution sandbox.}
          \\resumeItemListEnd
    \\resumeSubHeadingListEnd

\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Languages}{: TypeScript, JavaScript, Go, Python, Java, C++, SQL} \\\\
     \\textbf{Frameworks}{: React, Next.js, Node.js, Express, TailwindCSS, Prisma, gRPC} \\\\
     \\textbf{Developer Tools}{: Git, Docker, Kubernetes, AWS (EC2, S3, RDS), Redis, PostgreSQL, Linux, CI/CD}
    }}
 \\end{itemize}

\\end{document}
`;

/* ══════════════════════════════════════════════════════════════════════════════
   2. FAANG IMPACT RESUME (WITH FONTAWESOME & PROJECT HYPERLINKS)
══════════════════════════════════════════════════════════════════════════════ */
export const faangTechLatex = `%-------------------------
% FAANG / Top Tech Resume
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{fontawesome5}
\\input{glyphtounicode}
\\pdfgentounicode=1

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape Gyanranjan Priyam} \\\\ \\vspace{2pt}
    \\small 
    \\href{mailto:contact.gyanranjan@gmail.com}{\\faEnvelope\\ contact.gyanranjan@gmail.com} $|$
    \\href{https://linkedin.com/in/gyanranjan-priyam}{\\faLinkedin\\ gyanranjan-priyam} $|$
    \\href{https://github.com/Gyanranjan-Priyam}{\\faGithub\\ Gyanranjan-Priyam} $|$
    \\href{https://gyanranjanpriyam.tech}{\\faGlobe\\ gyanranjanpriyam.tech}
\\end{center}

\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Government College of Engineering, Kalahandi}{Kalahandi, Odisha}
      {Bachelor of Technology in Electrical Engineering -- GPA: 8.3/10.0}{Sept. 2024 -- Present}
    \\resumeSubheading
      {Divine Higher Secondary School}{Nayagarh, Odisha}
      {Higher Secondary Certificate (Science) -- 84.83\\%}{Aug. 2021 -- July 2023}
  \\resumeSubHeadingListEnd

\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Languages}{: JavaScript (ES6+), TypeScript, Python, Dart, SQL} \\\\
     \\textbf{Frameworks \\& Libraries}{: Next.js, React, React Native, Express.js, Node.js, Flutter, Tailwind CSS, Vite} \\\\
     \\textbf{Databases \\& Cloud}{: PostgreSQL, MongoDB, Supabase, AWS (EC2, S3, Lambda), Prisma ORM} \\\\
     \\textbf{Tools \\& Technologies}{: Git, Linux, Docker, REST APIs, WebSocket, BetterAuth, Stripe, Razorpay, CI/CD}
    }}
 \\end{itemize}

\\section{Projects}
  \\resumeSubHeadingListStart
    \\resumeProjectHeading
        {\\textbf{TechFest Platform} $|$ \\emph{Next.js, TypeScript, AWS, Prisma, PostgreSQL} $|$ \\href{https://registration-insprano.vercel.app/login}{\\faExternalLinkAlt\\ Demo} $|$ \\href{https://github.com/Gyanranjan-Priyam/insprano-dashboard}{\\faGithub\\ Code}}{2024}
        \\resumeItemListStart
          \\resumeItem{Engineered scalable event management system processing 5,000+ registrations with real-time payment integration.}
          \\resumeItem{Optimized database queries reducing response time by 60\\% and implemented secure authentication workflows.}
          \\resumeItem{Deployed on AWS with auto-scaling capabilities, handling peak traffic of 10,000+ concurrent users.}
        \\resumeItemListEnd
    \\resumeProjectHeading
        {\\textbf{SAMS School LMS} $|$ \\emph{Next.js, TypeScript, Prisma, Stripe API} $|$ \\href{https://demo.app}{\\faExternalLinkAlt\\ Demo} $|$ \\href{https://github.com/user/lms}{\\faGithub\\ Code}}{2024}
        \\resumeItemListStart
          \\resumeItem{Built full-stack learning management system with course creation, student analytics, and role-based access control.}
          \\resumeItem{Integrated Stripe payment gateway with secure checkout flows, processing \\$50K+ in test transactions.}
          \\resumeItem{Implemented server-side rendering and caching strategies, achieving 95+ Lighthouse performance scores.}
        \\resumeItemListEnd
    \\resumeProjectHeading
        {\\textbf{College Management System} $|$ \\emph{React, Node.js, MongoDB, TypeScript} $|$ \\href{https://demo.app}{\\faExternalLinkAlt\\ Demo} $|$ \\href{https://github.com/user/cms}{\\faGithub\\ Code}}{2024}
        \\resumeItemListStart
          \\resumeItem{Designed enterprise-grade system automating admissions, academics, and certifications for 2,000+ students.}
          \\resumeItem{Reduced administrative processing time by 70\\% through workflow automation and data validation pipelines.}
          \\resumeItem{Implemented comprehensive logging and monitoring system ensuring data integrity across all modules.}
        \\resumeItemListEnd
    \\resumeProjectHeading
        {\\textbf{Orbit -- Mobile Project Management} $|$ \\emph{React Native, Expo, Supabase, TypeScript} $|$ \\href{https://demo.app}{\\faExternalLinkAlt\\ APK} $|$ \\href{https://github.com/user/orbit}{\\faGithub\\ Code}}{2024}
        \\resumeItemListStart
          \\resumeItem{Built cross-platform mobile app for task management and team collaboration with offline-first architecture.}
          \\resumeItem{Implemented real-time synchronization using Supabase, optimizing data flow for low-bandwidth scenarios.}
        \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Event Coordinator}{Oct. 2025 -- Present}
      {CodeBreakers -- GCE Kalahandi Technical Community}{Kalahandi, Odisha}
      \\resumeItemListStart
        \\resumeItem{Coordinating technical events, coding competitions, and workshops for 500+ student developers.}
        \\resumeItem{Mentoring junior developers on full-stack development, competitive programming, and best coding practices.}
        \\resumeItem{Led development of community website (\\href{https://www.codebreakersgcek.tech}{codebreakersgcek.tech}) using Next.js and AWS.}
      \\resumeItemListEnd
    \\resumeSubheading
      {Campus Ambassador}{Jan. 2026 -- Present}
      {GeeksforGeeks}{Remote}
      \\resumeItemListStart
        \\resumeItem{Represented GeeksforGeeks on campus, promoting data structures, algorithms, and competitive programming resources to 300+ students.}
        \\resumeItem{Organized workshops and technical sessions bridging academic curriculum with industry-relevant coding skills.}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Achievements \\& Leadership}
  \\resumeItemListStart
    \\resumeItem{Won multiple college-level coding competitions and hackathons, securing top positions in algorithmic challenges.}
    \\resumeItem{Achieved top ranks on competitive programming platforms (CodeChef, LeetCode) demonstrating strong DSA proficiency.}
    \\resumeItem{Active contributor to CodeBreakers coding club, organizing internal contests and promoting software development culture.}
    \\resumeItem{Mentored 20+ junior students in web development, system design, and competitive programming fundamentals.}
  \\resumeItemListEnd

\\end{document}
`;

/* ══════════════════════════════════════════════════════════════════════════════
   3. HARVARD EXECUTIVE RESUME (ACADEMIC / IVY LEAGUE SERIF)
══════════════════════════════════════════════════════════════════════════════ */
export const harvardExecutiveLatex = `%-------------------------
% Harvard Executive / Classic Resume
%------------------------

\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}
\\pdfgentounicode=1

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape Marcus Sterling} \\\\ \\vspace{2pt}
    \\small Boston, MA $|$ +1 (617) 555-0199 $|$ \\href{mailto:m.sterling@post.harvard.edu}{\\underline{m.sterling@post.harvard.edu}} $|$ \\href{https://linkedin.com/in/marcussterling}{\\underline{linkedin.com/in/marcussterling}}
\\end{center}

\\section{Executive Summary}
Strategic Engineering Leader and Systems Architect with 8+ years scaling high-reliability distributed systems and leading multidisciplinary software teams. Champion of architectural excellence, reducing P99 latencies by 45\\% and driving \\$3.2M annual operational cost reductions across cloud architectures.

\\section{Professional Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Principal Systems Architect}{2021 -- Present}
      {Akamai Technologies}{Cambridge, MA}
      \\resumeItemListStart
        \\resumeItem{Directed technical roadmap for next-generation Edge Compute runtime processing 12B daily requests across 4,000 Points of Presence.}
        \\resumeItem{Spearheaded migration of monolithic core services to distributed microservices on Kubernetes, reducing failure blast radius by 80\\%.}
        \\resumeItem{Mentored a division of 28 senior engineers, instituting formal RFC processes and automated chaos-engineering benchmarks.}
      \\resumeItemListEnd

    \\resumeSubheading
      {Senior Software Engineering Manager}{2018 -- 2021}
      {Wayfair LLC}{Boston, MA}
      \\resumeItemListStart
        \\resumeItem{Managed two cross-functional engineering pods delivering real-time recommendation engines with \\$120M annual attributed GMV.}
        \\resumeItem{Reduced system downtime during peak Cyber 5 shopping events from 42 minutes to zero seconds through proactive load shedding.}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Harvard University}{Cambridge, MA}
      {Master of Science in Computational Science and Engineering}{2016 -- 2018}
    \\resumeSubheading
      {Massachusetts Institute of Technology (MIT)}{Cambridge, MA}
      {Bachelor of Science in Electrical Engineering and Computer Science}{2012 -- 2016}
  \\resumeSubHeadingListEnd

\\section{Core Competencies}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Strategic Leadership}{: Engineering Roadmap, Tech Strategy, Cross-Functional Team Leadership, RFC Design} \\\\
     \\textbf{Distributed Systems}{: High-Throughput Architectures, Edge Computing, Fault-Tolerant Systems, Kubernetes, Kafka} \\\\
     \\textbf{Cloud \\& Infra}{: AWS (EC2, EKS, RDS, DynamoDB), Terraform, Prometheus, CI/CD Pipelines, Datadog}
    }}
 \\end{itemize}

\\end{document}
`;

/* ══════════════════════════════════════════════════════════════════════════════
   4. DATA SCIENTIST & ML ENGINEER RESUME
══════════════════════════════════════════════════════════════════════════════ */
export const dataScientistLatex = `%-------------------------
% Data Scientist & ML Engineer Resume
%------------------------

\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{tabularx}
\\input{glyphtounicode}
\\pdfgentounicode=1

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape Sophia Chen} \\\\ \\vspace{2pt}
    \\small New York, NY $|$ \\href{mailto:sophia.chen.ai@gmail.com}{\\underline{sophia.chen.ai@gmail.com}} $|$ \\href{https://linkedin.com/in/sophia-chen-ml}{\\underline{linkedin.com/in/sophia-chen-ml}} $|$ \\href{https://github.com/sophiachen-ml}{\\underline{github.com/sophiachen-ml}}
\\end{center}

\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Machine Learning \\& AI}{: PyTorch, TensorFlow, Scikit-Learn, Transformers, HuggingFace, LLMs, LangChain, RAG} \\\\
     \\textbf{Data Engineering}{: Apache Spark, Kafka, Airflow, Snowflake, Pandas, NumPy, SQL, BigQuery, dbt} \\\\
     \\textbf{MLOps \\& Cloud}{: MLflow, Kubeflow, Docker, AWS (SageMaker, S3, Lambda), FastAPI, ONNX, Weights \\& Biases} \\\\
     \\textbf{Languages}{: Python (Expert), SQL, R, C++, Bash}
    }}
 \\end{itemize}

\\section{Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Machine Learning Engineer}{2022 -- Present}
      {Bloomberg LP}{New York, NY}
      \\resumeItemListStart
        \\resumeItem{Trained and fine-tuned domain-specific Financial LLMs (7B parameters) using LoRA/QLoRA on 40M SEC filing documents.}
        \\resumeItem{Engineered real-time semantic search and retrieval-augmented generation (RAG) pipeline achieving 94.2\\% precision at top-3.}
        \\resumeItem{Optimized model inference latency by 4.2x using TensorRT and vLLM, scaling serving capacity to 1,200 req/sec.}
      \\resumeItemListEnd

    \\resumeSubheading
      {Data Science Intern}{Summer 2021}
      {Meta (Facebook AI Research)}{Menlo Park, CA}
      \\resumeItemListStart
        \\resumeItem{Developed graph neural network (GNN) architectures for social anomaly detection, reducing fraudulent accounts by 18\\%.}
        \\resumeItem{Automated feature engineering pipelines in Spark processing 8TB of daily clickstream telemetry logs.}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Projects}
  \\resumeSubHeadingListStart
    \\resumeProjectHeading
        {\\textbf{NeuroVision -- Medical Image Segmentation} $|$ \\emph{PyTorch, UNet, CUDA, Docker}}{2023}
        \\resumeItemListStart
          \\resumeItem{Constructed deep 3D-UNet segmentation model for MRI brain tumor localization with 0.912 Dice similarity score.}
          \\resumeItem{Won 2nd place in MICCAI global medical imaging challenge among 140 international research teams.}
        \\resumeItemListEnd
    \\resumeProjectHeading
        {\\textbf{AutoRAG -- Multi-Agent Document Intelligence} $|$ \\emph{Python, LangChain, ChromaDB, FastAPI}}{2023}
        \\resumeItemListStart
          \\resumeItem{Developed open-source autonomous document question-answering agent with 2,400+ GitHub stars.}
          \\resumeItem{Integrated hybrid BM25 + dense vector reranking pipeline for low-hallucination factual synthesis.}
        \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Columbia University}{New York, NY}
      {M.S. in Computer Science (Machine Learning Track) -- GPA: 3.94}{2020 -- 2022}
    \\resumeSubheading
      {University of Michigan}{Ann Arbor, MI}
      {B.S. in Data Science \\& Mathematics -- Summa Cum Laude}{2016 -- 2020}
  \\resumeSubHeadingListEnd

\\end{document}
`;

/* ══════════════════════════════════════════════════════════════════════════════
   5. CLOUD DEVOPS & SRE RESUME
══════════════════════════════════════════════════════════════════════════════ */
export const devopsSreLatex = `%-------------------------
% Cloud DevOps & SRE Resume
%------------------------

\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{tabularx}
\\input{glyphtounicode}
\\pdfgentounicode=1

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape David Miller} \\\\ \\vspace{2pt}
    \\small Seattle, WA $|$ +1 (206) 555-8392 $|$ \\href{mailto:david.miller.sre@gmail.com}{\\underline{david.miller.sre@gmail.com}} $|$ \\href{https://github.com/davidmiller-sre}{\\underline{github.com/davidmiller-sre}}
\\end{center}

\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Cloud Providers}{: Amazon Web Services (AWS - Solutions Architect Certified), Google Cloud Platform (GCP), Azure} \\\\
     \\textbf{Containerization \\& Orchestration}{: Kubernetes (CKA Certified), Docker, Helm, ArgoCD, Istio Service Mesh} \\\\
     \\textbf{Infrastructure as Code}{: Terraform, Terragrunt, Ansible, CloudFormation, Pulumi} \\\\
     \\textbf{Observability \\& Monitoring}{: Prometheus, Grafana, Datadog, ELK Stack, OpenTelemetry, Jaeger} \\\\
     \\textbf{CI/CD \\& Automation}{: GitHub Actions, GitLab CI, Jenkins, Spinnaker, Bash, Python, Go}
    }}
 \\end{itemize}

\\section{Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Senior Site Reliability Engineer}{2022 -- Present}
      {Amazon Web Services (AWS)}{Seattle, WA}
      \\resumeItemListStart
        \\resumeItem{Maintained 99.999\\% availability for Amazon DynamoDB global storage plane managing over 100M IOPS.}
        \\resumeItem{Architected GitOps automated release workflows in ArgoCD and Terraform, reducing production deployment lead times from 3 hours to 12 minutes.}
        \\resumeItem{Authored automated remediation runbooks in Go and Lambda, reducing Mean Time to Resolution (MTTR) by 55\\% across P1 incidents.}
      \\resumeItemListEnd

    \\resumeSubheading
      {DevOps Engineer}{2020 -- 2022}
      {Nordstrom}{Seattle, WA}
      \\resumeItemListStart
        \\resumeItem{Migrated 140+ bare-metal microservices to Amazon Elastic Kubernetes Service (EKS), cutting annual compute costs by \\$420,000.}
        \\resumeItem{Implemented zero-trust mutual TLS (mTLS) service-to-service encryption across cluster nodes utilizing Istio.}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Projects}
  \\resumeSubHeadingListStart
    \\resumeProjectHeading
        {\\textbf{KubeGuard -- Automated Multi-Cluster Compliance} $|$ \\emph{Go, Kubernetes API, Terraform, AWS}}{2023}
        \\resumeItemListStart
          \\resumeItem{Engineered admission controller daemon verifying CIS Kubernetes benchmarks across 20+ production EKS clusters.}
          \\resumeItem{Blocked 100\\% of non-compliant root-privilege pod deployment attempts prior to container runtime.}
        \\resumeItemListEnd
    \\resumeProjectHeading
        {\\textbf{ChaosDrill -- Automated Resiliency Engine} $|$ \\emph{Python, Docker, Chaos Mesh, Prometheus}}{2022}
        \\resumeItemListStart
          \\resumeItem{Built automated network latency injection tool for validating distributed cache failover under high load.}
        \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Certifications}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{AWS Certified Solutions Architect -- Professional} \\\\
     \\textbf{Certified Kubernetes Administrator (CKA)} -- Linux Foundation \\\\
     \\textbf{HashiCorp Certified: Terraform Associate}
    }}
 \\end{itemize}

\\end{document}
`;

/* ══════════════════════════════════════════════════════════════════════════════
   6. FULL STACK & MOBILE DEVELOPER RESUME
══════════════════════════════════════════════════════════════════════════════ */
export const fullstackMobileLatex = `%-------------------------
% Full Stack & Mobile Engineer Resume
%------------------------

\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{tabularx}
\\input{glyphtounicode}
\\pdfgentounicode=1

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape Ethan Walker} \\\\ \\vspace{2pt}
    \\small Austin, TX $|$ \\href{mailto:ethan.walker.dev@gmail.com}{\\underline{ethan.walker.dev@gmail.com}} $|$ \\href{https://github.com/ethanwalker-dev}{\\underline{github.com/ethanwalker-dev}} $|$ \\href{https://ethanwalker.io}{\\underline{ethanwalker.io}}
\\end{center}

\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Frontend \\& Mobile}{: React Native, Expo, Flutter, Next.js, React, Tailwind CSS, Redux Toolkit, Zustand, HTML5/CSS3} \\\\
     \\textbf{Backend \\& APIs}{: Node.js, Express, NestJS, Go, GraphQL, REST APIs, WebSockets, TRPC, Supabase} \\\\
     \\textbf{Databases \\& Storage}{: PostgreSQL, MongoDB, Redis, Prisma, Drizzle ORM, Firebase Firestore} \\\\
     \\textbf{DevOps \\& Mobile CI}{: Fastlane, App Store Connect, Google Play Console, Docker, AWS S3, Vercel}
    }}
 \\end{itemize}

\\section{Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Senior Full Stack Developer}{2022 -- Present}
      {Shopify}{Austin, TX}
      \\resumeItemListStart
        \\resumeItem{Developed merchant mobile point-of-sale features in React Native and GraphQL used by 120,000+ retail storefronts.}
        \\resumeItem{Engineered offline synchronization engine with SQLite and CRDTs, allowing seamless in-store checkout during network dropouts.}
        \\resumeItem{Decreased mobile app cold boot time by 48\\% by optimizing Hermes JavaScript engine bytecode bundle loading.}
      \\resumeItemListEnd

    \\resumeSubheading
      {Full Stack Engineer}{2020 -- 2022}
      {Under Armour}{Austin, TX}
      \\resumeItemListStart
        \\resumeItem{Created fitness workout builder web app in Next.js and TypeScript supporting 1.2M active connected athlete accounts.}
        \\resumeItem{Engineered BLE (Bluetooth Low Energy) communication protocols for real-time heart rate sensor hardware integration.}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Featured Projects}
  \\resumeSubHeadingListStart
    \\resumeProjectHeading
        {\\textbf{PulseFit -- Connected Workout Companion} $|$ \\emph{React Native, Expo, Node.js, Supabase}}{2023}
        \\resumeItemListStart
          \\resumeItem{Published iOS and Android application with 4.8-star average rating and 50,000+ total downloads.}
          \\resumeItem{Implemented in-app subscriptions and Apple HealthKit / Google Fit automated background synchronization.}
        \\resumeItemListEnd
    \\resumeProjectHeading
        {\\textbf{ArtisanHub -- Creator Marketplace} $|$ \\emph{Next.js 14, TailwindCSS, Stripe Connect, PostgreSQL}}{2023}
        \\resumeItemListStart
          \\resumeItem{Built multi-vendor digital goods marketplace with automated instant payouts and escrow release logic.}
        \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {University of Texas at Austin}{Austin, TX}
      {Bachelor of Science in Electrical and Computer Engineering}{2016 -- 2020}
  \\resumeSubHeadingListEnd

\\end{document}
`;

/* ══════════════════════════════════════════════════════════════════════════════
   7. CYBERSECURITY & SYSTEMS ENGINEER RESUME
══════════════════════════════════════════════════════════════════════════════ */
export const cybersecurityLatex = `%-------------------------
% Cybersecurity & Systems Engineer Resume
%------------------------

\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{tabularx}
\\input{glyphtounicode}
\\pdfgentounicode=1

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape Nathan Vance} \\\\ \\vspace{2pt}
    \\small Washington, D.C. $|$ +1 (202) 555-0142 $|$ \\href{mailto:nathan.vance.sec@gmail.com}{\\underline{nathan.vance.sec@gmail.com}} $|$ \\href{https://github.com/nathanvance-sec}{\\underline{github.com/nathanvance-sec}}
\\end{center}

\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Security Domains}{: Application Security (AppSec), Penetration Testing, Threat Modeling, Cryptography, Reverse Engineering} \\\\
     \\textbf{Low-Level \\& Systems}{: C, C++, Rust, x86-64 Assembly, Linux Kernel Internals, eBPF, Memory Safety} \\\\
     \\textbf{Security Tooling}{: Burp Suite Pro, Ghidra, IDA Pro, Wireshark, GDB, SonarQube, Semgrep, Metasploit, Nmap} \\\\
     \\textbf{Protocols \\& Standards}{: OAuth2/OIDC, TLS 1.3, Zero Trust, NIST 800-53, SOC2, OWASP Top 10}
    }}
 \\end{itemize}

\\section{Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Senior Security Engineer}{2022 -- Present}
      {CrowdStrike}{Reston, VA}
      \\resumeItemListStart
        \\resumeItem{Developed kernel-level threat detection sensors in C and eBPF processing real-time telemetry from 2M+ endpoint devices.}
        \\resumeItem{Discovered and responsibly disclosed 3 critical Zero-Day vulnerabilities (CVE-2023-XXXX) in enterprise networking firmware.}
        \\resumeItem{Led secure code reviews and static analysis automation (Semgrep) across 40+ engineering repositories, eliminating 85\\% of common OWASP flaws before staging.}
      \\resumeItemListEnd

    \\resumeSubheading
      {Application Security Engineer}{2019 -- 2022}
      {Mandiant (Google Cloud)}{Alexandria, VA}
      \\resumeItemListStart
        \\resumeItem{Conducted red-team penetration tests against Fortune 500 financial web applications and cloud infrastructures.}
        \\resumeItem{Architected automated vulnerability scanning pipelines in GitLab CI, reducing developer vulnerability remediation cycles by 60\\%.}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Security Research \\& CVEs}
  \\resumeItemListStart
    \\resumeItem{\\textbf{CVE-2023-28432} -- Remote Code Execution in MinIO object storage. Published technical exploit analysis and mitigation advisory.}
    \\resumeItem{\\textbf{DefCon 31 Speaker} -- Presented research on \\textit{Modern Linux Kernel Exploitation Techniques \\& eBPF Runtime Defenses}.}
    \\resumeItem{Top 50 global ranking on HackerOne bug bounty platform with 100+ verified security bounty submissions.}
  \\resumeItemListEnd

\\section{Certifications}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Offensive Security Certified Professional (OSCP)} -- OffSec \\\\
     \\textbf{Certified Information Systems Security Professional (CISSP)} -- (ISC)² \\\\
     \\textbf{Certified Kubernetes Security Specialist (CKS)} -- Linux Foundation
    }}
 \\end{itemize}

\\end{document}
`;

/* ══════════════════════════════════════════════════════════════════════════════
   8. STUDENT / FRESHER / CAMPUS PLACEMENT RESUME
══════════════════════════════════════════════════════════════════════════════ */
export const studentFresherLatex = `%-------------------------
% Student & Campus Placement Resume
%------------------------

\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{tabularx}
\\input{glyphtounicode}
\\pdfgentounicode=1

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape Rohan Sharma} \\\\ \\vspace{2pt}
    \\small Bhubaneswar, India $|$ +91 98765 43210 $|$ \\href{mailto:rohan.sharma.cs@gmail.com}{\\underline{rohan.sharma.cs@gmail.com}} $|$ \\href{https://linkedin.com/in/rohansharma-cs}{\\underline{linkedin.com/in/rohansharma-cs}} $|$ \\href{https://github.com/rohansharma-dev}{\\underline{github.com/rohansharma-dev}}
\\end{center}

\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {National Institute of Technology (NIT), Rourkela}{Rourkela, Odisha}
      {Bachelor of Technology in Computer Science and Engineering -- CGPA: 8.92 / 10.0}{2021 -- 2025}
      \\resumeItemListStart
        \\resumeItem{Relevant Coursework: Data Structures \\& Algorithms, Object Oriented Programming, DBMS, OS, Computer Networks}
        \\resumeItem{Department Rank 4 among 120 students; recipient of Merit Academic Scholarship}
      \\resumeItemListEnd
    \\resumeSubheading
      {Delhi Public School}{Bhubaneswar, Odisha}
      {Class XII (CBSE Science) -- 96.4\\%}{2019 -- 2021}
  \\resumeSubHeadingListEnd

\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Programming Languages}{: C++, Java, Python, JavaScript, TypeScript, SQL} \\\\
     \\textbf{Web Development}{: React.js, Node.js, Express.js, Tailwind CSS, Next.js, HTML5, CSS3} \\\\
     \\textbf{Core CS Fundamentals}{: Data Structures \\& Algorithms, OOPs, Database Management Systems, System Design Basics} \\\\
     \\textbf{Developer Tools}{: Git, GitHub, VS Code, Postman, MongoDB, MySQL, Linux, Netlify}
    }}
 \\end{itemize}

\\section{Academic \\& Personal Projects}
  \\resumeSubHeadingListStart
    \\resumeProjectHeading
        {\\textbf{AlumniConnect -- University Portal} $|$ \\emph{MERN Stack, JWT Auth, Cloudinary}}{2024}
        \\resumeItemListStart
          \\resumeItem{Engineered full-stack alumni networking portal enabling mentorship matching, job postings, and direct messaging.}
          \\resumeItem{Implemented secure role-based JWT authentication and automated email verification workflows using Nodemailer.}
        \\resumeItemListEnd
    \\resumeProjectHeading
        {\\textbf{Algorithm Visualizer} $|$ \\emph{React, JavaScript, CSS3, Vercel}}{2023}
        \\resumeItemListStart
          \\resumeItem{Built interactive educational tool demonstrating sorting (Quick, Merge) and graph pathfinding (Dijkstra, A*) algorithms.}
          \\resumeItem{Used by 1,500+ students during campus placement preparation season.}
        \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Competitive Programming \\& Achievements}
  \\resumeItemListStart
    \\resumeItem{\\textbf{Knight on LeetCode} (Max Rating: 1980+, solved 750+ algorithmic problems).}
    \\resumeItem{\\textbf{4-Star Coder on CodeChef} (Max Rating: 1850+); qualified for ICPC Asia Regional Contest 2023.}
    \\resumeItem{\\textbf{Winner} of Smart India Hackathon (NIT Rourkela Internal Round) among 45 competing engineering teams.}
    \\resumeItem{\\textbf{Technical Lead} at Google Developer Student Clubs (GDSC) NIT Rourkela chapter, mentoring 200+ members.}
  \\resumeItemListEnd

\\end{document}
`;

/* ══════════════════════════════════════════════════════════════════════════════
   9. DEEDY MODERN TECH CV
══════════════════════════════════════════════════════════════════════════════ */
export const deedyModernLatex = `%-------------------------
% Deedy Modern Tech Resume
%------------------------

\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{tabularx}
\\input{glyphtounicode}
\\pdfgentounicode=1

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape Lucas Dubois} \\\\ \\vspace{2pt}
    \\small San Francisco, CA $|$ \\href{mailto:lucas.dubois@stanford.alumni.edu}{\\underline{lucas.dubois@stanford.alumni.edu}} $|$ \\href{https://github.com/lucasdubois}{\\underline{github.com/lucasdubois}} $|$ \\href{https://lucasdubois.dev}{\\underline{lucasdubois.dev}}
\\end{center}

\\section{Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Senior Software Engineer}{2022 -- Present}
      {OpenAI}{San Francisco, CA}
      \\resumeItemListStart
        \\resumeItem{Architected low-latency streaming infrastructure for real-time model token generation serving 100M+ weekly active users.}
        \\resumeItem{Optimized asynchronous GPU scheduler queues in Rust and C++, boosting overall compute cluster utilization by 34\\%.}
      \\resumeItemListEnd

    \\resumeSubheading
      {Software Engineer}{2020 -- 2022}
      {Scale AI}{San Francisco, CA}
      \\resumeItemListStart
        \\resumeItem{Built 3D LiDAR annotation pipeline in WebGL and React, scaling label throughput to 10M frames/month.}
        \\resumeItem{Engineered distributed task distribution service in Python and Celery processing 500k labeling tasks daily.}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Stanford University}{Stanford, CA}
      {B.S. in Symbolic Systems \\& Computer Science -- GPA: 3.91}{2016 -- 2020}
  \\resumeSubHeadingListEnd

\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Languages}{: Rust, C++, Python, TypeScript, Go, SQL} \\\\
     \\textbf{Systems \\& Infra}{: Distributed Systems, WebAssembly, CUDA, Docker, Kubernetes, Linux Kernel, Redis} \\\\
     \\textbf{Web \\& Graphics}{: React, Next.js, WebGL, Three.js, WebSockets, TailwindCSS}
    }}
 \\end{itemize}

\\section{Open Source Projects}
  \\resumeSubHeadingListStart
    \\resumeProjectHeading
        {\\textbf{HyperGPU -- Async Compute Runtime} $|$ \\emph{Rust, CUDA, PyTorch}}{2023}
        \\resumeItemListStart
          \\resumeItem{Built open-source asynchronous CUDA tensor execution library with 3,500+ GitHub stars.}
        \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\end{document}
`;

/* ══════════════════════════════════════════════════════════════════════════════
   10. MINIMALIST CLEAN SANS (INTER)
══════════════════════════════════════════════════════════════════════════════ */
export const minimalSansLatex = `%-------------------------
% Minimalist Clean Sans Resume
%------------------------

\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{tabularx}
\\input{glyphtounicode}
\\pdfgentounicode=1

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape Chloe Bennett} \\\\ \\vspace{2pt}
    \\small Chicago, IL $|$ +1 (312) 555-0188 $|$ \\href{mailto:chloe.bennett.dev@gmail.com}{\\underline{chloe.bennett.dev@gmail.com}} $|$ \\href{https://linkedin.com/in/chloebennett-dev}{\\underline{linkedin.com/in/chloebennett-dev}}
\\end{center}

\\section{Summary}
Full Stack Product Engineer specializing in accessible, responsive web applications, design systems, and component architecture. Experienced in partnering with product and design to deliver pixel-perfect user experiences for 5M+ active users.

\\section{Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Frontend}{: TypeScript, React, Next.js, Vue.js, Tailwind CSS, Radix UI, Figma, Web Accessibility (WCAG 2.1 AA)} \\\\
     \\textbf{Backend}{: Node.js, Express, PostgreSQL, Prisma, GraphQL, REST APIs, Jest, Cypress} \\\\
     \\textbf{Tools}{: Git, Docker, Storybook, Vite, Webpack, Vercel, Supabase}
    }}
 \\end{itemize}

\\section{Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Senior Frontend Engineer}{2022 -- Present}
      {Morningstar}{Chicago, IL}
      \\resumeItemListStart
        \\resumeItem{Spearheaded development of enterprise financial design system adopted by 180+ developers across 14 product teams.}
        \\resumeItem{Audited and remediated accessibility violations across flagship web portal, achieving 100\\% WCAG 2.1 AA compliance.}
        \\resumeItem{Reduced frontend bundle sizes by 42\\% utilizing tree-shaking, code splitting, and dynamic asset imports.}
      \\resumeItemListEnd

    \\resumeSubheading
      {Frontend Developer}{2020 -- 2022}
      {Groupon}{Chicago, IL}
      \\resumeItemListStart
        \\resumeItem{Engineered customer checkout funnel enhancements resulting in a 3.8\\% lift in completed checkout conversions.}
        \\resumeItem{Built end-to-end testing suite in Cypress and Jest, cutting regression defect rates by 50\\%.}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {University of Illinois Urbana-Champaign}{Urbana, IL}
      {Bachelor of Science in Computer Science}{2016 -- 2020}
  \\resumeSubHeadingListEnd

\\end{document}
`;

export const defaultResumeData: ResumeData = {
  personalInfo: {
    fullName: "Alex Rivera",
    jobTitle: "Software Engineer",
    email: "alex.rivera@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexrivera-dev",
    github: "github.com/alexrivera",
    portfolio: "alexrivera.dev",
    summary:
      "Results-oriented Software Engineer with 3+ years of experience building scalable distributed web applications, cloud microservices, and high-throughput real-time architectures. Proven track record in boosting system reliability by 40% and reducing API latency.",
  },
  experience: [
    {
      id: "exp-1",
      company: "Stripe",
      role: "Software Development Engineer",
      location: "San Francisco, CA",
      startDate: "Jun 2023",
      endDate: "Present",
      current: true,
      bullets: [
        "Architected and deployed a distributed payment processing pipeline in Go and PostgreSQL, handling over 2.5M daily transactions with 99.99% uptime.",
        "Optimized database query caching using Redis, reducing P99 latency by 35% and saving $45,000 in monthly AWS infrastructure expenses.",
        "Collaborated with cross-functional engineering teams to implement automated CI/CD canary deployments across Kubernetes clusters.",
      ],
    },
    {
      id: "exp-2",
      company: "DoorDash",
      role: "Associate Software Engineer",
      location: "San Jose, CA",
      startDate: "Jan 2022",
      endDate: "May 2023",
      current: false,
      bullets: [
        "Engineered real-time order tracking WebSocket services in Node.js and TypeScript, serving 500k+ active mobile app users.",
        "Refactored legacy monolithic services into containerized microservices, boosting team deployment velocity by 50%.",
        "Wrote unit and integration test suites using Jest, increasing overall test coverage from 62% to 91%.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      location: "Berkeley, CA",
      startDate: "Aug 2018",
      endDate: "May 2022",
      current: false,
      gpa: "3.85 / 4.0",
      bullets: [
        "Dean's Honor List (6 Semesters)",
        "Relevant Coursework: Data Structures & Algorithms, Operating Systems, Database Systems, Computer Networks, Distributed Systems",
      ],
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "CloudScale - Microservice Load Balancer",
      techStack: ["Go", "Docker", "gRPC", "Prometheus", "Grafana"],
      liveUrl: "https://cloudscale-demo.dev",
      githubUrl: "https://github.com/alexrivera/cloudscale",
      date: "2023",
      bullets: [
        "Constructed a high-concurrency Layer 7 load balancer in Go utilizing round-robin and least-connections routing algorithms.",
        "Benchmarked throughput to sustain 100,000+ simultaneous requests per second with sub-5ms routing overhead.",
        "Integrated Prometheus metrics exporter with custom Grafana telemetry dashboards for real-time traffic monitoring.",
      ],
    },
    {
      id: "proj-2",
      name: "CodePulse - Real-time Collaborative IDE",
      techStack: ["Next.js", "TypeScript", "WebSockets", "Monaco Editor", "PostgreSQL"],
      liveUrl: "https://codepulse.app",
      githubUrl: "https://github.com/alexrivera/codepulse",
      date: "2022",
      bullets: [
        "Developed a browser-based collaborative coding environment with CRDT operational transform algorithms for multi-user editing.",
        "Integrated Monaco Editor with multi-language syntax highlighting, real-time cursor presence, and in-browser code execution sandbox.",
      ],
    },
  ],
  skills: [
    {
      id: "skill-1",
      name: "Languages",
      skills: ["TypeScript", "JavaScript", "Go", "Python", "Java", "C++", "SQL"],
    },
    {
      id: "skill-2",
      name: "Frameworks & Libraries",
      skills: ["React", "Next.js", "Node.js", "Express", "TailwindCSS", "Prisma", "gRPC"],
    },
    {
      id: "skill-3",
      name: "Cloud & Developer Tools",
      skills: ["Git", "Docker", "Kubernetes", "AWS (EC2, S3, RDS)", "Redis", "PostgreSQL", "Linux", "CI/CD"],
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Developer – Associate",
      issuer: "Amazon Web Services",
      issueDate: "2023",
    },
  ],
  achievements: [
    {
      id: "ach-1",
      title: "Winner - CalHacks Hackathon (1st place among 400+ teams)",
      organization: "UC Berkeley",
      date: "2022",
    },
  ],
  customSections: [],
  theme: {
    primaryColor: "#0f172a",
    accentColor: "#334155",
    textColor: "#0f172a",
    backgroundColor: "#ffffff",
    fontFamily: "Computer Modern",
    fontSize: "md",
    margins: "normal",
    lineHeight: "normal",
    layout: "single-column",
    sectionOrder: ["experience", "projects", "education", "skills", "certifications", "achievements"],
  },
};

/* ══════════════════════════════════════════════════════════════════════════════
   10 COMPLETE, UNIQUE RESUME TEMPLATES LIST
══════════════════════════════════════════════════════════════════════════════ */
export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "jakes-resume",
    name: "Jake's Resume (ATS Gold Standard)",
    description: "The iconic, battle-tested standard for Software Engineers & Tech roles. 100% ATS score guaranteed.",
    category: "ats-classic",
    badgeText: "SWE Gold Standard",
    isLatexNative: true,
    defaultMode: "latex",
    previewGradient: "from-muted/80 to-muted/40",
    defaultData: defaultResumeData,
    defaultLatex: jakesResumeLatex,
  },
  {
    id: "faang-tech",
    name: "FAANG / Google Impact Resume",
    description: "Features FontAwesome icons, project action badges (Demo, Code, APK), and metrics-driven bullets.",
    category: "faang-tech",
    badgeText: "Icons & Badges",
    isLatexNative: true,
    defaultMode: "latex",
    previewGradient: "from-muted/80 to-muted/40",
    defaultData: {
      ...defaultResumeData,
      personalInfo: {
        ...defaultResumeData.personalInfo,
        fullName: "Gyanranjan Priyam",
        email: "contact.gyanranjan@gmail.com",
        location: "Kalahandi, Odisha",
        linkedin: "linkedin.com/in/gyanranjan-priyam",
        github: "github.com/Gyanranjan-Priyam",
        portfolio: "gyanranjanpriyam.tech",
      },
      theme: {
        ...defaultResumeData.theme,
        fontFamily: "Computer Modern",
      },
    },
    defaultLatex: faangTechLatex,
  },
  {
    id: "harvard-executive",
    name: "Harvard Clean Executive",
    description: "Prestigious Ivy-League serif typography with executive summaries and enterprise achievements.",
    category: "executive",
    badgeText: "Executive & Tech Lead",
    isLatexNative: true,
    defaultMode: "visual",
    previewGradient: "from-muted/80 to-muted/40",
    defaultData: {
      ...defaultResumeData,
      personalInfo: {
        fullName: "Marcus Sterling",
        jobTitle: "Principal Systems Architect",
        email: "m.sterling@post.harvard.edu",
        phone: "+1 (617) 555-0199",
        location: "Boston, MA",
        linkedin: "linkedin.com/in/marcussterling",
        summary: "Strategic Engineering Leader with 8+ years scaling high-reliability distributed systems. Champion of architectural excellence and cloud cost optimization.",
      },
      theme: {
        ...defaultResumeData.theme,
        fontFamily: "Times New Roman",
      },
    },
    defaultLatex: harvardExecutiveLatex,
  },
  {
    id: "data-scientist",
    name: "Data Scientist & ML Engineer",
    description: "Tailored for PyTorch, LLMs, Computer Vision, MLOps, Big Data pipelines, and AI research achievements.",
    category: "faang-tech",
    badgeText: "AI & Machine Learning",
    isLatexNative: true,
    defaultMode: "latex",
    previewGradient: "from-muted/80 to-muted/40",
    defaultData: {
      ...defaultResumeData,
      personalInfo: {
        fullName: "Sophia Chen",
        jobTitle: "Machine Learning Engineer",
        email: "sophia.chen.ai@gmail.com",
        phone: "+1 (212) 555-0145",
        location: "New York, NY",
        linkedin: "linkedin.com/in/sophia-chen-ml",
        github: "github.com/sophiachen-ml",
        summary: "Machine Learning Engineer specializing in Large Language Models, RAG retrieval architectures, and high-throughput inference serving.",
      },
      theme: {
        ...defaultResumeData.theme,
        fontFamily: "Computer Modern",
      },
    },
    defaultLatex: dataScientistLatex,
  },
  {
    id: "cloud-devops",
    name: "Cloud DevOps & SRE Engineer",
    description: "Designed for AWS, Kubernetes, Terraform, Prometheus, CI/CD, and 99.999% uptime achievements.",
    category: "faang-tech",
    badgeText: "DevOps & Cloud SRE",
    isLatexNative: true,
    defaultMode: "latex",
    previewGradient: "from-muted/80 to-muted/40",
    defaultData: {
      ...defaultResumeData,
      personalInfo: {
        fullName: "David Miller",
        jobTitle: "Senior Site Reliability Engineer",
        email: "david.miller.sre@gmail.com",
        phone: "+1 (206) 555-8392",
        location: "Seattle, WA",
        github: "github.com/davidmiller-sre",
        summary: "Cloud Architect and SRE with deep expertise in multi-cluster Kubernetes, GitOps, zero-trust security, and automated incident recovery.",
      },
      theme: {
        ...defaultResumeData.theme,
        fontFamily: "Computer Modern",
      },
    },
    defaultLatex: devopsSreLatex,
  },
  {
    id: "fullstack-mobile",
    name: "Full Stack & Mobile Developer",
    description: "Emphasizes React Native, Flutter, Next.js, App Store / Play Store launches, and high-traffic APIs.",
    category: "creative-tech",
    badgeText: "Web & Mobile Specialist",
    isLatexNative: true,
    defaultMode: "latex",
    previewGradient: "from-muted/80 to-muted/40",
    defaultData: {
      ...defaultResumeData,
      personalInfo: {
        fullName: "Ethan Walker",
        jobTitle: "Senior Full Stack & Mobile Developer",
        email: "ethan.walker.dev@gmail.com",
        phone: "+1 (512) 555-0174",
        location: "Austin, TX",
        github: "github.com/ethanwalker-dev",
        portfolio: "ethanwalker.io",
        summary: "Full stack mobile and web engineer with 50,000+ app store downloads and deep proficiency in offline-first architectures.",
      },
      theme: {
        ...defaultResumeData.theme,
        fontFamily: "Outfit",
      },
    },
    defaultLatex: fullstackMobileLatex,
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity & Systems Engineer",
    description: "Highlights Low-Level C/Rust, Kernel eBPF, CVE Disclosures, DefCon speaking, and OSCP certifications.",
    category: "faang-tech",
    badgeText: "AppSec & Low-Level",
    isLatexNative: true,
    defaultMode: "latex",
    previewGradient: "from-muted/80 to-muted/40",
    defaultData: {
      ...defaultResumeData,
      personalInfo: {
        fullName: "Nathan Vance",
        jobTitle: "Senior Security Engineer",
        email: "nathan.vance.sec@gmail.com",
        phone: "+1 (202) 555-0142",
        location: "Washington, D.C.",
        github: "github.com/nathanvance-sec",
        summary: "Offensive and defensive security researcher with multiple published Zero-Day CVE disclosures and kernel-level runtime expertise.",
      },
      theme: {
        ...defaultResumeData.theme,
        fontFamily: "Source Code Pro",
      },
    },
    defaultLatex: cybersecurityLatex,
  },
  {
    id: "student-fresher",
    name: "Student & Campus Placement",
    description: "Education-first format highlighting university CGPA, coursework, competitive programming, and GDSC club leadership.",
    category: "minimal-fresher",
    badgeText: "Interns & Placements",
    isLatexNative: true,
    defaultMode: "latex",
    previewGradient: "from-muted/80 to-muted/40",
    defaultData: {
      ...defaultResumeData,
      personalInfo: {
        fullName: "Rohan Sharma",
        jobTitle: "Computer Science Undergraduate",
        email: "rohan.sharma.cs@gmail.com",
        phone: "+91 98765 43210",
        location: "Bhubaneswar, India",
        linkedin: "linkedin.com/in/rohansharma-cs",
        github: "github.com/rohansharma-dev",
        summary: "Final year CS student with 750+ LeetCode problems solved, ICPC Regional qualification, and strong full-stack skills.",
      },
      theme: {
        ...defaultResumeData.theme,
        fontFamily: "Computer Modern",
      },
    },
    defaultLatex: studentFresherLatex,
  },
  {
    id: "deedy-modern",
    name: "Deedy Modern Tech CV",
    description: "Compact, high-density single page tech CV designed for AI labs, quant trading, and startup founders.",
    category: "faang-tech",
    badgeText: "High Density Tech",
    isLatexNative: true,
    defaultMode: "latex",
    previewGradient: "from-muted/80 to-muted/40",
    defaultData: {
      ...defaultResumeData,
      personalInfo: {
        fullName: "Lucas Dubois",
        jobTitle: "Senior Software Engineer",
        email: "lucas.dubois@stanford.alumni.edu",
        phone: "+1 (415) 555-0163",
        location: "San Francisco, CA",
        github: "github.com/lucasdubois",
        portfolio: "lucasdubois.dev",
        summary: "High-performance systems engineer building real-time GPU token streaming and WebGL graphics engines.",
      },
      theme: {
        ...defaultResumeData.theme,
        fontFamily: "Inter",
      },
    },
    defaultLatex: deedyModernLatex,
  },
  {
    id: "minimal-sans",
    name: "Minimalist Clean Sans (Inter)",
    description: "Modern Swiss typography with generous spacing, product engineering highlights, and WCAG accessibility focus.",
    category: "ats-classic",
    badgeText: "Design & Product SWE",
    isLatexNative: true,
    defaultMode: "visual",
    previewGradient: "from-muted/80 to-muted/40",
    defaultData: {
      ...defaultResumeData,
      personalInfo: {
        fullName: "Chloe Bennett",
        jobTitle: "Senior Frontend Product Engineer",
        email: "chloe.bennett.dev@gmail.com",
        phone: "+1 (312) 555-0188",
        location: "Chicago, IL",
        linkedin: "linkedin.com/in/chloebennett-dev",
        summary: "Frontend product engineer specializing in enterprise design systems, component architecture, and 100% WCAG 2.1 AA accessibility.",
      },
      theme: {
        ...defaultResumeData.theme,
        fontFamily: "Inter",
      },
    },
    defaultLatex: minimalSansLatex,
  },
];

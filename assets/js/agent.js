/* Chinmay·AI — a small agent that runs entirely in the browser.
   Pipeline per question: intent router → retrieval over Chinmay's story (BM25) → grounded answer
   with sources → tools that drive the page (navigate, highlight, fit check, draft email).
   No LLM calls: if it isn't in the knowledge base, the agent says so. */
(function () {
  "use strict";

  var CD = window.CD || {};
  var G = window.gsap;
  var reduce = !!CD.reduce || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var html = document.documentElement;
  var EMAIL = CD.EMAIL || "chinmaydhamapurkar25@gmail.com";
  var LINKS = CD.LINKS || {};

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function wait(ms) { return new Promise(function (res) { setTimeout(res, reduce ? 0 : ms); }); }
  function small() { return window.innerWidth <= 600; }

  /* ================================================================
     Knowledge base: everything the agent is allowed to say
     ================================================================ */
  var CH = {
    ch1: "Ch.01 · The engineer", ch2: "Ch.02 · Recykal", ch3: "Ch.03 · ElectricPe", ch4: "Ch.04 · GWU → ABM",
    ch5: "Ch.05 · Tempora", ch6: "Ch.06 · IQRush", story: "The pattern", layers: "Nine layers",
    projects: "Side projects", contact: "Contact"
  };
  var TOPIC = {
    ch1: "your engineering roots at IIT Dharwad", ch2: "your forecasting work at Recykal", ch3: "your product work at ElectricPe",
    ch4: "your campus data work at GWU and ABM", ch5: "your LLM agents at Tempora Labs", ch6: "your work on AI search at IQRush"
  };

  var KB = [
    { id: "who", ch: "story", k: "who chinmay about intro summary background profile overview", x: "I'm Chinmay Dhamapurkar, a Senior Data Scientist at IQRush.ai, where I joined as employee #4. I trained as a mechanical engineer at IIT Dharwad, did an MS in Data Science at George Washington University, and have built ML, product and LLM systems across six chapters." },
    { id: "switch", ch: "story", k: "why switch pivot mechanical data science change career transition layers", x: "I didn't switch careers so much as add layers. Mechanical engineering gave me systems thinking, data science gave me a way to measure systems, and product taught me what's worth building. Each chapter kept the one before it." },
    { id: "iit", ch: "ch1", hl: "#ch1 .questions", k: "iit dharwad mechanical engineering btech b.tech undergrad degree 2019 2023 systems thinking", x: "I did my B.Tech in Mechanical Engineering at IIT Dharwad, 2019 to 2023. It taught me to treat every problem as a system: what goes in, what happens inside, what can be measured, and where the bottleneck is." },
    { id: "ingene", ch: "ch1", hl: "#ch1 .cast", k: "ingene motorsport powertrain engineer vehicle racing 2021 2022", x: "At InGene Motorsport I spent about a year and a half as a powertrain engineer. Every design change had a physical consequence you could measure, which is still how I think about models." },
    { id: "early", ch: "ch1", hl: "#ch1 .cast", k: "riyft oll internship design trainee summer 2021", x: "In summer 2021 I did two short placements on the mechanical and design side: design engineer trainee at RIYFT and summer intern at OLL." },
    { id: "recykal", ch: "ch2", hl: "#ch2 .viz", k: "recykal recycling logistics forecasting lstm time series pricing 2022 intern first data science job", x: "My first real data science job was an internship at Recykal, Aug to Dec 2022, in recycling logistics. I built LSTM forecasts for logistics volumes and prices, so the operation could plan ahead instead of reacting." },
    { id: "recykal2", ch: "ch2", hl: "#ch2 .stats", k: "route fuel optimization kmeans k-means clustering segmentation mask rcnn r-cnn computer vision waste images", x: "At Recykal I also worked on route and fuel optimization, K-means segmentation of customers, and Mask R-CNN segmentation of waste images. Four different kinds of model in five months, which taught me to start from the operational question rather than the algorithm." },
    { id: "epe", ch: "ch3", hl: "#ch3 .stats", k: "electricpe ev electric vehicle charging product manager apm associate prd saas b2b 2023 users", x: "At ElectricPe, Jan to May 2023, I was an Associate Product Manager on a B2B platform for EV charging. I wrote PRDs and acceptance criteria, prioritized with engineers and shipped features. The platform grew toward roughly 30,000 users while I was there. That's the company's number, not my impact, but it's the scale my product decisions worked at." },
    { id: "epe2", ch: "ch3", hl: "#ch3 .questions", k: "model not product lesson product thinking decision user done wrong", x: "ElectricPe is where I learned the model is not the product. Before I build anything I still ask who it's for, what decision they're making, what happens when the system is wrong, and what done means." },
    { id: "gwu", ch: "ch4", hl: "#ch4 .dc-wrap", k: "gwu george washington university ms masters data science gpa 3.9 fellowship global leaders dc washington 2023 2025 education degree", x: "In 2023 I moved to Washington, D.C. for an MS in Data Science at George Washington University. I graduated in May 2025 with a 3.9 GPA and the Global Leaders Fellowship." },
    { id: "gwufm", ch: "ch4", hl: "#ch4 .stats", k: "gwu facilities cmms assetworks aim buildings hvac assets work orders data quality qa analyst campus", x: "Three months into the MS I started working in GWU Facilities across 45+ buildings. I connected CMMS, finance, building-system and meter data, and built automated QA checks that flag bad asset and work-order records before they reach anyone's report." },
    { id: "energy", ch: "ch4", hl: "#ch4 .stats", k: "energy forecasting hvac sarima arima holt winters regression forecastx 30 minute building load", x: "I forecast building energy and HVAC load at 30-minute resolution with SARIMA, Holt-Winters and regression, a project I call ForecastX. Error came down 25–30% against the approach the team used before, and the range is real: the gain varied by building." },
    { id: "abm", ch: "ch4", hl: "#ch4 .dc-wrap", k: "abm industries operations research data scientist square feet work orders kpi dashboards erp bms contractor 2025 led", x: "My GWU work is how I got to ABM Industries, the facilities operator on the same campus, for the summer of 2025 (May to July). Same buildings, bigger scope: 5M+ square feet, 1,200+ work orders a month, and pipelines from CMMS, ERP and BMS into automated KPI dashboards." },
    { id: "sybil", ch: "ch5", hl: "#ch5 .stats", k: "tempora labs sybil forecasting product financial series xgboost bilstm lstm ensemble model selection mae", x: "At Tempora Labs, May 2024 to April 2025, I built Sybil, a forecasting product across 20+ financial series that picks and blends models like SARIMA, XGBoost and BiLSTM. Blending cut MAE by about 28% compared with the individual models on their own." },
    { id: "rag", ch: "ch5", hl: "#ch5 .stats", k: "rag retrieval augmented generation documents enterprise llm grounding hallucination knowledge base", x: "At Tempora I built retrieval over 10,000+ enterprise documents so LLM answers cite evidence instead of guessing." },
    { id: "agents", ch: "ch5", hl: "#ch5 .viz", k: "agents multi-agent agentic orchestration router routing intent five accuracy", x: "I built a five-agent system where an intent router decides which agent handles each request. It reached 78% routing accuracy in production. You can try a simplified version in chapter 05." },
    { id: "sql", ch: "ch5", hl: "#ch5 .stats", k: "text-to-sql text to sql nl2sql analytics natural language query turnaround analyst", x: "I built text-to-SQL that turns plain-English questions into queries. For recurring analyst requests it could answer, turnaround went from about two days to under two hours." },
    { id: "iqrush", ch: "ch6", hl: "#ch6 .stats", k: "iqrush job joined join employee 4 senior data scientist title role ai search geo visibility startup august 2025", x: "Since August 2025 I've been at IQRush.ai. I joined as employee #4 and I'm now a Senior Data Scientist. We measure and improve how companies show up in AI answers." },
    { id: "iqq", ch: "ch6", hl: "#ch6 .loop-wrap", k: "why mention brand citation question problem llm stochastic measure measurement", x: "The core question at IQRush is why an AI answer mentions one brand, page or source and not another. LLMs change their minds between runs, so before optimizing anything I build the measurement." },
    { id: "rank", ch: "ch6", hl: "#ch6 .stats", k: "ranking recommendation recommendations classifier features pr-auc roc-auc ndcg engineered features citation model", x: "I built citation classifiers and ranking models over 100+ engineered features, then turned them into recommendations customers can act on. I report PR-AUC next to ROC-AUC because citations are imbalanced, and I check calibration before a score reaches a customer." },
    { id: "eval", ch: "ch6", hl: "#ch6 .areas", k: "llm evaluation eval evals statement matching semantic similarity stability smoothing confidence instability scores", x: "For LLM evaluation I replaced a hard pass/fail cutoff with a smooth confidence roll-up. Run-to-run score instability dropped from about 62% to 12%, with similar fidelity." },
    { id: "causal", ch: "ch6", hl: "#ch6 .areas", k: "causal inference experiment experiments a/b ab test difference differences did cohort uplift intervention", x: "I measure whether a content change actually moved citations with A/B tests, cohorts and difference-in-differences, instead of stopping at correlation." },
    { id: "iqmore", ch: "ch6", hl: "#ch6 .areas", k: "retrieval emulation content playground webpage performance entity detection co-mention graph network agentic editor", x: "I also work on retrieval emulation, Content Playground (an agentic editor that writes and rescores content), webpage-level performance, entity detection, and a co-mention network of which brands appear together in AI answers." },
    { id: "loop", ch: "ch6", hl: "#ch6 .loop-wrap", k: "how work process lifecycle end to end customer product data model engineering measurement forward deployed clients azure", x: "I work across the whole loop: customer problem, product concept, measurable quantity, model, shipped feature, measurement. I'm often forward-deployed with around 10 clients, and I own the Azure pipelines end to end." },
    { id: "lead", ch: "ch6", hl: "#ch6 .loop-wrap", k: "lead leadership manage team founders coordinate engineering mentor specs", x: "At IQRush I work directly with the founders and coordinate engineering work across a small team. Most of my leadership is turning ambiguous asks into things other people can build against: PRDs, acceptance criteria, measurement definitions and recommendation rules. I did the same thing as an APM at ElectricPe." },
    { id: "fail", ch: "ch6", hl: "#ch6 .stats", k: "failure mistake wrong lesson hard threshold cutoff unstable flip", x: "The failure I talk about most: hard score cutoffs at IQRush. A statement scoring 0.469 failed and one at 0.471 passed, so customer-facing results flipped between runs. Instability was around 62%. The fix wasn't a bigger model, it was math: a smooth confidence roll-up around the threshold, which brought instability to about 12% with similar fidelity. In production ML, most of the work is the last 10%." },
    { id: "stack", ch: "layers", hl: ".marquee", k: "stack tools python sql azure langgraph mcp qlora peft pytorch tensorflow keras streamlit xgboost languages frameworks", x: "My everyday stack is Python and SQL, Azure pipelines, LangGraph and MCP for agents, QLoRA and PEFT for fine-tuning, PyTorch and TensorFlow, XGBoost, and classical time series like SARIMA and Holt-Winters." },
    { id: "projects", ch: "projects", k: "projects github side xray pneumonia crop plant disease nifty stock sentiment keyword nosql car price apartment", x: "On GitHub you'll find X-rayNet (pneumonia from chest X-rays), CropGuardian (plant disease detection), Nifty Vision (LSTM stock forecasts), HeadlineGauge (headline sentiment), keyword extraction, and a CouchDB vs MongoDB benchmark." }
  ];
  var DOC = {};
  KB.forEach(function (d) { DOC[d.id] = d; });

  /* ---------- tiny BM25 retrieval ---------- */
  var STOP = {};
  "a an the and or of to in on at for with is are was were be been it its this that what which who whom how why when where do does did you your he his him i me my we our they them can could would should about tell show give please some any there from as by into than then just also more most very today now current currently thing things like favorite favourite ve re ll".split(" ").forEach(function (w) { STOP[w] = 1; });
  function stem(w) { return w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w; }
  function toks(s) {
    return s.toLowerCase().replace(/[^a-z0-9#+.\- ]/g, " ").split(/\s+/).filter(function (w) { return w.length > 1 && !STOP[w]; }).map(stem);
  }
  var index = KB.map(function (d) {
    var t = toks(d.k + " " + d.k + " " + d.x), tf = {};
    t.forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
    return { d: d, tf: tf, len: t.length };
  });
  var avgLen = index.reduce(function (s, x) { return s + x.len; }, 0) / index.length;
  var df = {};
  index.forEach(function (x) { Object.keys(x.tf).forEach(function (w) { df[w] = (df[w] || 0) + 1; }); });
  function retrieve(q, k) {
    var qt = toks(q);
    return index.map(function (x) {
      var s = 0;
      qt.forEach(function (w) {
        var f = x.tf[w];
        if (!f) return;
        var idf = Math.log(1 + (KB.length - df[w] + 0.5) / (df[w] + 0.5));
        s += idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * x.len / avgLen));
      });
      return { d: x.d, s: s };
    }).filter(function (r) { return r.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, k || 3);
  }

  /* ================================================================
     Intent router
     ================================================================ */
  var RULES = [
    ["private", /\b(salary|compensation|pay(ing)?|visa|sponsor|relocat|how old|age\b|married|religion|address|phone number|girlfriend|boyfriend|where (is|does) (he|chinmay) (live|based|located)|based in|location)/],
    ["tour_next", /^(next|continue|go on|keep going|onward|next chapter)\W*$/],
    ["tour_stop", /^(stop|end|exit|quit|stop the tour|end tour)\W*$/],
    ["greet", /^(hi|hey|hello|yo|hiya|sup|good (morning|afternoon|evening))\b[\s!.,]*(there|chinmay)?[\s!.]*$/],
    ["available", /((is|are) (he|chinmay|you) (looking|open|available|interested))|job hunting|open to (work|opportunit|new roles)|notice period/],
    ["whoami", /^(who|what) are you\b|^are you (chinmay|him)\b|^what('s| is) your name/],
    ["thanks", /\b(thanks|thank you|thx|cheers|appreciate it)\b/],
    ["agent", /(how (do|does) (you|this|it) work|are you (a |an )?(real|human|person|bot|robot|ai|gpt|chatgpt|claude|llm)|what are you|who (made|built) you|hallucinat|your sources|what can you do)/],
    ["email", /((draft|write|compose).*(email|message|note|intro))|intro(duction)? (email|message)/],
    ["experience", /(years of experience|how (long|many years)|experience level|how senior|seniority|how experienced)/],
    ["education", /(stud(y|ied)|degree|education|universit|college|\bgpa\b|masters?\b|master's|b\.?tech|\bschool\b|graduat)/],
    ["askhim", /(what should i ask|questions? (to|for|i should) ask|interview questions|what to ask)/],
    ["measure", /(how (was|were|is|did (you|he)) .*(measur|calculat|comput|get)|how measured|baseline|methodolog|backtest|compared (to|against|with)|\bauc\b|roc|pr-auc|ndcg|precision|recall|what counts as|how do (you|we) know)/],
    ["failure", /(fail|mistake|went wrong|hard way|regret|hardest|biggest challenge|lesson learned|what broke)/],
    ["lead", /(leadership|\bmanaged?\b|managing|mentor|team size|direct reports|work with (the )?founders|lead (a |the |an )?(team|project|engineers)|how does he lead|people manag)/],
    ["joke", /\b(joke|funny|make me laugh)\b/],
    ["fit", /(\bfit\b|\bhire\b|hiring|recruit|open position|opening|candidate|good match|\bjd\b|job description|would he (be|fit|work)|could he (be|fit|work)|is he (a )?(good|right) (fit|match|candidate)|(my|our|this|the|a|an) (open )?(role|position)\b(?! at)|we('re| are) looking for|we need|requirements|responsibilit)/],
    ["tour", /(walk me|tour|guide me|take me through|full story|from the (start|beginning)|your journey|the journey|the story)/],
    ["summary", /(30[- ]?sec|thirty|tl;?dr|summary|summari[sz]e|short version|elevator|nutshell|who (are|is) (you|chinmay|he)\b|tell me about (yourself|chinmay|him)|introduce|overview)/],
    ["numbers", /(numbers|metrics|impact|results|stats|achievement|accomplish|proud)/],
    ["resume", /(resume|résumé|\bcv\b)/],
    ["contact", /(contact|email|reach (him|out)|get in touch|talk to (him|chinmay)|connect|linkedin|meet)/],
    ["projects", /(projects?|github|side project|repos?\b)/],
    ["switch", /((why|how).*(switch|pivot|move|transition|jump|go).*(data|ml|ai|software))|(mechanical.*(to|into).*(data|ml|ai))/],
    ["skills", /(skills?|stack|tools?|\btech\b|languages?|frameworks?|expertise|good at|strengths?|superpower)/],
    ["more", /^(tell me more|more|go deeper|details|elaborate|expand|and\??|go on)\W*$/],
    ["now", /(right now|currently|current (job|role|work|title|position|company|employer)|these days|at the moment|nowadays|where does (he|chinmay) work|his (title|role) now)/]
  ];
  var CH_KW = {
    ch1: ["iit", "dharwad", "mechanical", "powertrain", "motorsport", "ingene", "riyft", " oll ", "undergrad", "b.tech", "btech"],
    ch2: ["recykal", "recycl", "logistic", "lstm", "truck", "waste", "trash", "mask r-cnn", "rcnn", "k-means", "kmeans", "route optim"],
    ch3: ["electricpe", "electric pe", " ev ", "ev charg", "charging", "product manag", "apm", "prd"],
    ch4: ["gwu", "george washington", "d.c", " dc", "washington", "abm", "facilit", "campus", "cmms", "hvac", "energy", "building", "master"],
    ch5: ["tempora", "sybil", " rag ", " rag?", "agents", " agent ", "router", "routing", "text-to-sql", "text to sql", " sql"],
    ch6: ["iqrush", "iq rush", "ai search", " geo ", "citation", "llm eval", "evaluation", "visibility", "ranking", "recommendation", "causal", "employee #4", "employee 4"]
  };
  var ROLE_RX = [
    ["Founding engineer", /(founding|early[- ]stage|0 ?(to|→) ?1)/],
    ["ML Engineer", /(ml|machine learning) engineer/],
    ["Senior Data Scientist", /data scien/],
    ["Applied AI / LLM Engineer", /(applied ai|llm|ai engineer|genai|gen ai|agent)/],
    ["AI Product Manager", /(product manager|\bpm\b|ai product|technical product)/]
  ];

  function norm(s) { return " " + s.toLowerCase().replace(/\s+/g, " ").trim() + " "; }
  function chapterOf(t) {
    var best = null, bs = 0;
    Object.keys(CH_KW).forEach(function (k) {
      var s = 0;
      CH_KW[k].forEach(function (w) { if (t.indexOf(w) > -1) s += w.length > 3 ? 1.2 : 1; });
      if (s > bs) { bs = s; best = k; }
    });
    return best ? { ch: best, s: bs } : null;
  }
  function roleOf(t) {
    for (var i = 0; i < ROLE_RX.length; i++) if (ROLE_RX[i][1].test(t)) return ROLE_RX[i][0];
    return null;
  }
  function skillHits(t) {
    return SKILLS.filter(function (s) { return s.a.some(function (a) { return t.indexOf(a) > -1; }); }).length;
  }
  var SKILLQ = /((does|did|has|have|can|is) (he|chinmay|you) (know|use|used|using|work(ed)? (with|on)|have (any )?experience|familiar|experience|done|do|built|build|good at|strong in|skilled in|ever))|((experience|familiar(ity)?|expertise) (with|in))/;
  var ORGN = /\b(iit|dharwad|ingene|motorsport|riyft|oll|recykal|electricpe|gwu|george washington|abm|tempora|sybil|iqrush|facilities)\b/;
  function skillsIn(t) {
    return {
      has: SKILLS.filter(function (s) { return s.a.some(function (a) { return t.indexOf(a) > -1; }); }),
      gaps: GAPS.filter(function (g) { return g[1].test(t); }).map(function (g) { return g[0]; })
    };
  }
  function route(text) {
    var t = norm(text), raw = text.trim();
    var ch = chapterOf(t), rule = null;
    for (var i = 0; i < RULES.length; i++) if (RULES[i][1].test(t.trim())) { rule = RULES[i][0]; break; }
    if (ctx.expect === "jd") {
      var isQuestion = /^(has|have|did|does|do|is|are|can|what|how|who|when|where|why|tell|show)\b/.test(t.trim()) && raw.length < 80;
      if (!isQuestion && (!rule || rule === "fit" || rule === "skills") && raw.length > 2 && (roleOf(t) || !ch || raw.length > 60)) return { intent: "fit.report", score: 0.93 };
      ctx.expect = null;
      input.placeholder = "Ask anything…";
    }
    if (raw.length > 220 || (raw.length > 80 && skillHits(t) >= 4)) return { intent: "fit.report", score: 0.95 };
    if (rule === "fit") return roleOf(t) ? { intent: "fit.report", score: 0.94 } : { intent: "fit.ask", score: 0.9 };
    if (!rule || rule === "skills") {
      var sk = skillsIn(t), asks = SKILLQ.test(t) || /(experience|\bknow|familiar|proficien|expert|\bused\b)/.test(t) || /^(has|have|did|does|is|can) (he|chinmay)\b/.test(t.trim());
      if (asks && (sk.gaps.length || (sk.has.length && !ORGN.test(t)))) return { intent: "skill.lookup", score: 0.92 };
    }
    if (ch && (!rule || rule === "numbers" || rule === "skills" || rule === "more" || rule === "now")) return { intent: "chapter", ch: ch.ch, score: Math.min(0.97, 0.7 + ch.s * 0.1) };
    if (rule === "now") return { intent: "chapter", ch: "ch6", score: 0.9 };
    if (rule) return { intent: rule, score: 0.9 };
    return { intent: "search", score: 0.5 };
  }

  /* ================================================================
     Receipts: how each public number was measured
     ================================================================ */
  var METHODS = {
    sybil: { n: "−28% MAE · Sybil", ch: "ch5", rows: [
      ["Metric", "Mean absolute error of Sybil's blended forecast."],
      ["Compared with", "The individual models it combines (SARIMA, XGBoost, BiLSTM and simpler baselines), on the same series."],
      ["Scope", "20+ financial time series."],
      ["Caveat", "It's a gain over individual models, so it shows that blending and selection help. How much varies by series and horizon. Chinmay can walk through the backtest setup."]] },
    routing: { n: "78% · intent routing", ch: "ch5", rows: [
      ["Metric", "Share of production requests the router sent to the right one of five agents."],
      ["Why it's not higher", "It's a production number, not a benchmark. Real requests are messier than test sets."],
      ["Good follow-up", "What happened to the other 22%? That's the question worth asking Chinmay."]] },
    instability: { n: "62% → 12% · score instability", ch: "ch6", rows: [
      ["Metric", "How often a statement-level result changed between repeated runs on the same content."],
      ["Before", "A hard pass/fail cutoff: 0.469 failed, 0.471 passed, so tiny score noise flipped results."],
      ["After", "A smooth confidence roll-up around the threshold. Instability fell to about 12% with similar fidelity."],
      ["Why it matters", "Customers only trust a score that doesn't change its mind for no reason."]] },
    energy: { n: "25–30% · energy forecasts", ch: "ch4", rows: [
      ["Metric", "Reduction in forecast error for building energy and HVAC load, at 30-minute resolution."],
      ["Compared with", "The forecasting approach the facilities team used before."],
      ["Caveat", "It's a range on purpose. The gain varied by building."]] },
    sql: { n: "2 days → under 2 hours · text-to-SQL", ch: "ch5", rows: [
      ["Metric", "Turnaround on recurring analytics requests that used to go through an analyst."],
      ["Scope", "Requests the system could answer. It didn't replace every analysis."]] },
    auc: { n: "Model metrics", ch: "ch6", text: "I don't quote offline AUC or NDCG here. On an imbalanced target like citations, ROC-AUC looks great almost by default. It only means something next to the base rate, a baseline model and a leakage check, and those are internal. Chinmay reports PR-AUC alongside ROC-AUC and checks calibration before anything reaches a customer. He's happy to walk through the evaluation setup in person." }
  };
  function metricOf(t) {
    if (/\bauc\b|roc|pr-auc|ndcg|precision|recall|classifier (score|accuracy|performance)/.test(t)) return "auc";
    if (/28|mae|sybil|ensemble|blend/.test(t)) return "sybil";
    if (/78|routing|router|misrout|22%/.test(t)) return "routing";
    if (/62|12%|instab|stabil|smooth|cutoff|threshold/.test(t)) return "instability";
    if (/25|30%|energy|hvac|forecastx/.test(t)) return "energy";
    if (/2 days|two days|2d|text-to-sql|text to sql|turnaround/.test(t)) return "sql";
    return ctx.lastMetric || null;
  }
  function methodCard(key) {
    var m = METHODS[key], card = el("div", "card method");
    var h = el("div", "card-h"), hd = el("div");
    hd.appendChild(el("b", null, m.n));
    hd.appendChild(el("span", null, "How it was measured"));
    h.appendChild(hd);
    card.appendChild(h);
    var dl = el("dl");
    m.rows.forEach(function (r) {
      var d = el("div");
      d.appendChild(el("dt", null, r[0]));
      d.appendChild(el("dd", null, r[1]));
      dl.appendChild(d);
    });
    card.appendChild(dl);
    return card;
  }

  /* ================================================================
     Fit check
     ================================================================ */
  var SKILLS = [
    { n: "Python", a: ["python"], e: "Daily language in every chapter", ch: "ch6", w: 2 },
    { n: "SQL", a: ["sql", "postgres", "mysql"], e: "Text-to-SQL at Tempora; CMMS and ERP pipelines at GWU and ABM", ch: "ch5", w: 2 },
    { n: "Machine learning", a: ["machine learning", " ml ", " ml,", " ml.", "modeling", "modelling", "predictive"], e: "Classifiers, ranking and forecasting in production", ch: "ch6", w: 2 },
    { n: "LLMs and GenAI", a: ["llm", "large language", "genai", "generative", "gpt", "prompt"], e: "LLM evaluation at IQRush; RAG and agents at Tempora", ch: "ch6", w: 3 },
    { n: "RAG and retrieval", a: ["rag", "retrieval", "vector", "embedding", "semantic search"], e: "RAG over 10k+ documents; retrieval emulation at IQRush", ch: "ch5", w: 2 },
    { n: "Agents", a: ["agent", "agentic", "langgraph", "langchain", "mcp", "tool calling", "function calling", "orchestration"], e: "Five-agent router at Tempora; LangGraph and MCP at IQRush", ch: "ch5", w: 3 },
    { n: "LLM evaluation", a: ["evaluation", " eval", "benchmark", "llm-as-a-judge", "llm as a judge", "judge"], e: "Smooth confidence roll-up cut instability 62% → 12%", ch: "ch6", w: 3 },
    { n: "Ranking and recommendations", a: ["ranking", "recommend", "recsys", "personaliz", "ndcg", "learning to rank", "search relevance"], e: "Citation ranking models and recommendation systems at IQRush", ch: "ch6", w: 3 },
    { n: "Experimentation and causal inference", a: ["a/b", "ab test", "experiment", "causal", "difference-in-differences", "uplift"], e: "Difference-in-differences and cohorts on content interventions", ch: "ch6", w: 3 },
    { n: "Time series forecasting", a: ["forecast", "time series", "time-series", "arima", "sarima", "demand planning"], e: "Sybil (−28% MAE), 30-minute energy forecasts, LSTM logistics", ch: "ch5", w: 2 },
    { n: "Deep learning", a: ["deep learning", "pytorch", "tensorflow", "keras", "neural", "lstm", "transformer"], e: "LSTM and BiLSTM forecasting, Mask R-CNN, CNN side projects", ch: "ch2", w: 2 },
    { n: "Fine-tuning", a: ["fine-tun", "finetun", "qlora", "lora", "peft"], e: "QLoRA and PEFT fine-tuning for enterprise use cases", ch: "ch6", w: 2 },
    { n: "Computer vision", a: ["computer vision", "opencv", " cnn", "image", "object detection", "segmentation"], e: "Mask R-CNN waste segmentation; X-rayNet and CropGuardian", ch: "ch2", w: 1 },
    { n: "NLP", a: ["nlp", "natural language", "entity", " ner ", "sentiment", "text classification"], e: "Entity detection at IQRush; sentiment and keyword projects", ch: "ch6", w: 2 },
    { n: "Cloud and MLOps", a: ["azure", "cloud", "mlops", "deploy", "production", "monitoring", "ci/cd"], e: "Owns Azure pipelines, deployment and monitoring end to end", ch: "ch6", w: 2 },
    { n: "Data engineering and ETL", a: ["etl", "data engineering", "data pipeline", "pipelines", "warehouse", "data quality", "integration"], e: "Joined CMMS, ERP, BMS and meter data; automated QA on asset records", ch: "ch4", w: 2 },
    { n: "Product sense", a: ["product", "prd", "roadmap", "stakeholder", "cross-functional", "requirements", "user research"], e: "APM at ElectricPe; writes PRDs and prototypes at IQRush", ch: "ch3", w: 2 },
    { n: "Startup ownership", a: ["startup", "early-stage", "early stage", "founding", "0 to 1", "0→1", "zero to one", "fast-paced", "ambigu", "ownership"], e: "Employee #4 at IQRush; owns problems end to end", ch: "ch6", w: 2 },
    { n: "Optimization", a: ["optimization", "optimisation", "operations research", "logistics", "linear programming"], e: "Route and fuel optimization at Recykal; OR role at ABM", ch: "ch2", w: 1 },
    { n: "Analytics and dashboards", a: ["analytics", "dashboard", "kpi", " bi ", "reporting", "visualization", "insights"], e: "Automated KPI dashboards across 5M+ sq ft at ABM", ch: "ch4", w: 1 },
    { n: "Statistics", a: ["statistic", "probability", "hypothesis", "regression", "bayesian"], e: "MS Data Science (3.9 GPA); calibration and stability work", ch: "ch4", w: 2 },
    { n: "Client-facing work", a: ["client", "customer-facing", "forward deployed", "forward-deployed", "consult", "solutions engineer"], e: "Forward-deployed with around 10 clients at IQRush", ch: "ch6", w: 1 }
  ];
  var GAPS = [
    ["Kubernetes", /kubernetes|k8s/], ["Java", /\bjava\b/], ["Scala", /\bscala\b/], ["Spark", /\bspark\b|pyspark|databricks/],
    ["AWS", /\baws\b|sagemaker/], ["GCP", /\bgcp\b|vertex ai|bigquery/], ["Go", /\bgolang\b|\bgo\b(?= |,)/], ["Rust", /\brust\b/],
    ["C++", /c\+\+/], ["React / frontend", /\breact\b|typescript|frontend|front-end/], ["Snowflake", /snowflake/], ["dbt", /\bdbt\b/],
    ["Airflow", /airflow/], ["Tableau / Power BI", /tableau|power bi/], ["PhD", /\bphd\b|ph\.d/], ["Reinforcement learning", /reinforcement learning|\brl\b/],
    ["Mobile", /\bios\b|android|swift\b|kotlin/]
  ];
  var PRESETS = {
    "ML Engineer": "python machine learning deep learning pytorch deploy production mlops pipelines azure kubernetes llm evaluation ranking",
    "Senior Data Scientist": "python sql statistics experiment causal a/b machine learning forecast ranking recommend stakeholder product analytics",
    "Applied AI / LLM Engineer": "llm rag retrieval agent agentic langgraph evaluation fine-tuning qlora prompt python production",
    "Founding engineer": "startup founding ownership ambiguity 0 to 1 product python llm machine learning deploy client",
    "AI Product Manager": "product prd roadmap stakeholder experiment analytics llm genai requirements client"
  };

  function fitReport(text, role) {
    var t = norm(role && PRESETS[role] && text.length < 60 ? PRESETS[role] : text);
    var matched = SKILLS.filter(function (s) { return s.a.some(function (a) { return t.indexOf(a) > -1; }); });
    var gaps = GAPS.filter(function (g) { return g[1].test(t); }).map(function (g) { return g[0]; });
    var mw = matched.reduce(function (s, m) { return s + m.w; }, 0);
    var score = matched.length ? Math.round((mw / (mw + gaps.length * 1.5)) * 100) : 0;
    return { role: role || "your role", matched: matched.sort(function (a, b) { return b.w - a.w; }), gaps: gaps, score: score };
  }

  /* ================================================================
     Conversation state + DOM
     ================================================================ */
  var root = $("#agent"), panel = $("#agent-panel"), log = $("#ap-log"), chipsEl = $("#ap-chips");
  var form = $("#ap-form"), input = $("#ap-input"), orb = $("#agent-orb"), stateEl = $("#ap-state"), hudState = $("#hud-state");
  if (!root || !panel) return;

  var ctx = { last: null, used: {}, tour: -1, expect: null, role: null, greeted: false };
  var busy = false, queue = [], opened = false;
  var prefs = { voice: false, trace: true };
  try { prefs.trace = localStorage.getItem("cd-trace") !== "0"; } catch (e) {}
  root.classList.toggle("no-trace", !prefs.trace);
  $("#ap-trace").setAttribute("aria-pressed", prefs.trace ? "true" : "false");
  var hudFacts = $("#hud-facts");
  if (hudFacts) hudFacts.textContent = KB.length + " facts · 6 chapters indexed";

  var DEFAULT_CHIPS = [
    { l: "30-second version", q: "Give me the 30-second version" },
    { l: "Walk me through the story", q: "Walk me through the story" },
    { l: "Is he a fit for my team?", q: "Is he a fit for my team?" },
    { l: "Show me the numbers", q: "Show me the numbers" },
    { l: "What failed along the way?", q: "What's a failure you learned from?" },
    { l: "How do you work?", q: "How do you work?" }
  ];

  var STATE_TEXT = {
    idle: "online · grounded on " + KB.length + " facts",
    listening: "listening…",
    routing: "routing intent…",
    retrieving: "retrieving facts…",
    speaking: "answering"
  };
  var agentMode = "idle";
  function setState(m) {
    agentMode = m;
    face.mode = m;
    if (stateEl) stateEl.textContent = STATE_TEXT[m];
    if (hudState) hudState.textContent = m === "idle" ? "online" : STATE_TEXT[m].replace("…", "");
    if (CD.field) CD.field.setAgent(m);
  }

  function scrollLog() { log.scrollTop = log.scrollHeight; }
  function addUser(text) {
    var m = el("div", "msg msg-user", text);
    log.appendChild(m);
    scrollLog();
  }
  function addTrace() {
    var t = el("div", "trace");
    log.appendChild(t);
    return t;
  }
  function traceLine(t, k, v) {
    var line = el("div");
    line.appendChild(el("b", null, k));
    line.appendChild(document.createTextNode(v));
    t.appendChild(line);
    scrollLog();
  }
  function setChips(list) {
    chipsEl.innerHTML = "";
    (list || DEFAULT_CHIPS).forEach(function (c) {
      var b = el("button", "chip", c.l);
      b.type = "button";
      b.addEventListener("click", function () { ask(c.q); });
      chipsEl.appendChild(b);
    });
  }

  /* ---------- voice out (optional) ---------- */
  var synth = window.speechSynthesis;
  var voiceBtn = $("#ap-voice");
  if (!synth) voiceBtn.hidden = true;
  function speak(text) {
    if (!prefs.voice || !synth) return;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text.replace(/[→·]/g, ", "));
      u.rate = 1.04;
      u.pitch = 1;
      var vs = synth.getVoices().filter(function (v) { return /^en/i.test(v.lang); });
      var pick = vs.filter(function (v) { return /Daniel|Google UK English Male|Alex|Aaron|Arthur/i.test(v.name); })[0] || vs[0];
      if (pick) u.voice = pick;
      u.onboundary = function () { face.amp = 1; if (CD.field) { CD.field.pulse(0.5); if (CD.field.talk) CD.field.talk(1); } };
      synth.speak(u);
    } catch (e) {}
  }
  voiceBtn.addEventListener("click", function () {
    prefs.voice = !prefs.voice;
    voiceBtn.setAttribute("aria-pressed", prefs.voice ? "true" : "false");
    if (!prefs.voice && synth) synth.cancel();
    if (CD.toast) CD.toast(prefs.voice ? "Voice on. I'll read my answers aloud." : "Voice off");
  });
  $("#ap-trace").addEventListener("click", function () {
    prefs.trace = !prefs.trace;
    this.setAttribute("aria-pressed", prefs.trace ? "true" : "false");
    root.classList.toggle("no-trace", !prefs.trace);
    try { localStorage.setItem("cd-trace", prefs.trace ? "1" : "0"); } catch (e) {}
  });

  /* ---------- voice in (where the browser allows it) ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var mic = $("#ap-mic");
  if (SR && mic) {
    mic.hidden = false;
    var rec = null;
    mic.addEventListener("click", function () {
      if (rec) { rec.stop(); return; }
      try {
        rec = new SR();
        rec.lang = "en-US";
        rec.interimResults = true;
        rec.onresult = function (e) {
          var s = "";
          for (var i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
          input.value = s;
          if (e.results[e.results.length - 1].isFinal) { rec.stop(); submit(); }
        };
        rec.onerror = function () { if (CD.toast) CD.toast("Voice input isn't available here. Type your question instead."); };
        rec.onend = function () { mic.classList.remove("is-live"); rec = null; setState("idle"); };
        rec.start();
        mic.classList.add("is-live");
        setState("listening");
      } catch (e) { rec = null; if (CD.toast) CD.toast("Voice input isn't available here. Type your question instead."); }
    });
  }

  /* ================================================================
     Tools the agent can call
     ================================================================ */
  function navigate(id) {
    var target = document.getElementById(id);
    if (!target || !CD.scrollToEl) return;
    if (small()) panel.classList.add("is-peek");
    CD.scrollToEl(target);
  }
  function highlight(sel) {
    var n = sel && $(sel);
    if (!n) return;
    setTimeout(function () {
      n.classList.remove("hl-pulse");
      void n.offsetWidth;
      n.classList.add("hl-pulse");
      setTimeout(function () { n.classList.remove("hl-pulse"); }, 2600);
    }, 1500);
  }
  function runTools(tools) {
    tools.forEach(function (t) {
      if (t.name === "navigate") navigate(t.arg);
      if (t.name === "highlight") highlight(t.arg);
    });
  }
  function srcButton(ch) {
    var b = el("button", "src", CH[ch] || ch);
    b.type = "button";
    b.addEventListener("click", function () { navigate(ch); });
    return b;
  }

  /* ---------- cards ---------- */
  function fitCard(r) {
    var card = el("div", "card");
    var total = r.matched.length + r.gaps.length;
    var h = el("div", "card-h"), hd = el("div");
    hd.appendChild(el("b", null, "Evidence map · " + r.role));
    hd.appendChild(el("span", null, r.matched.length + " of " + total + " requirements have direct evidence in my story"));
    h.appendChild(hd);
    card.appendChild(h);
    var bar = el("div", "ev-bar");
    for (var i = 0; i < total; i++) bar.appendChild(el("i", i < r.matched.length ? "on" : ""));
    card.appendChild(bar);
    var ul = el("ul", "fit-list");
    r.matched.slice(0, 7).forEach(function (m) {
      var li = el("li");
      li.appendChild(el("b", null, m.n));
      li.appendChild(srcButton(m.ch));
      li.appendChild(el("span", null, m.e));
      ul.appendChild(li);
    });
    card.appendChild(ul);
    if (r.gaps.length) {
      var g = el("p", "fit-gaps");
      g.appendChild(el("b", null, "Not in my story: "));
      g.appendChild(document.createTextNode(r.gaps.join(", ") + ". Worth asking him directly."));
      card.appendChild(g);
    }
    card.appendChild(el("p", "card-note", "I don't score people. I show where the evidence is, and where it isn't."));
    return card;
  }

  var NUMS = [
    ["62→12%", "run-to-run score instability after removing hard cutoffs · IQRush", "ch6"],
    ["−28%", "MAE vs. the individual models, 20+ series · Sybil at Tempora", "ch5"],
    ["78%", "intent-routing accuracy in production · Tempora", "ch5"],
    ["2d → 2h", "turnaround on recurring analyst requests · text-to-SQL", "ch5"],
    ["25–30%", "lower energy-forecast error vs. the prior approach · GWU", "ch4"],
    ["5M+ sq ft", "campus operations data, 1,200+ work orders a month · ABM", "ch4"]
  ];
  function numbersCard() {
    var card = el("div", "card");
    var ul = el("ul", "num-list");
    NUMS.forEach(function (n) {
      var li = el("li"), b = el("button");
      b.type = "button";
      b.appendChild(el("b", null, n[0]));
      b.appendChild(el("span", null, n[1]));
      b.addEventListener("click", function () { navigate(n[2]); highlight("#" + n[2] + " .stats"); });
      li.appendChild(b);
      ul.appendChild(li);
    });
    card.appendChild(ul);
    card.appendChild(el("p", "card-note", "Every number has a definition and a baseline. Tap one to see where it happened, or ask me how it was measured."));
    return card;
  }

  var draftN = 0;
  function draftCard() {
    draftN++;
    var topic = ctx.last && TOPIC[ctx.last] ? " and " + TOPIC[ctx.last] : "";
    var role = ctx.role ? " about a " + ctx.role + " role on our team" : "";
    var subject = ctx.role ? "Intro: " + ctx.role + " role" : "Intro from your portfolio";
    var body = "Hi Chinmay,\n\nI came across your portfolio" + topic + ", and wanted to reach out" + role + ".\n\n[One or two lines about your team or project]\n\nWould you be open to a 20-minute call next week?\n\nBest,\n[Your name]";
    var card = el("div", "card draft");
    var l1 = el("label", null, "Subject"); l1.setAttribute("for", "draft-subj-" + draftN);
    var s = el("input"); s.id = "draft-subj-" + draftN; s.value = subject;
    var l2 = el("label", null, "Message"); l2.setAttribute("for", "draft-body-" + draftN);
    var ta = el("textarea"); ta.id = "draft-body-" + draftN; ta.value = body;
    var acts = el("div", "card-actions");
    var copy = el("button", "chip chip-solid", "Copy draft");
    copy.type = "button";
    copy.addEventListener("click", function () {
      var txt = "To: " + EMAIL + "\nSubject: " + s.value + "\n\n" + ta.value;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { if (CD.toast) CD.toast("Draft copied. Paste it into your email."); }, function () { ta.select(); if (CD.toast) CD.toast("Press ⌘C to copy the draft"); });
      } else { ta.select(); if (CD.toast) CD.toast("Press ⌘C to copy the draft"); }
    });
    var mail = el("a", "chip", "Open in email app");
    function sync() { mail.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(s.value) + "&body=" + encodeURIComponent(ta.value); }
    sync();
    s.addEventListener("input", sync);
    ta.addEventListener("input", sync);
    acts.appendChild(copy);
    acts.appendChild(mail);
    [l1, s, l2, ta, acts].forEach(function (n) { card.appendChild(n); });
    card.appendChild(el("p", "card-note", "Goes to " + EMAIL + ". Edit anything before you send."));
    return card;
  }
  function linkCard(items) {
    var card = el("div", "card");
    var acts = el("div", "card-actions");
    items.forEach(function (it) {
      if (it.act) {
        var b = el("button", "chip" + (it.solid ? " chip-solid" : ""), it.l);
        b.type = "button";
        b.addEventListener("click", it.act);
        acts.appendChild(b);
      } else {
        var a = el("a", "chip" + (it.solid ? " chip-solid" : ""), it.l);
        a.href = it.href; a.target = "_blank"; a.rel = "noopener";
        acts.appendChild(a);
      }
    });
    card.appendChild(acts);
    return card;
  }

  /* ================================================================
     Responses
     ================================================================ */
  var TOUR = [
    { id: "story", t: "Let's go. The short version first: I never made one clean career switch. I kept adding layers, and every chapter is still in how I work. Scroll with me, or tap Next." },
    { id: "ch1", hl: "#ch1 .questions", t: "2019. I started at IIT Dharwad as a mechanical engineer and spent a year and a half on powertrains at InGene Motorsport. That's where the habit started: what goes in, what happens inside, what can we measure, where's the bottleneck." },
    { id: "ch2", hl: "#ch2 .viz", t: "2022, Recykal. My first real data science job, as an intern: LSTM forecasts for logistics volumes and prices, route and fuel optimization, customer segmentation, and computer vision on waste images. Four kinds of model in five months." },
    { id: "ch3", hl: "#ch3 .questions", t: "2023, ElectricPe. I switched to product: PRDs, acceptance criteria, shipping features for an EV charging platform heading toward 30,000 users. It's where I learned the model is not the product." },
    { id: "ch4", hl: "#ch4 .dc-wrap", t: "Then Washington, D.C. I came for an MS at GWU and ended up running data for the campus: 45+ buildings, energy forecasts at 30-minute resolution with 25–30% lower error than the old approach, and QA checks that stop bad records before they reach reports. That work led straight to ABM Industries for the summer, at 5M+ square feet." },
    { id: "ch5", hl: "#ch5 .viz", t: "At the same time I was at Tempora Labs, building AI people use: Sybil forecasting with about 28% lower MAE than the individual models, RAG over 10,000+ documents, a five-agent router and text-to-SQL. Try the router demo on the page." },
    { id: "ch6", hl: "#ch6 .loop-wrap", t: "And now IQRush.ai, where I joined as employee #4. We measure why AI answers mention one brand and not another, and I build the measurement, the models and the product together." },
    { id: "layers", t: "That's the whole stack: nine layers, all still in use. Want me to check whether it fits a role you're hiring for?" }
  ];
  var TOUR_CHIPS = [{ l: "Next →", q: "next" }, { l: "Tell me more", q: "tell me more" }, { l: "Stop the tour", q: "stop" }];

  function chapterDocs(ch) { return KB.filter(function (d) { return d.ch === ch; }); }
  var ORG_WORDS = /\b(iit|dharwad|ingene|motorsport|riyft|oll|recykal|electricpe|electric pe|gwu|george|washington|d\.?c\.?|abm|industries|tempora|labs|iqrush|iq rush|facilities|chinmay)\b/g;
  // Specific questions get the fact that answers them (company names don't count as specific);
  // broad ones get the chapter's first two facts in story order. "More" only returns unseen facts.
  function takeUnused(ch, n, q, onlyUnused) {
    var docs = chapterDocs(ch);
    if (onlyUnused) docs = docs.filter(function (d) { return !ctx.used[d.id]; });
    if (!docs.length) return [];
    if (q) {
      var lq = q.toLowerCase(), score = {};
      retrieve(lq.replace(ORG_WORDS, " "), KB.length).forEach(function (h) { score[h.d.id] = h.s; });
      var ranked = docs.map(function (d, i) { return { d: d, i: i }; }).sort(function (a, b) { return (score[b.d.id] || 0) - (score[a.d.id] || 0) || a.i - b.i; }).map(function (x) { return x.d; });
      var top = score[ranked[0].id] || 0;
      if (top >= 0.8) {
        docs = ranked;
        if (!ranked[1] || (score[ranked[1].id] || 0) < top * 0.6) n = 1;
      } else {
        var named = (lq.match(ORG_WORDS) || []);
        if (named.length) {
          var orgScore = function (d) { var s = (d.k + " " + d.x).toLowerCase(); return named.filter(function (w) { return s.indexOf(w) > -1; }).length; };
          docs = docs.map(function (d, i) { return { d: d, i: i, s: orgScore(d) }; }).sort(function (a, b) { return b.s - a.s || a.i - b.i; }).map(function (x) { return x.d; });
        }
      }
    }
    docs = docs.slice(0, n);
    docs.forEach(function (d) { ctx.used[d.id] = 1; });
    return docs;
  }
  function nextChapter(ch) {
    var order = ["ch1", "ch2", "ch3", "ch4", "ch5", "ch6"], i = order.indexOf(ch);
    return i > -1 && i < order.length - 1 ? order[i + 1] : null;
  }
  var CH_NAME = { ch1: "IIT Dharwad", ch2: "Recykal", ch3: "ElectricPe", ch4: "GWU and ABM", ch5: "Tempora", ch6: "IQRush" };

  function respond(r, text) {
    var R = { text: "", src: [], tools: [], chips: null, card: null, hits: 0 };
    var t = norm(text);
    switch (r.intent) {
      case "greet":
        R.text = "Hey! I'm Chinmay's AI twin. I know his whole work story and I'll show you where every answer comes from. Where do you want to start?";
        break;
      case "thanks":
        R.text = "Anytime. Anything else you'd like to know?";
        break;
      case "agent":
        R.text = "I'm a small agent that runs entirely in your browser. When you ask something, an intent router classifies it, I retrieve the most relevant facts from Chinmay's story with BM25, and I answer only from those facts, with sources. There are no LLM calls, so I can't make things up. If it isn't in my memory, I'll tell you. It's the same pattern he builds at work, just tiny.\n\nThings I can do: give you the 30-second version, walk you through the story, check fit against a job description, explain how any number was measured, and draft an intro email to him.";
        R.chips = [{ l: "Show me the story", q: "Walk me through the story" }, { l: "Try a fit check", q: "Is he a fit for my team?" }];
        break;
      case "private":
        R.text = "That one's for Chinmay to answer himself, so I won't guess. Want me to draft a quick email to him?";
        R.chips = [{ l: "Draft an intro email", q: "Draft an intro email" }, { l: "30-second version", q: "Give me the 30-second version" }];
        break;
      case "summary":
        R.text = "Here's the 30-second version. I'm Chinmay: mechanical engineer from IIT Dharwad, MS in Data Science from GWU with a 3.9 GPA, now Senior Data Scientist at IQRush.ai, where I joined as employee #4.\n\nAlong the way: logistics ML at Recykal, product management at ElectricPe, campus-scale data at GWU and ABM, and LLM agents at Tempora. The pattern is always the same. Find a complicated system, measure it, make it better.";
        R.src = ["story", "ch1", "ch4", "ch6"];
        R.hits = 4;
        R.chips = [{ l: "Walk me through it", q: "Walk me through the story" }, { l: "What does he do now?", q: "What does he do at IQRush?" }, { l: "Is he a fit?", q: "Is he a fit for my team?" }];
        break;
      case "tour":
        ctx.tour = 0;
        return tourStep(R);
      case "tour_next":
        if (ctx.tour < 0) { ctx.tour = 0; return tourStep(R); }
        ctx.tour++;
        if (ctx.tour >= TOUR.length) { ctx.tour = -1; R.text = "That's the end of the tour. Ask me anything, or I can check fit for a role."; R.chips = [{ l: "Check fit", q: "Is he a fit for my team?" }, { l: "Draft an intro email", q: "Draft an intro email" }]; break; }
        return tourStep(R);
      case "tour_stop":
        ctx.tour = -1;
        R.text = "Tour stopped. I'm still here if you have questions.";
        break;
      case "chapter":
        ctx.last = r.ch;
        var docs = takeUnused(r.ch, 2, text, false);
        R.text = docs.map(function (d) { return d.x; }).join("\n\n");
        R.hits = docs.length;
        R.src = [r.ch];
        R.tools.push({ name: "navigate", arg: r.ch, label: "navigate(#" + r.ch + ")" });
        if (docs[0] && docs[0].hl) R.tools.push({ name: "highlight", arg: docs[0].hl, label: "highlight(" + docs[0].hl + ")" });
        var nx = nextChapter(r.ch);
        R.chips = [{ l: "Tell me more", q: "tell me more" }];
        if (nx) R.chips.push({ l: "Then what? → " + CH_NAME[nx], q: "Tell me about " + CH_NAME[nx] });
        R.chips.push({ l: "Is he a fit?", q: "Is he a fit for my team?" });
        break;
      case "more":
        if (ctx.tour >= 0) { var step = TOUR[ctx.tour]; if (step && /^ch/.test(step.id)) ctx.last = step.id; }
        if (!ctx.last || !/^ch/.test(ctx.last)) { R.text = "More about what? Pick a chapter and I'll go deeper."; R.chips = [{ l: "Recykal", q: "Tell me about Recykal" }, { l: "GWU → ABM", q: "How did GWU lead to ABM?" }, { l: "IQRush", q: "What does he do at IQRush?" }]; break; }
        var more = takeUnused(ctx.last, 2, null, true);
        if (!more.length) {
          R.text = "That's everything in my memory about " + CH_NAME[ctx.last] + ". Chinmay can go deeper in person.";
          R.chips = [{ l: "Draft an intro email", q: "Draft an intro email" }];
          if (nextChapter(ctx.last)) R.chips.unshift({ l: "Then what? → " + CH_NAME[nextChapter(ctx.last)], q: "Tell me about " + CH_NAME[nextChapter(ctx.last)] });
          if (ctx.tour >= 0) R.chips.unshift({ l: "Next →", q: "next" });
          break;
        }
        R.text = more.map(function (d) { return d.x; }).join("\n\n");
        R.hits = more.length;
        R.src = [ctx.last];
        if (more[0].hl) R.tools.push({ name: "highlight", arg: more[0].hl, label: "highlight(" + more[0].hl + ")" });
        R.chips = ctx.tour >= 0 ? TOUR_CHIPS : [{ l: "Next chapter", q: nextChapter(ctx.last) ? "Tell me about " + CH_NAME[nextChapter(ctx.last)] : "Show me the numbers" }, { l: "Is he a fit?", q: "Is he a fit for my team?" }];
        break;
      case "joke":
        R.text = "Why did the time series break up with the data scientist? It kept bringing up the past.\n\nThat's the only joke in my memory. Everything else is Chinmay's work story.";
        R.chips = [{ l: "30-second version", q: "Give me the 30-second version" }, { l: "Show me the numbers", q: "Show me the numbers" }];
        break;
      case "whoami":
        R.text = "I'm Chinmay's AI twin, CD-01. I know his work story, from mechanical engineering at IIT Dharwad to AI search at IQRush, and I answer only from that, with sources. I'm not him, so for anything personal I'll point you to him directly.";
        R.chips = [{ l: "30-second version", q: "Give me the 30-second version" }, { l: "How do you work?", q: "How do you work?" }, { l: "Walk me through the story", q: "Walk me through the story" }];
        break;
      case "available":
        R.text = "I can't speak for Chinmay on that, so I won't guess. The quickest way to find out is to ask him. I can draft the email for you.";
        R.chips = [{ l: "Draft an intro email", q: "Draft an intro email" }, { l: "Is he a fit?", q: "Is he a fit for my team?" }];
        break;
      case "experience":
        var yrs = Math.floor((Date.now() - new Date(2022, 7, 1).getTime()) / (365.25 * 864e5));
        R.text = "About " + yrs + " years in data science and ML: my first data science role was at Recykal in August 2022. Before that I spent 2021 and 2022 in mechanical engineering, including a year and a half as a powertrain engineer. Since then: product at ElectricPe, campus data at GWU and ABM, AI products at Tempora, and now Senior Data Scientist at IQRush.";
        R.src = ["ch2", "ch1", "ch6"];
        R.hits = 3;
        R.chips = [{ l: "Walk me through it", q: "Walk me through the story" }, { l: "Is he a fit?", q: "Is he a fit for my team?" }];
        break;
      case "education":
        R.text = "Two degrees:\n\n• B.Tech in Mechanical Engineering, IIT Dharwad (2019–2023)\n• MS in Data Science, George Washington University (2023–2025), 3.9 GPA and the Global Leaders Fellowship\n\nI worked through most of the master's, at GWU Facilities and Tempora Labs.";
        R.src = ["ch1", "ch4"];
        R.hits = 2;
        R.tools.push({ name: "navigate", arg: "ch4", label: "navigate(#ch4)" });
        R.tools.push({ name: "highlight", arg: "#ch4 .dc-wrap", label: "highlight(#ch4 .dc-wrap)" });
        R.chips = [{ l: "What did he do at GWU?", q: "What did he do at GWU Facilities?" }, { l: "Tell me about IIT", q: "Tell me about IIT Dharwad" }];
        break;
      case "skill.lookup":
        var sk = skillsIn(t), lines = [];
        sk.has.slice(0, 2).forEach(function (s) { lines.push("Yes, " + s.n + ": " + s.e + "."); });
        sk.gaps.forEach(function (g) { lines.push(g + " isn't in my story, so I can't vouch for it. Worth asking him directly."); });
        R.text = lines.join("\n\n");
        R.hits = sk.has.length;
        R.src = sk.has.slice(0, 3).map(function (s) { return s.ch; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
        R.tools.push({ name: "skills", label: "skill_lookup(" + sk.has.length + " found, " + sk.gaps.length + " not in story)" });
        R.chips = [{ l: "Check fit for a role", q: "Is he a fit for my team?" }, { l: "Full stack", q: "What's his tech stack?" }];
        break;
      case "measure":
        var mk = metricOf(t);
        if (!mk) {
          R.text = "Which number? Each public metric has a definition, a baseline and a caveat.";
          R.chips = [{ l: "The 62% → 12%", q: "How was the 62% to 12% instability measured?" }, { l: "The −28% MAE", q: "How was the 28% MAE improvement measured?" }, { l: "The 78% routing", q: "How was the 78% routing accuracy measured?" }, { l: "Model AUCs?", q: "What was the classifier AUC?" }];
          break;
        }
        ctx.lastMetric = mk;
        var M = METHODS[mk];
        R.src = [M.ch];
        R.hits = 1;
        R.tools.push({ name: "navigate", arg: M.ch, label: "navigate(#" + M.ch + ")" });
        R.tools.push({ name: "highlight", arg: "#" + M.ch + " .stats", label: "highlight(#" + M.ch + " .stats)" });
        if (M.text) { R.text = M.text; }
        else { R.text = "Here's exactly what that number means, what it's compared against, and where it stops applying."; R.card = function () { return methodCard(mk); }; }
        R.chips = [{ l: "What failed along the way?", q: "What's a failure you learned from?" }, { l: "Questions to ask him", q: "What should I ask him in an interview?" }, { l: "All the numbers", q: "Show me the numbers" }];
        break;
      case "failure":
        R.text = DOC.fail.x;
        R.src = ["ch6"];
        R.hits = 1;
        ctx.lastMetric = "instability";
        R.tools.push({ name: "navigate", arg: "ch6", label: "navigate(#ch6)" });
        R.tools.push({ name: "highlight", arg: "#ch6 .stats", label: "highlight(#ch6 .stats)" });
        R.chips = [{ l: "How was it measured?", q: "How was the 62% to 12% instability measured?" }, { l: "How does he lead?", q: "How does he lead a team?" }];
        break;
      case "lead":
        R.text = DOC.lead.x;
        R.src = ["ch6", "ch3"];
        R.hits = 1;
        R.chips = [{ l: "What failed along the way?", q: "What's a failure you learned from?" }, { l: "Is he a fit?", q: "Is he a fit for my team?" }];
        break;
      case "askhim":
        R.text = "If I were interviewing Chinmay, these are the questions that get to the real work:\n\n1. At Tempora, what happened to the 22% of requests the router got wrong?\n2. How did you backtest Sybil, and which single model came closest?\n3. At IQRush, how do you show a content change caused a citation change?\n4. What did the hard-cutoff problem teach you about shipping ML scores to customers?\n5. At GWU, which data-quality problem was hardest to fix at the source?";
        R.src = ["ch5", "ch6", "ch4"];
        R.chips = [{ l: "Draft an intro email", q: "Draft an intro email" }, { l: "Is he a fit?", q: "Is he a fit for my team?" }];
        break;
      case "numbers":
        R.text = "Here are the numbers I stand behind. Each one has a definition and a baseline, and links to where it happened.";
        R.card = numbersCard;
        R.hits = NUMS.length;
        R.src = ["ch6", "ch5", "ch4", "ch2"];
        R.chips = [{ l: "Is he a fit?", q: "Is he a fit for my team?" }, { l: "How did he get these?", q: "Walk me through the story" }];
        break;
      case "skills":
        R.text = DOC.stack.x + "\n\nThe skills that make me different are the combination: I can own the measurement, the model and the product decision in the same week.";
        R.src = ["layers", "ch6"];
        R.hits = 1;
        R.tools.push({ name: "navigate", arg: "layers", label: "navigate(#layers)" });
        R.chips = [{ l: "Check fit for a role", q: "Is he a fit for my team?" }, { l: "Show me the numbers", q: "Show me the numbers" }];
        break;
      case "switch":
        R.text = DOC.switch.x + "\n\nThe first step was Recykal in 2022, while I was still at IIT. I pointed models at logistics problems and never stopped.";
        R.src = ["story", "ch2"];
        R.hits = 2;
        R.tools.push({ name: "navigate", arg: "story", label: "navigate(#story)" });
        break;
      case "projects":
        R.text = DOC.projects.x;
        R.src = ["projects"];
        R.hits = 1;
        R.card = function () { return linkCard([{ l: "GitHub ↗", href: LINKS.github, solid: true }]); };
        R.tools.push({ name: "navigate", arg: "projects", label: "navigate(#projects)" });
        break;
      case "resume":
        R.text = "Here's Chinmay's résumé on Google Drive. It opens in a new tab.";
        R.card = function () { return linkCard([{ l: "Open résumé ↗", href: LINKS.resume, solid: true }, { l: "LinkedIn ↗", href: LINKS.linkedin }]); };
        break;
      case "contact":
        R.text = "The fastest way is email: " + EMAIL + ". I can also draft an intro for you, so you only have to hit send.";
        R.card = function () {
          return linkCard([
            { l: "Draft an intro email", act: function () { ask("Draft an intro email"); }, solid: true },
            { l: "Copy email", act: function () { if (CD.copyEmail) CD.copyEmail(); } },
            { l: "LinkedIn ↗", href: LINKS.linkedin }
          ]);
        };
        R.tools.push({ name: "navigate", arg: "contact", label: "navigate(#contact)" });
        break;
      case "email":
        R.text = "Here's a draft you can edit. I filled in what we talked about.";
        R.card = draftCard;
        R.tools.push({ name: "compose", label: "draft_email(to=chinmay" + (ctx.role ? ", role=" + ctx.role : "") + ")" });
        break;
      case "fit.ask":
        ctx.expect = "jd";
        R.text = "Happy to check. Pick a role, or paste a job description and I'll match it against what Chinmay has actually done.";
        R.chips = Object.keys(PRESETS).map(function (k) { return { l: k, q: k }; });
        input.placeholder = "Paste a job description, or name the role…";
        break;
      case "fit.report":
        var detected = roleOf(t), short = text.trim().length <= 40;
        ctx.expect = null;
        input.placeholder = "Ask anything…";
        var rep = fitReport(text, detected);
        rep.role = detected || (short ? text.trim() : "your role");
        ctx.role = rep.role === "your role" ? null : rep.role;
        if (!rep.matched.length) {
          R.text = "I couldn't find specific skills in that. Try naming the role, like \u201cML Engineer\u201d, or paste the requirements section of the job description.";
          R.chips = Object.keys(PRESETS).map(function (k) { return { l: k, q: k }; });
          ctx.expect = "jd";
          break;
        }
        var ratio = rep.matched.length / (rep.matched.length + rep.gaps.length);
        var verdict = ratio >= 0.85 ? "Strong overlap." : ratio >= 0.65 ? "Solid overlap, with a few gaps." : "Partial overlap. Worth a conversation to see whether the gaps matter.";
        R.text = verdict + " Here's how " + rep.role + " lines up with my story:";
        R.card = function () { return fitCard(rep); };
        R.hits = rep.matched.length;
        R.src = rep.matched.slice(0, 3).map(function (m) { return m.ch; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
        R.tools.push({ name: "fit", label: "fit_check(" + rep.matched.length + " matched, " + rep.gaps.length + " gaps)" });
        R.chips = [{ l: "Draft an intro email", q: "Draft an intro email" }, { l: "Show me the numbers", q: "Show me the numbers" }, { l: "Try another role", q: "Is he a fit for my team?" }];
        break;
      default:
        var hits = retrieve(text, 2);
        if (!hits.length || hits[0].s < 1.2) {
          R.text = "I don't have that in my memory, and I won't make it up. I only know Chinmay's work story. Try one of these, or ask him directly.";
          R.chips = [{ l: "30-second version", q: "Give me the 30-second version" }, { l: "Show me the numbers", q: "Show me the numbers" }, { l: "Draft an email to him", q: "Draft an intro email" }];
          break;
        }
        var top = hits.filter(function (h, i) { return i === 0 || h.s > hits[0].s * 0.7; });
        R.text = top.map(function (h) { return h.d.x; }).join("\n\n");
        R.hits = top.length;
        R.src = top.map(function (h) { return h.d.ch; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
        if (/^ch/.test(top[0].d.ch)) {
          ctx.last = top[0].d.ch;
          ctx.used[top[0].d.id] = 1;
          R.tools.push({ name: "navigate", arg: top[0].d.ch, label: "navigate(#" + top[0].d.ch + ")" });
          if (top[0].d.hl) R.tools.push({ name: "highlight", arg: top[0].d.hl, label: "highlight(" + top[0].d.hl + ")" });
        }
        R.retrieval = hits.map(function (h) { return h.d.id + " " + h.s.toFixed(2); }).join(", ");
    }
    return R;
  }
  function tourStep(R) {
    var s = TOUR[ctx.tour];
    R.text = s.t;
    R.src = [s.id];
    R.hits = 1;
    R.tools.push({ name: "navigate", arg: s.id, label: "navigate(#" + s.id + ")" });
    if (s.hl) R.tools.push({ name: "highlight", arg: s.hl, label: "highlight(" + s.hl + ")" });
    if (/^ch/.test(s.id)) {
      ctx.last = s.id;
      chapterDocs(s.id).forEach(function (d) { delete ctx.used[d.id]; }); // the tour line is a summary, so "more" can show every fact
    }
    R.chips = ctx.tour === TOUR.length - 1
      ? [{ l: "Check fit for a role", q: "Is he a fit for my team?" }, { l: "Draft an intro email", q: "Draft an intro email" }, { l: "Restart tour", q: "Walk me through the story" }]
      : TOUR_CHIPS;
    R.stepLabel = "tour " + (ctx.tour + 1) + "/" + TOUR.length;
    return R;
  }

  /* ================================================================
     The pipeline: route → retrieve → act → answer
     ================================================================ */
  function stream(bubble, text) {
    return new Promise(function (res) {
      if (reduce) { bubble.textContent = text; res(); return; }
      var words = text.split(/(\s+)/), i = 0, caret = el("span", "caret");
      bubble.textContent = "";
      var node = document.createTextNode("");
      bubble.appendChild(node);
      bubble.appendChild(caret);
      var speed = Math.max(8, Math.min(26, 2600 / words.length));
      (function step() {
        if (i >= words.length) { caret.remove(); res(); return; }
        var w = words[i++];
        node.nodeValue += w;
        if (w.trim()) { face.amp = Math.min(1, 0.35 + w.length / 9); if (CD.field) { CD.field.pulse(0.3); if (CD.field.talk) CD.field.talk(Math.min(1, 0.4 + w.length / 10)); } }
        scrollLog();
        setTimeout(step, speed + (/[.,:!?]$/.test(w) ? speed * 3 : 0));
      })();
    });
  }

  async function handle(text) {
    busy = true;
    addUser(text);
    setChips([]);
    var tr = addTrace();
    setState("routing");
    var r = route(text);
    traceLine(tr, "route", r.intent + (r.ch ? " → " + r.ch : "") + " · " + r.score.toFixed(2));
    var typing = el("div", "typing");
    typing.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(typing);
    scrollLog();
    await wait(380);
    setState("retrieving");
    var R = respond(r, text);
    traceLine(tr, "retrieve", R.retrieval ? "bm25 → " + R.retrieval : R.hits ? R.hits + " fact" + (R.hits > 1 ? "s" : "") + " from knowledge base" : "none needed");
    R.tools.forEach(function (tool) { traceLine(tr, "tool", tool.label); });
    if (R.stepLabel) traceLine(tr, "plan", R.stepLabel);
    await wait(360);
    typing.remove();
    setState("speaking");
    runTools(R.tools);
    var m = el("div", "msg msg-bot"), bubble = el("div", "bubble");
    m.appendChild(bubble);
    log.appendChild(m);
    speak(R.text);
    await stream(bubble, R.text);
    if (R.card) { var c = R.card(); m.appendChild(c); if (G && !reduce) G.from(c, { y: 12, opacity: 0, duration: 0.6, ease: "expo.out" }); }
    if (R.src.length) {
      var s = el("div", "sources");
      R.src.forEach(function (ch) { s.appendChild(srcButton(ch)); });
      m.appendChild(s);
    }
    scrollLog();
    setChips(R.chips);
    face.happyUntil = performance.now() + 1400;
    setState("idle");
    busy = false;
    if (queue.length) handle(queue.shift());
  }

  function ask(text) {
    text = (text || "").trim();
    if (!text) return;
    open(false);
    if (busy) { queue.push(text); return; }
    handle(text);
  }
  function submit() {
    var v = input.value;
    input.value = "";
    ask(v);
  }

  /* ================================================================
     Open / close
     ================================================================ */
  function greet() {
    if (ctx.greeted) return;
    ctx.greeted = true;
    var m = el("div", "msg msg-bot"), b = el("div", "bubble");
    b.textContent = "Hi, I'm Chinmay's AI twin. He finds complicated systems, learns to measure them, then makes them better. I know his whole story and I'll show my sources. Ask me anything, or pick one below.";
    m.appendChild(b);
    log.appendChild(m);
    setChips(DEFAULT_CHIPS);
  }
  function open(focus) {
    if (!opened) {
      opened = true;
      panel.hidden = false;
      root.classList.add("is-open");
      html.classList.add("agent-open");
      orb.setAttribute("aria-expanded", "true");
      hideNudge();
      if (G && !reduce) G.fromTo(panel, { opacity: 0, y: 24, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out" });
      greet();
      if (CD.relayout) CD.relayout();
    }
    panel.classList.remove("is-peek");
    if (focus) setTimeout(function () { input.focus({ preventScroll: true }); }, 60);
  }
  function close() {
    if (!opened) return;
    opened = false;
    panel.hidden = true;
    root.classList.remove("is-open");
    html.classList.remove("agent-open");
    orb.setAttribute("aria-expanded", "false");
    if (synth) synth.cancel();
    if (CD.relayout) CD.relayout();
    orb.focus({ preventScroll: true });
  }

  orb.addEventListener("click", function () { open(true); });
  $("#ap-close").addEventListener("click", function (e) { e.stopPropagation(); close(); });
  $("#ap-head").addEventListener("click", function (e) {
    if (small() && !e.target.closest("button")) panel.classList.toggle("is-peek");
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); submit(); });
  input.addEventListener("input", function () { if (!busy) setState(input.value ? "listening" : "idle"); });
  input.addEventListener("blur", function () { if (!busy && agentMode === "listening") setState("idle"); });
  panel.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

  var heroForm = $("#hero-prompt"), heroInput = $("#hero-input");
  if (heroForm) {
    heroForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = heroInput.value;
      heroInput.value = "";
      if (v.trim()) ask(v); else open(true);
    });
    heroInput.addEventListener("input", function () { if (!busy) setState(heroInput.value ? "listening" : "idle"); });
    heroInput.addEventListener("focus", function () { face.lookY = 0.8; });
  }
  document.addEventListener("keydown", function (e) {
    var b = e.target.closest && e.target.closest('[data-ask][role="button"]');
    if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); ask(b.getAttribute("data-ask")); }
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ask]");
    if (b) { e.preventDefault(); ask(b.getAttribute("data-ask")); }
  });

  /* ================================================================
     Proactive nudges as visitors reach chapters
     ================================================================ */
  var NUDGES = {
    ch2: { t: "Want to see how the Recykal forecasts worked? I can walk you through it.", q: "Tell me about Recykal" },
    ch4: { t: "Fun fact: in 2024 Chinmay was studying, forecasting campus energy and building LLM agents at the same time. Ask me how.", q: "How did GWU lead to ABM?" },
    ch5: { t: "Try the router demo, or ask me how the five agents actually worked.", q: "How did the agents work?" },
    ch6: { t: "Curious what employee #4 actually does all day?", q: "What does he do at IQRush?" },
    projects: { t: "Hiring? I can check Chinmay's fit for your role in a few seconds.", q: "Is he a fit for my team?" }
  };
  var nudge = $("#agent-nudge"), nudgeText = $("#nudge-text"), nudgeCount = 0, nudgeSeen = {}, nudgeT = 0, nudgeQ = null, bornAt = performance.now(), nudgesOff = false;
  function showNudge(id) {
    var n = NUDGES[id];
    if (!n || nudgesOff || opened || busy || nudgeSeen[id] || nudgeCount >= 3 || performance.now() - bornAt < 6000) return;
    nudgeSeen[id] = 1;
    nudgeCount++;
    nudgeQ = n.q;
    nudgeText.textContent = n.t;
    nudge.hidden = false;
    face.happyUntil = performance.now() + 1200;
    if (G && !reduce) G.fromTo(nudge, { y: 12, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "expo.out" });
    clearTimeout(nudgeT);
    nudgeT = setTimeout(hideNudge, 9000);
  }
  function hideNudge() { if (nudge) nudge.hidden = true; }
  $("#nudge-ask").addEventListener("click", function () { hideNudge(); if (nudgeQ) ask(nudgeQ); });
  $("#nudge-x").addEventListener("click", function () { hideNudge(); nudgesOff = true; });
  if (CD.onActivate) CD.onActivate(function (sec) { if (ctx.tour < 0) showNudge(sec.id); });

  /* ================================================================
     The face: a small animated avatar (dock button + header)
     ================================================================ */
  var face = { mode: "idle", amp: 0, lookX: 0, lookY: 0, tx: 0, ty: 0, blink: 0, nextBlink: 2000, happyUntil: 0 };
  var faces = [$("#orb-face"), $("#head-face")].filter(Boolean).map(function (c) { return { c: c, x: c.getContext("2d") }; });
  var accent = "#8fd3f4", accentT = 0;
  window.addEventListener("pointermove", function (e) {
    face.tx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.85) * 2.2));
    face.ty = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight - 0.85) * 2.2));
  }, { passive: true });

  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function drawFace(g, S, now) {
    var c = S / 2, t = now / 1000, mode = face.mode;
    g.clearRect(0, 0, S, S);
    // glow + body
    var grd = g.createRadialGradient(c, c, S * 0.2, c, c, S * 0.5);
    grd.addColorStop(0, "rgba(255,255,255,0.02)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
    g.beginPath();
    g.arc(c, c, S * 0.42, 0, Math.PI * 2);
    g.fillStyle = "#0b0f16";
    g.fill();
    g.globalAlpha = 0.55;
    g.strokeStyle = accent;
    g.lineWidth = S * 0.018;
    g.stroke();
    // orbit ring
    var sp = mode === "routing" || mode === "retrieving" ? 3.2 : mode === "speaking" ? 1.2 : 0.4;
    g.save();
    g.translate(c, c);
    g.rotate(t * sp);
    g.setLineDash([S * 0.035, S * 0.06]);
    g.globalAlpha = 0.7;
    g.lineWidth = S * 0.014;
    g.beginPath();
    g.arc(0, 0, S * 0.475, 0, Math.PI * 1.4);
    g.stroke();
    g.setLineDash([]);
    for (var k = 0; k < 3; k++) {
      var a = t * sp * 1.6 + (k * Math.PI * 2) / 3;
      g.globalAlpha = 0.9;
      g.fillStyle = accent;
      g.beginPath();
      g.arc(Math.cos(a) * S * 0.475, Math.sin(a) * S * 0.475, S * 0.018, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
    // visor
    var vw = S * 0.52, vh = S * 0.27, vx = c - vw / 2, vy = c - vh / 2 - S * 0.05;
    g.globalAlpha = 1;
    rr(g, vx, vy, vw, vh, vh / 2);
    g.fillStyle = "#121a26";
    g.fill();
    g.globalAlpha = 0.4;
    g.strokeStyle = accent;
    g.lineWidth = S * 0.01;
    g.stroke();
    // eyes
    g.globalAlpha = 1;
    g.fillStyle = accent;
    g.strokeStyle = accent;
    g.shadowColor = accent;
    g.shadowBlur = S * 0.08;
    var ex = S * 0.11, ey = vy + vh / 2 + face.lookY * S * 0.025, lx = face.lookX * S * 0.035;
    var happy = now < face.happyUntil;
    for (var s = -1; s <= 1; s += 2) {
      var cx = c + s * ex + lx;
      if (mode === "routing" || mode === "retrieving") {
        g.lineWidth = S * 0.022;
        g.lineCap = "round";
        g.beginPath();
        var st = t * 7 + (s > 0 ? 1.2 : 0);
        g.arc(cx, ey, S * 0.04, st, st + Math.PI * 1.3);
        g.stroke();
      } else if (happy) {
        g.lineWidth = S * 0.024;
        g.lineCap = "round";
        g.beginPath();
        g.arc(cx, ey + S * 0.02, S * 0.042, Math.PI * 1.15, Math.PI * 1.85);
        g.stroke();
      } else {
        var ew = S * 0.068, eh = S * 0.082 * (1 - face.blink * 0.88);
        rr(g, cx - ew / 2, ey - eh / 2, ew, eh, Math.min(ew, eh) / 2);
        g.fill();
      }
    }
    // mouth: a waveform when speaking
    g.shadowBlur = S * 0.04;
    var my = c + S * 0.2, bars = 7, bw = S * 0.02, gap = S * 0.028, total = bars * bw + (bars - 1) * gap, x0 = c - total / 2;
    for (var i = 0; i < bars; i++) {
      var hgt;
      if (mode === "speaking") hgt = S * 0.012 + face.amp * S * 0.075 * (0.4 + 0.6 * Math.abs(Math.sin(t * 13 + i * 1.7)));
      else if (mode === "listening") hgt = S * 0.012 + S * 0.03 * Math.max(0, Math.sin(t * 5 - i * 0.7));
      else hgt = S * 0.012;
      g.globalAlpha = mode === "idle" ? 0.5 : 0.95;
      rr(g, x0 + i * (bw + gap), my - hgt / 2, bw, hgt, bw / 2);
      g.fill();
    }
    g.shadowBlur = 0;
    g.globalAlpha = 1;
  }
  var lastFrame = performance.now();
  function faceLoop(now) {
    var dt = now - lastFrame;
    lastFrame = now;
    if (now - accentT > 250) {
      accentT = now;
      var v = getComputedStyle(html).getPropertyValue("--accent").trim();
      if (v) accent = v;
    }
    face.amp *= 0.9;
    face.lookX += (face.tx - face.lookX) * 0.08;
    face.lookY += (face.ty - face.lookY) * 0.08;
    face.nextBlink -= dt;
    if (face.nextBlink <= 0) { face.blink = 1; face.nextBlink = 2400 + Math.random() * 3200; }
    face.blink *= 0.8;
    faces.forEach(function (f) {
      if (f.c.offsetParent === null) return;
      drawFace(f.x, f.c.width, now);
    });
    requestAnimationFrame(faceLoop);
  }
  if (reduce) {
    faces.forEach(function (f) { drawFace(f.x, f.c.width, performance.now()); });
    setInterval(function () { faces.forEach(function (f) { if (f.c.offsetParent !== null) drawFace(f.x, f.c.width, performance.now()); }); }, 500);
  } else {
    requestAnimationFrame(faceLoop);
  }

  setState("idle");
  window.CDAgent = { open: open, close: close, ask: ask, explain: function (q) { var saved = ctx.expect, r = route(q); ctx.expect = saved; return r; } };
})();

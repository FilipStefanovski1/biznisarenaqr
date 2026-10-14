# Saturated / Over-pitched SDG & Social-Impact Idea Categories (and why they lose)

Research date: 2026-10-09. About 18 tool calls. Verified items carry a URL. Items under "Inferences" are reasoning, not sourced fact. Many web sources on this topic are blogs or secondary summaries, and that is flagged where relevant.

## Which idea types are most common in student SDG/impact competitions and hackathons (quantitative evidence of saturation)?

### Takeaway
I found no source that publishes Devpost project counts by theme. Devpost search returned HTTP 403 to automated fetches. The strongest quantitative evidence comes from three places. First, a University of Geneva study of 5,456 Devpost hackathons and 184,652 projects shows that SDG-themed hackathons cluster heavily on SDG 4 (education), SDG 9, SDG 8 and SDG 10. Second, app-market counts show huge saturation in some categories, such as 10,000 to 20,000 mental-health apps. Third, there is a visible lineage of near-identical winners (camera-based "which bin does this go in" recycling classifiers won in 2017, 2019 and later). Overall, the evidence of saturation is strong for edtech/AI tutors, mental-health apps and chatbots, recycling/waste-sorting classifiers, carbon-footprint trackers and food-surplus marketplaces. It is anecdotal for the rest.

### Cited Findings
**Scale of SDG hackathons and which themes dominate**
- The Geneva "Computational Diplomacy" study analysed Devpost plus GitHub data covering 5,456 distinct hackathons, 184,652 unique projects and 290,795 participants. Of these, 1,320 hackathons (37,647 projects, 139,569 participants) were associated with at least one SDG. — [Maillart et al., arXiv 2410.03286 (2024), Univ. of Geneva](https://arxiv.org/pdf/2410.03286)
- About 30% of hackathons since 2010 hold significant semantic relation to at least one SDG, and this share has been stable over time. — [arXiv 2410.03286](https://arxiv.org/pdf/2410.03286)
- The most-covered SDGs across years are SDG 4 Quality Education (24.3%), SDG 9 Industry/Innovation/Infrastructure (21.6%), SDG 8 Decent Work/Economic Growth (20.1%) and SDG 10 Reduced Inequalities (12%). SDG 7 (energy) shows bursts in 2017, 2018 and 2021. — [arXiv 2410.03286](https://arxiv.org/pdf/2410.03286); press summary at [UNIGE news](https://www.unige.ch/medias/en/2025/reinventer-la-cooperation-mondiale-grace-aux-hackathons)
- The same core general-purpose tech stack (css, javascript, html, python, java) dominates projects for all SDGs. The authors note technology usage per SDG is under 5%. — [arXiv 2410.03286](https://arxiv.org/pdf/2410.03286)
- At the MIT RAISE 2025 competition, SDG 3 (Good Health and Well-Being) and SDG 4 (Quality Education) were the most frequently addressed. — [MIT RAISE](https://raise.mit.edu/?p=916)
- At a small Ghana leavers' SDG hackathon, 11 participants chose SDG 9, 10 chose SDG 4 and 5 chose SDG 13. This sample is too small to generalise. — [Next Einstein Forum](https://nexteinstein.org/?p=15235)

**Hackathon project survival (why "yet another app" rarely matters)**
- More than one third of Devpost hackathon projects show some continuation after the event, but only about 5% are continued for more than 5 months (CSCW 2020 study, as summarised in a later paper). — [arXiv 2207.01015](https://arxiv.org/pdf/2207.01015)
- A 2025 study built a dataset of 193,353 Devpost projects to evaluate creativity and novelty at scale. Judging tools that benchmark novelty against historical Devpost projects now exist, such as the open-source "hackanalyzer". — [arXiv 2503.04290](https://arxiv.org/pdf/2503.04290); [hackanalyzer on GitHub](https://github.com/angeblecon/hackanalyzer)

**Category-level saturation evidence**
- **Mental-health apps and chatbots:** psychologist Stephen Schueller estimates 10,000 to 20,000 mental-health apps exist, and says only 1 to 3% have direct scientific evidence. — [Psychotherapy.net interview](https://www.psychotherapy.net/interview/stephen-schueller-on-mental-health-apps). A Nature Digital Medicine study found 1,435 mental-health apps and analysed 73 top ones. Of those, 64% claimed effectiveness, but only 2 of the 73 cited evidence from a study using the app. — [APA blog](https://www.psychiatry.org/news-room/apa-blogs/mental-health-apps-evidence-not-so-plentiful); [FierceHealthcare](https://www.fiercehealthcare.com/mobile/mental-health-apps-lack-scientific-evidence-efficacy). A review of anxiety and depression chatbot apps screened an initial 1,000 search results down to 11 included chatbots. — [Weill Cornell VIVO](https://vivo.weill.cornell.edu/display/n9001). Caveat: these figures are from 2019 to 2023 and predate the LLM-chatbot wave, so the real count is likely higher now (inference).
- **Carbon-footprint trackers:** a crowded field of consumer apps exists (Almond, Capture, North, Project Wren, WorldBeing, Earth Hero, and others). Critiques say they rely on manual data entry, "preach to the choir" because users must opt in, and do little to drive action beyond showing a number. — [AIGA Eye on Design](https://eyeondesign.aiga.org/carbon-tracking-apps-are-designed-to-foster-responsibility-is-this-a-flaw/); [Atmos, "Where are the good climate change apps?"](https://atmos.earth/where-are-the-good-climate-change-apps/). A founder who built a tracker and quit reported that very few people, even highly motivated ones, want to track their footprint continuously. This is a secondhand summary. — [Lloyd Alter newsletter](https://buttondown.com/lloydalter/archive/does-tracking-your-carbon-footprint-make-sense/). Student hackathon carbon-tracker projects still appear regularly, for example "JU-INNOV8 Carbon Footprint tracker and marketplace". — [HackQuest](https://hackquest.io/vi/projects/JU-INNOV8-Carbon-Footprint-tracker-and-matketplace)
- **Food-surplus marketplaces (Too Good To Go clones):** Too Good To Go reports an estimated 66.5M users and about $45.7M in funding. — [ProductMint](https://productmint.com/too-good-to-go-competitors/); Owler lists $38.5M instead, so the sources conflict. — [Owler](https://www.owler.com/company/toogoodtogoaps). Established rivals already cover the obvious variants: Karma (restaurant meals), Flashfood (grocery, up to 50% off), FoodHero, Sauvegarde, OLIO (peer-to-peer), FoodCloud (surplus to charities), Food Rescue Hero (grocery to nonprofits), Misfits Market and Imperfect Produce ("ugly" produce), Nibble, and MedZero. — [ProductMint](https://productmint.com/too-good-to-go-competitors/); [CB Insights, Nibble competitors](https://www.cbinsights.com/company/nibble-1/alternatives-competitors); [The Spoon](https://thespoon.tech/?p=9304)
- **Recycling / waste-sorting camera apps:** the same concept has won repeatedly, which shows it is long-established and now familiar to judges. Examples are TrashTag (Climathon Auckland 2017, an app that identifies trash and says how to recycle it), ContaMiNot (Hacks with Friends, U. Michigan 2019, Core ML trash identification with bin instructions), Waste Classifier (Hack:A2 Ann Arbor 2019), Sustain-ify (a Harvard hackathon winner that photographs waste and suggests upcycling plus low-carbon shopping) and Green Galaxy (Conestoga 2024, a gamified reduce/reuse/recycle app). — [Auckland Climathon](https://www.auckland.ac.nz/en/news/2017/11/01/results-inaugural-auckland-climathon.html); [U-M Hacks with Friends](https://michigan.it.umich.edu/news/2019/03/28/winning-ideas-at-hacks-with-friends-2019); [Cronicle, Hack:A2](https://cronicle.press/2019/06/09/hacka2-hackathon-winners-build-a-better-city-of-ann-arbor/); [Amrita](https://www.amrita.edu/news/amrita-students-win-grand-prize-in-a-world-renowned-hackathon-at-harvard/); [Conestoga](https://blogs1.conestogac.on.ca/news/2024/11/womens_hackathon_challenges_te.php)
- **Generic "AI chatbot for X", "blockchain for Y", todo/notes apps and data dashboards with no action** are listed as ideas judges are tired of in a 2026 hackathon blog. This is a blog, not a survey. — [WhereUElevate](https://whereuelevate.com/blogs/why-hackathon-projects-fail). A high-school guide says panels have seen "every variation" of "an app that does X". — [Veritas AI](https://www.veritasai.com/veritasaiblog/best-hackathon-project-ideas-for-high-school-students-that-actually-win)
- **YC "tarpit ideas":** these are ideas that are easy to start but hard to win, have been tried and failed many times, and are often consumer products. Commonly cited examples are a social network for college students, an AI task manager and a freelancer marketplace. The term comes from Dalton Caldwell and Michael Seibel. The YC sequel says the list is not static, because AI can revive old tarpits. — [Matt Rickard, "Tarpit Ideas"](https://mattrickard.com/tarpit-ideas); [VC Jobs Substack](https://theventurecrew.substack.com/p/y-combinator-advises-founders-to); [Summify summary of "Tarpit Ideas: The Sequel"](https://summify.io/discover/tarpit-ideas-the-sequel-GU9iT7/). These are secondary sources: the YC library page returned 404 when fetched.

### Inferences
- Over-pitched student SDG categories, ranked by strength of evidence:
  - **Strong:** (1) AI tutors and edtech platforms, since SDG 4 is the single most-covered SDG at 24%; (2) mental-health apps and chatbots, with 10k to 20k apps and little evidence behind them; (3) camera-based recycling/waste-sorting apps, which have repeated as winners since 2017 and so are no longer novel; (4) carbon-footprint trackers, a crowded field with known retention failure; (5) food-surplus marketplaces, where Too Good To Go and about 10 named rivals cover the obvious variants.
  - **Weaker (anecdotal or category logic only):** second-hand clothing marketplaces (Vinted, Depop and others exist), gamified plant-a-tree apps (Ecosia-style), volunteering-matching platforms, donation apps, smart IoT bins and air-quality monitor dashboards. I found no counts for these. Their saturation is inferred from the "yet another marketplace or app" pattern and the YC tarpit logic.
- A familiar category is not automatically a loss. Recycling classifiers won in 2017 to 2019 because they had working prototypes and ties to a local institutional goal (for example, U-M's landfill target). The losing pattern is a generic version with no specific user, partner or data advantage.
- Most SDG hackathon projects share the same web/Python stack (Geneva study), so a technically differentiated build, such as hardware, unusual data or domain-specific tooling, is itself a differentiator.

### Gaps
- No Devpost project counts by theme: Devpost search returned 403, and no published Devpost theme taxonomy was found.
- No Crunchbase counts for food-waste, second-hand fashion, volunteering or donation startups. Only named competitor lists were found.
- No 2024 to 2026 count of LLM mental-health chatbots.
- No organiser-published list of the "most common ideas we receive" from Hult Prize, ClimateLaunchpad or Enactus.

## What do judges, VCs, accelerator managers and organizers say are red flags in impact pitches?

### Takeaway
The red flags most consistently cited are: starting from a solution rather than a validated problem; weak problem validation and an unclear revenue model; vague or unmeasurable impact (impact as "fluff"); SDG labels that do not reflect real contribution (SDG/impact-washing); polished-slide culture over substance; and tech solutionism, meaning an app proposed for a structural problem without the stakeholders involved. Official Hult Prize rubric text was not retrievable.

### Cited Findings
- Hult Prize on-campus judges (MNIT Jaipur 2026 report) asked teams for stronger problem validation, clearer revenue models, better market research and measurable impact demonstrations. — [MNIT E-Cell Hult Prize report](https://examination.mnit.ac.in/TS/pdf/ECELL_HULTPRIZE.pdf)
- Hult Prize 2025 OnCampus accepts any social-enterprise idea that is "world-changing" and aligned with at least one SDG. The format is a 6-minute pitch plus 4 minutes of Q&A in at least one round. — [Hult Prize Judges Guidebook (Notion)](https://hultprizefoundation.notion.site/Judges-Guidebook-33ffd143233449f3af6b5eeef0ab57f5); [Hult blog](https://www.hult.edu/blog/?p=16459)
- SSIR's "Rethinking Business Plan Competitions" criticises a culture of "Best PowerPoint Wins" that makes running a social venture look easy. It notes that winners often believe they have found big solutions while humbler students get nothing, and it proposes "apprenticing with a problem" (months with organisations already working on the issue) before proposing a solution. — [SSIR](https://ssir.org/articles/entry/rethinking_business_plan_competitions)
- MIT Solve says judges already know why the problem matters. The pitch should spend its time on why your solution is best placed to fix it, who it affects and what comes next. — [MIT Solve, "5 Tips for the Perfect Social Impact Pitch"](https://solve.mit.edu/articles/5-tips-for-the-perfect-social-impact-pitch)
- Impact investor guidance (Hogan Lovells webinar with Mark Cheng) asks founders to state the size and severity of the problem, what is unique about their approach and how they will know it is working. — [Hogan Lovells](https://www.hoganlovellsbase.com/news/how-to-pitch-to-impact-funders)
- Founders Network pitch feedback warns against letting "impact" become fluff and says impact should be shown concretely. — [Founders Network](https://foundersnetwork.com/some-feedback-you-should-consider-for-your-pitch/)
- Villgro's president, drawing on hundreds of social entrepreneurs, says problems are easy to describe and solutions are hard to build. Only the headline was seen. — [SME Finance Forum](https://smefinanceforum.org/node/8014)
- YC Startup School (secondary summary) warns against "a solution looking for a problem" and against tarpit ideas. — [SozAI transcript summary](https://sozai.app/transcript/get-evaluate-startup-ideas-startup-school/index.md)
- Judges keep asking who would use the project and why it was made. Browser Use's guide recommends starting from a personal pain point so you are your own first user. — [Browser Use, "How to win hackathons"](https://browser-use.com/posts/how-to-win-hackathons)
- **SDG/impact-washing (regulator evidence, fund-level):** ESMA found that SDG-labelled funds do not show greater SDG alignment than non-SDG funds. It also noted that 52% of UN Global Compact participants (as of Feb 2023) joined between 2020 and early 2023, which may raise impact-washing concerns. — [CMS summary of ESMA report](https://cms.law/en/int/legal-updates/esma-reports-on-impact-washing-concerns-around-funds-focused-on-the-united-nations-sustainable-development-goals)
- Cambridge Judge Business School: corporate SDG engagement has often supported reputations through greenwashing and social washing rather than meaningful change. — [CJBS 2024 paper (PDF)](https://jbs.cam.ac.uk/wp-content/uploads/2024/07/2024-critical-perspectives-social-innovation-united-nations-goals.pdf)
- **Tech solutionism in civic and SDG hackathons:** an ASEE 2021 literature review argues issue-based hackathons prize technological solutionism over reinvestment in existing systems and are largely inaccessible to relevant stakeholders. — [ASEE PEER 37043](https://peer.asee.org/engagement-in-practice-social-performance-and-harm-in-civic-hackathons). A Tecnoscienza review defines solutionism as oversimplifying an issue to justify a tech intervention, and notes that design thinking favours problems that look "fixable" on the surface. — [Tecnoscienza](https://tecnoscienza.unibo.it/article/download/17398/16256). Counterpoint: Ermoshina's ethnography argues civic hacking can help construct public problems where institutions are distrusted. — [DOAJ / Tecnoscienza 2018](https://doaj.org/article/cf27f056015449b6b82c4186a626ef8c)

### Inferences
- Common failure modes of student SDG pitches, synthesised from the sources above:
  1. Solution-first: the app is built before talking to anyone affected.
  2. No paying customer or revenue model, because the beneficiary cannot pay and no payer (municipality, NGO, B2B buyer) has been identified.
  3. Superficial SDG link: listing 3 to 5 or more SDGs with no outcome metric (SDG-washing).
  4. An app-only fix for a structural problem (poverty, waste infrastructure, healthcare access) with no partner who controls the system.
  5. A generic clone ("Too Good To Go for X", "Uber for volunteers") with no answer to "why not the incumbent?"
  6. Outputs (downloads, users) presented as outcomes, with no baseline.
  7. Polish over validation ("Best PowerPoint Wins").
- The "SDG-washing" red flags for startup pitches are extrapolated from fund- and corporate-level evidence. I found no source that tallies SDG-washing in student pitches specifically.

### Gaps
- The official Hult Prize, ClimateLaunchpad and Enactus scoring rubrics and judge commentary were not retrieved. The guidebook selection-criteria section was not visible in results.
- No named-VC primary quote on "Uber for X" in impact specifically. The YC tarpit material is secondary.

## How do judges treat AI-wrapper ideas in 2025-2026 hackathons?

### Takeaway
I found no formal hackathon policy that penalises "ChatGPT wrappers" by name. Judging rubrics in 2025 and 2026 weight originality and craft, ask teams to separate new work from reused work, and blogs report that judges are tired of "AI chatbot for X". VCs openly discount thin wrappers with no moat. The consensus is that AI is expected, but it should be a multiplier inside a specific workflow with proprietary data or distribution, not the whole product.

### Cited Findings
- An OpenAI Build Week hackathon (Tel Aviv) judged whether a project works live, its usefulness, its originality ("does it surprise the judges") and its craft. A rough working thing beats a polished non-working one. — [Luma event page](https://luma.com/h1tnbguc?tk=KcaNiz)
- ETHGlobal "Agentic Ethereum" 2025 permits AI coding tools but requires teams to clearly distinguish what is new from what is reused. — [ETHGlobal](https://ethglobal.com/events/agents/info/details)
- A 2026 hackathon blog lists generic "AI chatbot for X" among the ideas judges are tired of. It says 2026 winners use AI as a multiplier, not the whole product. — [WhereUElevate](https://whereuelevate.com/blogs/why-hackathon-projects-fail)
- HackerEarth says judges now expect teams to use AI capabilities rather than build basic CRUD apps. — [HackerEarth](https://webflow.hackerearth.com/blog/hackathon-ideas)
- Volume: the lablab.ai "Co-Creating with GPT-5" event (Aug 2025) had 3,737 participants in 785 teams and 150 shipped projects, which shows how many similar GPT-based submissions judges see. — [lablab.ai](https://lablab.ai/ai-hackathons/co-creating-with-gpt-5/live)
- VC view: wrappers repackage someone else's foundation model, and VCs have grown wary of funding them without a moat. Jasper AI reached a $1.5B valuation in 2022 on GPT-3, stalled after ChatGPT launched, and laid off staff in 2023. — [Startup Fortune (Jul 2026)](https://startupfortune.com/what-is-an-ai-wrapper-startup-and-why-vcs-are-suddenly-skeptical/)
- The key investor test is "What's your moat beyond the foundation model?", where acceptable answers include a data flywheel, workflow integration or distribution. — [VC Beast glossary](https://vcbeast.com/venture-capital-glossary/ai-wrapper); [LaunchRock](https://www.launchrock.com/library/expert-advice/ai-wrapper)
- A VC firm's own essay, "Don't hate on GPT wrappers", describes a partner debate where a strong vertical-AI deal was derailed by "is it just a GPT wrapper?", which shows the label carries weight in investment committees. — [Three Rockers Substack](https://threerockers.substack.com/p/dont-hate-on-gpt-wrappers)
- A March 2026 consultancy report claims thin LLM workflow layers have become effectively unfundable. The firm sells custom development and its data was not found, so treat it as weak evidence. — [Baytech Consulting](https://www.baytechconsulting.com/blog/why-generic-ai-startups-are-dead-executive-playbook-moats)

### Inferences
- In SDG pitches the overlap is worst for "AI tutor" (SDG 4, already the most-covered SDG) and "AI mental-health chatbot" (SDG 3, 10k+ apps and safety concerns). Both stack the wrapper problem on top of category saturation.
- To defend an AI component in front of judges, a team should show proprietary or local data (for example, local-language or municipal datasets), a named institutional user, and a working demo.

### Gaps
- No organiser statistic on what share of 2025 to 2026 hackathon submissions were LLM wrappers.
- No official rubric line that explicitly penalises wrappers.

## Which SDGs are least often chosen by teams (under-represented)?

### Takeaway
The largest dataset (the Geneva study of 1,320 SDG hackathons on Devpost) confirms the most-covered SDGs are 4, 9, 8 and 10, and the MIT RAISE 2025 competition adds 3 and 4. The study's text does not publish a bottom ranking: the per-SDG figure (Fig. 1C) was not legible in extracted text. So "least chosen" can only be partly inferred. UN review data shows that environmental goals (6, 12, 13, 14, 15) plus SDG 10 are least reported on at national level, which is a related but different measure.

### Cited Findings
- Most covered in hackathons: SDG 4 (24.3%), SDG 9 (21.6%), SDG 8 (20.1%) and SDG 10 (12%). By implication, the remaining 13 SDGs each sit below 12%. SDG 7 shows only episodic bursts (2017, 2018, 2021). — [arXiv 2410.03286](https://arxiv.org/pdf/2410.03286)
- SDG 14 (Life Below Water) projects use distinctive tech, with unusually high use of Flutter/Dart mobile tools. Projects for SDGs 7, 13 and 14 use distinctive technology sets. — [arXiv 2410.03286](https://arxiv.org/pdf/2410.03286)
- MIT RAISE 2025: SDG 3 and SDG 4 were the most frequently addressed. — [MIT RAISE](https://raise.mit.edu/?p=916)
- In national Voluntary National Reviews (not hackathon data), the goals least reported on relate to the environment (SDGs 6, 12, 13, 14, 15) and inequality (SDG 10). The least-reported targets relate to environmental sustainability, developing-country representation in international institutions, and support to LDCs (SDG 16/17-type targets). — [UN DESA CDP, VNRs 2020](https://policy.desa.un.org/sites/default/files/inline-images/eapd2023/VNRs-2020-Goals-targets.pdf); [VNRs 2021](https://policy.desa.un.org/sites/default/files/inline-images/eapd2023/VNRs-2021-Goals-targets.pdf)

### Inferences
- These are likely under-represented in student hackathons: SDG 6 (water and sanitation), SDG 14 (life below water), SDG 15 (life on land), SDG 16 (peace, justice, institutions), SDG 17 (partnerships), SDG 1 (no poverty, as a direct target rather than via education or jobs), SDG 2 (zero hunger, beyond food-waste apps) and SDG 5 (gender equality). This rests on (a) none appearing in any top-coverage list and (b) the UN reporting gap for 6, 12, 13, 14 and 15. It is not a measured ranking.
- Caution: SDG 12 (responsible consumption) and SDG 13 (climate) are under-reported nationally, but in student pitches they attract the most saturated consumer-app ideas (food waste, recycling, carbon trackers). So the goal can be under-covered while its consumer-app ideas are saturated.
- A team choosing an under-covered SDG (for example, 6, 14, 15 or 16) with a B2B or B2G payer and a non-app component (hardware, data, process) would stand out against the SDG 4, 3 and 9 crowd. This is inference.

### Gaps
- No exact per-SDG percentages for the bottom 13 SDGs. The figure data in arXiv 2410.03286 was not extractable as text, so the supplementary materials or the Phil. Trans. R. Soc. A published version should be checked.
- No Hult Prize, ClimateLaunchpad, Enactus or UN SDG Action/Innovation Challenge statistics on SDG distribution of entries were found.

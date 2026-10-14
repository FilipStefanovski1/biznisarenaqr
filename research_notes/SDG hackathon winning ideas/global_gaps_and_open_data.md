# Global/EU SDG Gaps x Free Open Data: Candidate Problem Spaces for a 4-Day AI-Built MVP

Research date: 2026-10-09. Method: ~20 web searches/fetches. Where a figure comes from a vendor or law-firm summary rather than a primary source, that is flagged. Items written from background knowledge that were NOT re-verified this session are put in Inferences or Gaps and labelled, not presented as cited facts.

---

## Q1. Which free datasets/APIs are easiest to integrate in a weekend and give visually striking results (maps, before/after satellite, time series)?

### Takeaway
Easiest for a 4-day "wow" demo: Open-Meteo (no key, instant time series), NASA FIRMS (free key, near-real-time fire points on a map), TED API (anonymous access to EU tender notices), and FAO Whisp (open-source per-plot deforestation check). Copernicus Sentinel-2/5P via the Copernicus Data Space Ecosystem (CDSE) gives the most striking before/after imagery. Its free tier is about 10,000 processing units a month, which is enough for a demo but not for production. Pre-baking the imagery for the demo is the safe choice.

### Cited Findings

**Satellite / Earth observation**
- Copernicus Data Space Ecosystem (Sentinel Hub APIs): the free tier is reported as about **10,000 Processing Units and 10,000 requests per month, plus 12 TB transfer**, resetting monthly. openEO uses a separate credit quota of **4,000 credits per month** on a free account. These figures come from a third-party guide and a CDSE forum post, not the official quota page. — [ki-syndikat guide](https://www.ki-syndikat.de/tools/copernicus-data-space/); [CDSE forum](https://forum.dataspace.copernicus.eu/t/openeo-account-restricted/694); [CDSE openEO credit docs](https://documentation.dataspace.copernicus.eu/APIs/openEO/credit_usage.html)
- Sentinel Hub per-minute limits are reported as **300 requests/min and 300 PU/min**, returning HTTP 429 when exceeded (secondary listing). — [apis.io ESA rate limits](https://apis.io/rate-limits/esa/esa-rate-limits/)
- An official CDSE PU calculator exists for estimating cost before running requests. — [CDSE PU calculator](https://dataspace.copernicus.eu/node/2602)
- **NASA FIRMS** (active fires, MODIS/VIIRS): needs a free MAP_KEY. The limit is **5,000 transactions per 10-minute window**, and multi-day requests count as several transactions. Higher limits are granted case by case, and a status endpoint reports remaining quota. — [NASA FIRMS 2025 Q&A (PDF)](https://appliedsciences.nasa.gov/sites/default/files/2025-05/Part%203%20FIRMS%202025%20Q&A%20Session.docx.pdf); [Earthdata forum](https://forum.earthdata.nasa.gov/viewtopic.php?p=23828); [MS connector docs](https://learn.microsoft.com/en-us/connectors/nasafirms)
- FIRMS also serves WMS map layers that drop straight into Leaflet or MapLibre. — [FIRMS WMS info](https://firms2.modaps.eosdis.nasa.gov/mapserver/wms-info/)

**Deforestation / EUDR tooling (open source)**
- **FAO Whisp ("What is in that plot")** is open source. It takes plot polygons and returns zonal statistics from multiple public forest datasets, referenced to the EUDR cut-off of **31 Dec 2020** (a "convergence of evidence" method). Cooperatives can upload boundary files through the Whisp API UI. — [FAO Whisp overview (PDF)](https://www.fao.org/fileadmin/user_upload/faoweb/NFM/WhispOverview.pdf); [FAO Forest Data Partnership](https://www.fao.org/in-action/forest-data-partnership/activities/solutions/en)
- Related free tools:
  - **Open Foris Ground** (FAO + Google, offline Android field mapping that calls Whisp)
  - **TerraTrac** (TechnoServe, free Android app for coffee and cocoa farmers, built on Whisp; status page dated 2024)
  - **GeoRoots** (in-browser GeoJSON plot validation, data stays on device, 2026)
  - **AgStack asset registry** (open-source "public geoIDs")
  - EFI keeps a catalogue of free EUDR tools.
  - Sources: [EFI tools catalogue](https://efi.int/publication/what-tools-are-available-comply-eudr); [TechnoServe TerraTrac](https://www.technoserve.org/tns-labs/terratrac-eudr-compliance/); [EFI GeoRoots editor news, Feb 2026](https://efi.int/news/georoots-editor-accessible-secure-and-eudr-ready-geodata-editing-directly-your-browser-2026-02)

**Weather / air quality**
- **Open-Meteo**: no API key, free for non-commercial use, data under CC BY 4.0. There is no hard cap. Over **10,000 calls/day**, or any commercial use, they ask you to contact them or take a paid plan. — [open-meteo.com](https://open-meteo.com/); [Open-Meteo GitHub terms](https://gitlink.org.cn/dnrops/open-meteo)
- **OpenAQ v3**: free API key sent in the `X-API-Key` header. Third-party listings give **60 req/min and 2,000 req/hour**; the official page was not confirmed. — [OpenAQ API key docs](https://docs.openaq.org/using-the-api/api-key); [API Bouncer listing](https://apibouncer.com/apis/396/openaq)

**Public procurement (SDG 16)**
- **TED API** (EU Tenders Electronic Daily): **anonymous access** to every endpoint for published notices. An API key is needed only for unpublished notices. Supports expert search queries, bulk XML downloads, and Linked Open Data through a SPARQL endpoint. eForms coverage by year is uneven (a slide marks 2024 as "being finalised"). — [TED API docs](https://docs.ted.europa.eu/api/latest/index.html); [TED developers corner](https://ted.europa.eu/en/simap/developers-corner); [EEAS TED eForms deck](https://eeas.europa.eu/sites/default/files/public_procurement_data_in_the_eu_-_ted_eforms.pdf)
- **opentender.eu**: about **22 million tenders, roughly 2009 to 2024**, built from TED and national sources, updated half-yearly. Includes buyer and supplier profiles and integrity indicators. — [OP "public procurement data superpowers" deck](https://op.europa.eu/documents/d/public-procurement-data-superpowers/day1_r1_1600_1745_czibik)
- Existing red-flag tools on TED data:
  - **TI EU Integrity Watch Red Flags**: 20 risk indicators, about 40,000 EU-funded contracts plus about 320,000 national notices from 9 countries, updated daily. — [Transparency International EU](https://transparency.eu/integrity-watch-red-flags)
  - **Hungarian Red Flags**: run by TI Hungary, K-Monitor and PetaByte. — [data.europa.eu use case](https://data.europa.eu/en/publications/use-cases/red-flags)

**Insurance / risk**
- The **EIOPA nat-cat protection gap dashboard** covers storm, flood, wildfire and earthquake in 30 European countries, with a historical gap view for 1980–2021. — [EIOPA](https://www.eiopa.europa.eu/content/eiopa-pilot-dashboard-addresses-natural-catastrophe-protection-gap_en)

**Labour / migration**
- The **Eurostat** over-qualification dataset `lfsa_eoqgan`, by citizenship, can be pulled through the Eurostat API. — [Eurostat Statistics Explained PDF](https://ec.europa.eu/eurostat/statistics-explained/SEPDF/cache/93571.pdf)

### Inferences
- **Weekend-difficulty ranking**:
  - Easiest: Open-Meteo, TED API, FIRMS. These are REST/JSON with no or free keys and give instant charts and maps.
  - Moderate: OpenAQ, Eurostat, Whisp API.
  - Hardest: raw Sentinel-2 via CDSE (auth, evalscripts, PU budgeting).
  - For before/after satellite visuals, pre-compute 3–5 hero scenes and cache PNG tiles, so the live demo doesn't depend on quota or latency.
- **Not re-verified this session** (background knowledge; check before relying on it):
  - Global Forest Watch Data API: free key, GLAD/RADD alerts and tree-cover loss.
  - OSM Overpass public instance: fair use of roughly fewer than 10,000 queries/day and under 1 GB/day, per the OSM wiki.
  - World Bank Indicators API and Eurostat API: no key.
  - GBIF API: no key for reads.
  - FAOSTAT API.
  - Copernicus Sentinel-5P NO2/CH4 layers through CDSE.
  - Open-weight multimodal LLMs (e.g. Llama, Qwen-VL, Mistral families) for extracting data from PDFs and invoices.
- Combining an LLM with structured open data is what makes these demos land for judges. Examples: an LLM reads a supplier's invoice or tender PDF and fills a VSME/CBAM/EUDR template; satellite or FIRMS data then "verifies" the claim on a map.

### Gaps
- The official CDSE "Quotas and Limitations" page was not fetched, so the 10,000 PU figure is secondary.
- OpenAQ's official rate limits were not confirmed.
- GFW, Overpass, GBIF, FAOSTAT, World Bank, EU CAP (IACS/LPIS open parcels) and cadastre access terms were not researched this session.
- National cadastre openness varies by country under the INSPIRE / High-Value Datasets regulation; not checked.

---

## Q2. Which emerging problems (2024-2026) are still under-served? Regulatory status as of Oct 2026, plus 8–12 problem spaces with statistics

### Takeaway
Three EU regulations are now firmly dated and land on small actors in the next 3–15 months:

- **EUDR**: applies 30 Dec 2026 for large and medium operators, and 30 Jun 2027 for micro and small. The Commission says there will be no further delay.
- **CBAM**: the definitive phase started 1 Jan 2026. Certificate sales open Feb 2027, and the first surrender is due 30 Sep 2027. A 50-tonne de minimis exemption applies.
- **Battery passport**: required from 18 Feb 2027.

Separately, the CSRD Omnibus I now limits mandatory reporting to companies with more than 1,000 employees and more than €450m turnover. It also caps what those companies can ask of suppliers at the VSME standard, which turns VSME into the de facto SME supplier-data format.

Beyond regulation, well-quantified and under-digitised gaps include:
- water loss (about 126 bn m³/year)
- workplace heat stress (2.41 bn workers exposed)
- procurement competition (42% single-bid contracts in the EU in 2021)
- migrant over-qualification (39.6% of non-EU citizens)
- climate insurance protection gaps (roughly 65–75% of European climate losses uninsured; 1–3 in 10 or fewer smallholders insured)

### Cited Findings

**Regulatory status (checked against 2025–2026 sources)**
- **EUDR**:
  - Regulation (EU) 2025/2650 (Dec 2025) moved application to **30 Dec 2026** for large and medium operators and **30 Jun 2027** for micro and small operators.
  - The Commission published a simplification review package on **4 May 2026**: review report, updated guidance and FAQ, a draft delegated act on product scope (Annex I), and an updated Information System implementing act. It confirmed **no further postponement**.
  - Status of that draft delegated act after May 2026 is unverified.
  - Sources: [Council press release, 18 Dec 2025](https://www.consilium.europa.eu/en/press/press-releases/2025/12/18/deforestation-council-signs-off-targeted-revision-to-simplify-and-postpone-the-regulation/); [HLC on May 2026 package](https://www.hlc.com/en/publications/eu-deforestation-regulation-commission-publishes-simplification-package-ahead-of-december-2026); [Global ELR, May 2026](https://www.globalelr.com/2026/05/european-commission-releases-new-eu-deforestation-regulation-measures/); [EC Access2Markets](https://trade.ec.europa.eu/access-to-markets/en/news/delay-until-december-2026-and-other-developments-implementation-eudr-regulation)
  - Both dates are re-confirmed by a 7 Oct 2026 article. — [Daily Coffee News, 7 Oct 2026](https://dailycoffeenews.com/2026/10/07/eudr-compliance-gaps-persist-for-smallholders-new-report-finds/)
- **CBAM**:
  - The definitive regime has applied since **1 Jan 2026**: financial liability accrues on 2026 imports, but no certificates are bought in 2026.
  - Certificate sales on the central platform start **1 Feb 2027**. The first annual declaration and surrender, covering 2026 imports, is due **30 Sep 2027**.
  - From 2027 declarants must hold certificates covering at least 50% of current emissions each quarter (down from 80%).
  - The Omnibus replaced the €150 rule with a **50-tonne per importer per year** de minimis (electricity and hydrogen excluded).
  - The authorised-declarant application deadline was **31 Mar 2026**.
  - Extension to downstream steel and aluminium goods is proposed, not yet law; a plenary vote was expected in Sep 2026, outcome unverified.
  - These are mostly consultancy and law-firm summaries. — [IntegrityNext](https://www.integritynext.com/resources/blog/article/mastering-cbam-compliance-in-2026-latest-updates-and-how-companies-should-prepare); [Rödl Poland](https://www.roedl.pl/en/good-to-know/good-to-know/customs-and-excise-duties/cbam-changes-from-january-2026); [Akin Gump](https://www.akingump.com/en/the-eu-simplifies-cbam-what-are-the-potential-implications); [Mondaq, Sep 2026](https://www.mondaq.com/brussels-rewrites-the-rules-on-cbam-electricity-western-balkan-exporters-take-note/1842590)
- **CSRD / Omnibus I**:
  - Parliament adopted the final text on 16 Dec 2025, and the Council confirmed it on **24 Feb 2026**.
  - Mandatory CSRD now applies only above **1,000 employees AND €450m net turnover**. The non-EU trigger is more than €450m EU turnover plus an EU subsidiary or branch above €200m.
  - **Value-chain cap**: companies with fewer than 1,000 employees may refuse data requests beyond the **VSME** voluntary standard.
  - **CSDDD**: limited to more than 5,000 employees and €1.5bn turnover; transposition by 26 Jul 2028, application from 26 Jul 2029. The climate transition plan obligation was removed.
  - Simplified ESRS: data points cut by about 61% in the draft; the Commission committed to adopt by 18 Sep 2026, and adoption was not confirmed.
  - Sources: [Morrison Foerster, Dec 2025](https://www.mofo.com/resources/insights/251222-eu-sustainability-omnibus-i-detailed-omnibus); [Stibbe](https://www.stibbe.com/publications-and-insights/omnibus-i-clarity-on-the-future-of-the-csrd-and-csddd); [ZDH (Council adoption)](https://www.zdh.de/ueber-uns/fachbereich-europapolitik/europa-aktuell/omnibus-1-vereinfachungspaket-vom-rat-final-verabschiedet/); [CMS](https://cms.law/en/lux/legal-updates/final-adoption-of-omnibus-i-directive-simplifying-csrd-and-csddd)
- **Digital Product Passport**:
  - The battery passport (Art. 77, Reg. (EU) 2023/1542) applies from **18 Feb 2027** to EV, LMT and industrial batteries above 2 kWh (sources describe the scope slightly differently).
  - The ESPR Working Plan (COM(2025) 187, Apr 2025) gives indicative dates: iron and steel around 2026 (delegated act provisionally Q4 2026), textiles around 2027.
  - As of June 2026, **no product-specific ESPR delegated act had been adopted** (vendor source).
  - Sources: [Informatica battery passport guide](https://www.informatica.com/resources/articles/digital-product-passport-battery-passport-guide.html); [Coolset DPP guide](https://www.coolset.com/academy/eu-digital-product-passport-dpp-guide); [Compliance & Risks, Jun 2025](https://www.complianceandrisks.com/wp-content/uploads/2025/06/Digital-Product-Passport-June-18-2025.pdf)

**Problem-space statistics**
1. **EUDR and smallholders**:
   - IISD's State of Sustainability Initiatives report (Oct 2026) surveyed **333 farmers and producer groups in 16 countries**. Barriers: land documentation, compliance cost, traceability and technical capacity. Independent farmers fare worse than those in cooperatives.
   - **74%** of respondents (79% in coffee) think stricter rules could push farmers toward less-regulated markets.
   - Needs: government programs 84%, financial help 78%, training 74%, information 71%.
   - The sample was not statistically representative.
   - Fairtrade warns buyers may switch to larger farms that already hold geolocation data.
   - Sources: [Daily Coffee News on IISD report](https://dailycoffeenews.com/2026/10/07/eudr-compliance-gaps-persist-for-smallholders-new-report-finds/); [Food Ingredients First on Fairtrade](https://www.foodingredientsfirst.com/news/eu-backs-fairtrade-eudr-support.html); [WWF Dec 2025 smallholder report](https://wwfeu.awsassets.panda.org/downloads/unlocking-opportunities-for-smallholders-through-the-eudr_dec-2025.pdf)
2. **CBAM and Western Balkans**:
   - The Energy Community Secretariat estimated 2023-basis CBAM costs on power exports at **€1.07bn for Serbia** and **€262m for North Macedonia**.
   - Bruegel estimates an implied export penalty of €70–80/MWh for Western Balkans and Ukraine electricity.
   - No WB country had met the prerequisites for electricity market coupling, which is the route to exemption, as of a 2024 tracker.
   - North Macedonia adopted a decree letting MEMO issue guarantees of origin.
   - Serbia: CBAM affects more than 15,000 direct and more than 50,000 indirect jobs in four industries.
   - Most of these figures are 2023–24 (flag: older).
   - Sources: [Balkan Green Energy News / Bruegel](https://balkangreenenergynews.com/bruegel-without-refining-or-delaying-cbam-for-electricity-eu-risks-market-integration-security-of-supply/); [BGEN: WB can't secure electricity exemption](https://balkangreenenergynews.com/western-balkans-cant-secure-cbam-exemption-for-electricity-in-time/); [BGEN: Serbia industries](https://balkangreenenergynews.com/serbias-energy-intensive-industries-brace-for-cbam-seek-state-support-to-apply-decarbonization-solutions/); [GMK: BiH and Montenegro ask for postponement](https://gmk.center/en/news/bosnia-and-herzegovina-and-montenegro-ask-to-postpone-cbam-launch/)
3. **Non-revenue water (SDG 6)**:
   - About **126 bn m³/year** lost globally (346m m³/day, 220 countries), valued at about **$39bn/year** at $0.31/m³ (Liemberger & Wyatt study, linked to the World Bank).
   - S&P puts it at $187bn at US tariffs.
   - This is roughly 2–3x the World Bank's 2005 estimate of 48.6 bn m³.
   - Sources: [The Source magazine (IWA)](https://thesourcemagazine.org/bursting-at-the-seams-new-study-highlights-the-realities-of-water-loss/); [S&P Global](https://www.spglobal.com/en/research-insights/articles/daily-update-september-8-2023); [IWA author page, Jemima Sy (World Bank)](https://iwa-network.org/author/jemima-sy)
4. **Heat stress at work (SDG 3/8)**:
   - ILO: **2.41bn workers (about 70%)** exposed to excessive heat.
   - Per year: **22.85m occupational injuries, 18,970 deaths, 2.09m DALYs**.
   - Most exposure (9 in 10) and injuries (8 in 10) happen **outside** heatwaves.
   - Europe and Central Asia is among the regions with the fastest growth in heat-related injuries since 2000.
   - Prevention could save up to **US$361bn**.
   - Sources: [ILO news](https://www.ilo.org/resource/news/more-workers-ever-are-losing-fight-against-heat-stress); [GHHIN ILO profile](https://ghhin.org/wp-content/uploads/IO-Profile-ILO-1.pdf)
5. **Procurement integrity (SDG 16)**:
   - ECA Special Report 28/2023: **42% of EU contracts in 2021 were single-bid** (peak); average bidders fell from **5.7 to 3.2** over 2011–2021, a "lost decade".
   - Cited causes: administrative complexity, poorly designed criteria, incumbent dominance.
   - Data is from 2021 (older).
   - Sources: [ECA press release](https://www.eca.europa.eu/ECAHTMLNews/NEWS-SR-2023-28/en/body.html); [Spend Network summary](https://www.spendnetwork.com/eu-auditors-flag-declining-competition-in-public-procurement/)
6. **Migrant credential recognition / brain waste (SDG 8/10)**:
   - Eurostat: **39.6% of tertiary-educated non-EU citizens** in the EU were over-qualified for their job in 2024, compared with 30.3% of other EU citizens and about 20–21% of nationals.
   - 2023 country peaks: Greece 69.6%, Italy 64.1%, Spain 56.0%.
   - Sources: [Eurostat Statistics Explained](https://ec.europa.eu/eurostat/statistics-explained/SEPDF/cache/93571.pdf); [Eurostat news, Jul 2024](https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20240726-1)
7. **Climate insurance protection gap (SDG 1/13)**:
   - EIOPA: only about **35%** of European climate-related losses were insured (2020 launch figure). A 2023 summary says **about 25%**, so the two sources conflict.
   - Smallholder agricultural insurance coverage estimates vary: 1 in 10 (Howden 2023), under 20% globally and under 3% in sub-Saharan Africa (ISF Advisors), and 97% uninsured in Africa (AfDB).
   - Basis risk and single-peril (drought-only) designs are known weaknesses of parametric products.
   - Sources: [EIOPA](https://www.eiopa.europa.eu/content/eiopa-pilot-dashboard-addresses-natural-catastrophe-protection-gap_en); [Addactis blog](https://www.addactis.com/blog/eiopa-natural-catastrophes-insurance-protection/); [Howden smallholder report](https://www.howdengroupholdings.com/sites/g/files/mwfley1156/files/2023-11/Building%20Preparedness%20and%20Protection%20in%20Smallholder%20Agriculture%20-%20November%202024_0.pdf); [Business Daily Africa](https://www.businessdailyafrica.com/bd/opinion-analysis/letters/why-africa-s-insurers-must-rethink-parametric-products-5347144)

### Inferences
Candidate problem spaces, 10 in total. Each shows the regulation or statistic, the data stack, and the MVP "wow".

1. **EUDR "plot passport" for cooperatives and SME traders** (deadlines 30 Dec 2026 / 30 Jun 2027).
   - Stack: Whisp API + Sentinel-2 before/after (2020 vs 2026) + an LLM that turns messy cooperative spreadsheets and paper land documents into clean GeoJSON and a due-diligence statement draft.
   - Strongest timing fit of all candidates.
2. **CBAM supplier-emissions data kit for non-EU (e.g. Western Balkan) SME exporters of steel, aluminium and cement**.
   - EU importers must report embedded emissions, and many importers fall under the 50 t threshold while their large customers do not.
   - Stack: LLM extraction of energy bills and production data into the CBAM installation communication template, with grid-factor defaults, plus a map of exporters.
   - Visual wow is weaker; the business case is strong.
3. **VSME auto-filler for SME suppliers**.
   - Omnibus I makes VSME the maximum that large customers can ask of SMEs, so it becomes the standard supplier questionnaire.
   - Stack: LLM over invoices and utility bills, Eurostat/EEA emission factors, and a one-click VSME report.
   - Crowded segment (see Q3).
4. **Procurement red-flag radar for journalists, NGOs, and EU/IPA-funded municipalities**.
   - Stack: TED API + opentender + LLM reading tender documents (restrictive criteria, short deadlines), with single-bidder heat maps by buyer.
   - Very demo-able. Existing tools are NGO-run and rule-based.
5. **Satellite and AI "where to look first" leak-prioritisation for small utilities**.
   - Stack: OSM pipes/roads + Sentinel-1/2 soil moisture and vegetation anomalies + Open-Meteo freeze/thaw + utility billing data.
   - True leak detection needs L-band SAR (ASTERRA) or acoustics. A hackathon MVP can only rank zones by risk, so the claims must stay honest.
6. **Heat-stress shift planner for outdoor employers** (construction, agriculture, delivery, municipalities).
   - Stack: Open-Meteo hourly temperature, humidity, wind and radiation, giving a WBGT approximation, plus work/rest schedule rules and SMS/WhatsApp alerts.
   - Most injuries happen outside official heatwaves, so a daily-risk tool beats heatwave alerts.
7. **Urban heat-island and tree-equity mapper for municipalities** (Sentinel-2/Landsat LST + OSM + census).
   - Visually striking, but crowded in the US and EU research space.
8. **Parametric micro-insurance trigger designer and basis-risk explorer** for MFIs, cooperatives and insurers.
   - Stack: Open-Meteo/ERA5 historical rainfall and temperature plus FIRMS, to back-test triggers per village.
9. **Migrant credential translator**.
   - Stack: LLM maps a foreign diploma or transcript to ISCED/EQF levels and national regulated-profession rules, and drafts the recognition dossier.
   - No geodata wow, but a strong human story. Payers are weak, mainly B2G or employers.
10. **Battery/DPP readiness for SME battery or e-bike assemblers** (deadline 18 Feb 2027).
    - Stack: LLM-generated passport data model and QR page.
    - Narrow audience.

### Gaps
- No primary data found on how many SME exporters in North Macedonia or Serbia ship CBAM goods, or on per-tonne CBAM cost for WB steel and aluminium.
- Whether the EUDR delegated act on scope (May 2026 draft) was adopted, and whether the simplified ESRS was adopted by 18 Sep 2026.
- No 2026 count of smallholders lacking geolocation data was found.
- Right-to-repair, care-economy and accessibility (European Accessibility Act, in force since Jun 2025) were not researched this session for lack of budget.
- The EIOPA protection-gap percentage conflicts between sources (35% vs about 25% insured).

---

## Q3. For each candidate: who pays, which competitors exist, and why does the gap persist?

### Takeaway
The best-funded incumbents serve the large buyers: EUDR platforms for multinationals, CBAM and CSRD SaaS for EU importers, and satellite leak detection sold to utilities. The persistent gap is at the "first mile": cooperatives, SME suppliers, small exporters and small municipalities. They hold the data but cannot pay enterprise prices, and they often work offline, in local languages, or on paper. An MVP that turns their messy documents into the exact format the large buyer needs, paid for by the buyer, a certifier or a donor, has an identifiable customer.

### Cited Findings
- **EUDR competitors**:
  - **Meridia** (Amsterdam, $5.6m Series A): SGS picked it as its global EUDR verification technology partner in **Sep 2026**.
  - **Koltiva** (Indonesia, Series A led by AC Ventures): KoltiTrace traceability.
  - **Satelligence**: last funding found was about $2.3m in 2020 (older).
  - Free and open tools from FAO, EFI and TechnoServe exist (see Q1).
  - Sources: [SGS, Sep 2026](https://www.sgs.com/en-mm/news/2026/09/sgs-selects-meridia-as-technology-partner-for-eudr-verification); [Signalbase on Meridia](https://www.trysignalbase.com/news/funding/meridia-secures-56m-series); [Digital News Asia on Koltiva](https://digitalnewsasia.com/startups/sustainable-farming-and-supply-chain-traceability-startup-koltiva-raises-series-financing); [Preqin on Satelligence](https://www.preqin.com/data/profile/asset/satelligence-b-v-/403053)
- **EUDR payers and support**:
  - Fairtrade won an EU LIFE grant (36 months from Jun 2025) to train more than 1,000 SMEs on EUDR. Donors and certifiers are funding capacity building.
  - GSMA flags the risk that agritech growth from EUDR leaves smallholders behind.
  - Sources: [Fairtrade press](https://www.fairtrade.net/en/get-involved/Press-centre/fairtrade-awarded-grant-to-help-companies-succeed-under-eudr.html); [GSMA](https://www.gsma.com/mobilefordevelopment/mobile-for-development-2/deforestation-regulations-a-boon-for-agritech-innovation-but-will-it-leave-smallholders-behind/)
- **CBAM/EUDR compliance SaaS** aimed at EU importers includes osapiens, IntegrityNext and Coolset (they publish CBAM and EUDR guidance). — [osapiens CBAM page](https://osapiens.com/en/regulations/cbam); [IntegrityNext](https://www.integritynext.com/resources/blog/article/mastering-cbam-compliance-in-2026-latest-updates-and-how-companies-should-prepare); [Coolset](https://www.coolset.com/academy/eudr-delay-2025-what-eu-vote-means-for-importers-and-operators)
- **Water-loss competitors**:
  - **ASTERRA**: L-band satellite + AI. Claims more than 600 customers and 191,000 leaks found (self-reported). Won a four-year New Mexico statewide contract (LeakTracer).
  - **FIDO Tech** (UK): acoustic AI, about $9.5m raised, Series B led by CRH Ventures (2024). Gap Inc funds 10 years of FIDO leak reduction on 350 km of Bengaluru pipes, which shows a corporate water-stewardship payer.
  - Sources: [Business Wire on New Mexico, Jan 2026](https://www.businesswire.com/news/home/20260128042023/en/New-Mexico-Expands-State-Funded-Satellite-Leak-Detection-Program-Following-Breakthrough-Success-in-Truth-or-Concequences); [Geo Week News, Feb 2026](https://www.geoweeknews.com/news/asterra-s-ai-driven-water-leak-detection-technology-is-a-major-step-toward-sustainable-water-management); [Silicon Canals on FIDO](https://siliconcanals.com/fido-ai-raises-series-b-investment-to-scale-its-innovative-water-management-technology); [Gap Inc](https://www.gapinc.com/en-us/articles/2025/06/gap-inc-and-fido-ai-collaborate-to-improve-water-r)
- **Procurement competitors**: NGO-built, free, rule-based tools (TI Integrity Watch Red Flags, Hungarian Red Flags), plus opentender, which is research-funded with half-yearly updates. — [TI EU](https://transparency.eu/integrity-watch-red-flags); [EC anti-fraud knowledge centre](https://antifraud-knowledge-centre.ec.europa.eu/library-good-practices-and-case-studies/good-practices/early-warning-red-flags_en)
- **Western Balkan CBAM electricity**: the remedy, market coupling, is structural and government-led, and no WB country met the prerequisites as of the 2024 tracker. Software can only support MRV and guarantees of origin, not solve it. — [BGEN](https://balkangreenenergynews.com/western-balkans-cant-secure-cbam-exemption-for-electricity-in-time/)

### Inferences
Who pays, why the gap persists, and the opening for each candidate:

| # | Candidate | Paying customer | Why the gap persists | MVP opening |
|---|---|---|---|---|
| 1 | EUDR plot passport | EU SME importers/roasters (the operator bears liability); certifiers (SGS-type); cooperatives via donor grants (LIFE, GIZ, IDH) | Incumbents sell to multinationals; smallholder data is on paper or WhatsApp; deadline only became final in Dec 2025/May 2026 | "Cooperative-side" tool: messy spreadsheets/photos to validated GeoJSON + Whisp risk + DDS draft, white-labelled for importers |
| 2 | CBAM supplier kit (WB exporters) | Non-EU SME exporters (to keep EU customers); EU importers; chambers of commerce / EBRD / GIZ programs | EU-side SaaS targets declarants, not installations in third countries; language and SME capacity barriers | Macedonian/Serbian-language emissions-data template filler, from energy bills to the CBAM installation communication |
| 3 | VSME auto-filler | SMEs (low willingness to pay); banks requesting ESG data; large buyers | Crowded with ESG SaaS (Coolset etc.); differentiation is hard | Weak hackathon novelty unless tied to a local bank or region |
| 4 | Procurement red-flag radar | B2G (audit offices, EU-funded program auditors, OLAF-style anti-fraud units), media, NGOs (grants), bidding SMEs looking for low-competition tenders | Existing tools are rule-based, NGO-funded, and cover few countries (9 in TI's tool); national portals in candidate countries (e.g. North Macedonia's ESPP) are mostly outside TED | An LLM reading tender documents for restrictive criteria is the novel part |
| 5 | Leak prioritisation | Small and medium utilities (B2G), development banks (World Bank/EBRD NRW programs), corporate water-stewardship funders (Gap/FIDO model) | Incumbents (ASTERRA, FIDO) need proprietary sensors or L-band data and sell to larger utilities; small Balkan utilities lack GIS | A risk-ranking dashboard from open data is plausible as triage, not detection |
| 6 | Heat-stress shift planner | Construction and agri employers (OSH liability, productivity), insurers, labour inspectorates, municipalities | Few EU-specific employer tools surfaced (not exhaustively checked); OSH heat rules are emerging country by country (ILO reviewed 21 countries) | Low data barrier; strong "everyday heat" story |
| 7 | Urban heat / tree equity | B2G | Market is crowded | Weaker novelty |
| 8 | Parametric trigger designer | MFIs, cooperatives, reinsurers' development arms (B2B) | Basis risk is a known pain point | Open historical weather and FIRMS data lets you demo back-tests |
| 9 | Credential translator | Public employment services (B2G), employers in shortage occupations, NGOs | Weak payer; recognition is a regulated, national process | Strong human story, weak business case |
| 10 | Battery passport (DPP) | Small assemblers | Enterprise DPP vendors are numerous, and only batteries have a fixed date | Narrow audience |

- **Ranking for a 4-day SDG hackathon** (judgement, not sourced):
  1. EUDR plot passport: hard deadline in 81 days for large and medium operators, open-source backbone (Whisp), satellite before/after wow, clear payer.
  2. Procurement red-flag radar: free anonymous API, LLM novelty, SDG 16.
  3. CBAM kit for WB exporters: regional relevance, clear payer, weak visuals.
  4. Heat-stress planner: easy data, strong story.
- **Common moat logic**: the large regulated buyer pays, and the product collects data from the small actor in their own language and formats. LLMs make that collection cheap, which was not true before about 2024.

### Gaps
- No funding or market-size data was found for osapiens or Satelligence in 2025–26, and no EU heat-stress employer-tool startups were found (not searched in depth).
- Willingness-to-pay figures (e.g. EUDR compliance cost per tonne or per farm, CBAM consultancy fees in the Balkans) were not found.
- Startup coverage of credential recognition (e.g. ENIC-NARIC digitisation tools), right-to-repair and accessibility was not researched.
- Whether TED covers North Macedonia/Serbia tenders above threshold was not verified; national e-procurement portals and their open-data APIs were not researched.

# Under-tackled, evidence-backed problem spaces in North Macedonia and the Western Balkans (for an SDG business idea)

Research date: 2026-10-09. About 20 web searches. Many of the best available statistics are from 2017 to 2024, and each is flagged with its year. Search summaries were checked against the source pages' snippets. I could not fetch every primary PDF, so a few figures are "as reported by" a secondary outlet, and are marked that way. SDG target numbers come from the UN SDG framework ([UN SDGs](https://sdgs.un.org/goals)). Mapping each problem to targets is my own inference.

Legend: **Verified** = a cited finding with a URL. **Inference** = my reasoning, not a sourced fact.

---

## Problem 1: Household heating with wood and waste drives winter air pollution (Skopje, Tetovo) and is an energy-poverty problem

### Takeaway
Heating choice is driven by the monthly bill, not by pollution concerns. Many households burn wood, and some burn waste. Skopje is among Europe's most polluted capitals, and Tetovo's PM2.5 is about 8x the WHO guideline. Air-quality monitoring apps already exist, but nobody is solving the household's decision of what to switch to, how much it costs, and which subsidy pays for it.

### Cited Findings
- A UNDP-backed survey of 5,044 households in Skopje's 17 municipalities (2017) found that 85% of rural Skopje households and 35% of central urban households heat with wood-burning devices. A third of respondents admitted that they or their neighbours burn construction waste or garbage. Only 1% base their heating choice on pollution, while 40% choose based on the monthly heating bill. — [UNDP North Macedonia](https://www.undp.org/north-macedonia/news/major-new-survey-household-heating-identifies-some-key-causes-skopjes-soaring-levels-pollution)
- The WHO 2018 ambient air database ranked Skopje (about 600,000 inhabitants) as Europe's most polluted capital. PM2.5 is 4.5x the WHO recommendation in Skopje and 8.1x in Tetovo. About 2,574 premature deaths a year are attributed to air pollution (Al Jazeera, citing the EU research results site, 2021). — [Al Jazeera 2021](https://www.aljazeera.com/gallery/2021/4/21/in-pictures-air-pollution-in-north-macedonia); [CORDIS](https://cordis.europa.eu/article/id/413275-air-pollution-in-skopje-how-citizens-spurred-policymakers-towards-the-change/de)
- After the 2022 electricity price rises, many residents bought wood-burning stoves. Per INDAGO research, up to 70% said they would not take a loan to replace old stoves. — [Meta.mk](https://meta.mk/en/solar-thermal-collectors-could-replace-wood-burning-stoves-help-fight-air-pollution-and-could-provide-for-cheaper-electricity/)
- Skopje's mayor reportedly said about 60,000 households use low-quality wood and coal for heating (via Makfax, as summarised in search results; I did not verify the primary source). — [Al Jazeera 2021](https://www.aljazeera.com/gallery/2021/4/21/in-pictures-air-pollution-in-north-macedonia)
- Existing solutions focus on measurement. AirCare (formerly MojVozduh, launched in 2014 by Gorjan Jovanovski) maps government and volunteer sensor data across the Balkans. Pulse.eco is a crowdsourced environmental-data platform. — [Wikipedia: Gorjan Jovanovski](https://en.wikipedia.org/wiki/Gorjan_Jovanovski); [CleanBREATHE paper 2019](https://proceedings.ictinnovations.org/attachment/paper/566/blended-research-on-air-pollution-using-technical-and-educational-solutions---cleanbreathe.pdf)

### Inferences
- **Who suffers:** low-income, peri-urban and rural households in Skopje, Tetovo and Bitola valleys (respiratory illness, high bills), and the general urban population.
- **Who could pay (B2G/B2B):** the City of Skopje and municipalities running subsidy schemes, the Ministry of Energy, EBRD/GEFF partner banks (lead generation), and heat-pump and insulation installers (lead generation).
- **Competitors:** AirCare and Pulse.eco measure pollution. I found no tool that does a per-household heating-switch calculation (stove vs. inverter AC/heat pump vs. pellet), routes the household to the right subsidy or loan, and verifies the switch. That is the white space. See Problem 2.
- **SDG:** 3.9 (deaths from air pollution), 7.1 (affordable energy), 11.6 (urban air quality), 13.2.
- **4-day prototype:** a web app that takes an address, house size and current fuel. It outputs annual cost and PM2.5 emissions per option, eligible subsidies, and a pre-filled application. It could also offer a municipal dashboard of the wood stoves replaced.

### Gaps
- I found no official national energy-poverty rate and no post-2022 household heating survey. The UNDP survey is from 2017 and covers only Skopje.

---

## Problem 2: Uptake of household energy-efficiency finance and subsidies is low and fragmented

### Takeaway
Money exists (EBRD GEFF loans with up to 20% cashback, Skopje inverter-AC subsidies, the 2025 national AC-for-low-income programme), but reach is tiny relative to need. The household problem is navigating several schemes, banks and installers.

### Cited Findings
- GEFF North Macedonia has reached more than 2,000 households with more than €15M in loans. The most-financed measures are windows and doors, insulation and heat pumps. Borrowers get up to 20% cashback on completion. — [EBRD 2021](https://www.ebrd.com/home/news-and-events/news/2021/ebrd-and-partners-support-residential-energy-efficiency-in-north-macedonia.html); [EBRD GEFF NM](https://ebrdgeff.com/macedonia/heat-pumps-enjoy-a-comfortable-living-environment-while-spending-4-to-5-times-less-energy/)
- ProCredit disbursed €2M through 172 GEFF household loans. More than 65% went to efficient heating and cooling. — [EBRD 2021](https://www.ebrd.com/news/2021/ebrd-eu-and-austria-finance-energy-efficiency-in-north-macedonia.html)
- In 2020, the City of Skopje received applications from 4,282 households for an inverter-AC subsidy of up to €1,000 each, conditional on handing in wood stoves or oil boilers. Applications were suspended when funds ran out. — [Balkan Green Energy News](https://balkangreenenergynews.com/?p=35771) (as summarised in search results)
- The Ministry of Energy's 2025 programme grants inverter ACs (up to 3.5 kW, class A+ or better) with free installation to low-income households. — [Balkan Green Energy News](https://balkangreenenergynews.com/?p=84504) (as summarised)
- The OECD says North Macedonia has subsidised "a small number of households" for energy-efficiency improvements. — [OECD Multi-dimensional Review of WB](https://www.oecd.org/en/publications/multi-dimensional-review-of-the-western-balkans_8824c5db-en/full-report/component-26.html)
- The consumer organisation OPM ran a collective purchase of air-to-air heat pumps (€1,000 to €1,300). — [BEUC CLEAR-X](https://www.beuc.eu/past-projects/clear-x/collective-purchase-air-air-heat-pumps-begins-north-macedonia)

### Inferences
- **Who pays:** banks (cost per qualified lead), installers (marketplace commission), municipalities (programme administration software), and donors (EBRD, GIZ, UNDP).
- **Competitors:** none found locally for a unified "subsidy and loan navigator plus installer marketplace." Comparable models exist in the EU (one-stop renovation shops), but I found none serving MK or the WB in Macedonian or Albanian.
- **SDG:** 7.3 (energy efficiency), 7.1, 11.6, 1.4.
- This problem is best merged with Problem 1 as a single product.

### Gaps
- No 2026 figures on GEFF or subsidy uptake. No published count of unspent or undersubscribed programme budgets.

---

## Problem 3: Non-revenue water is about 60% in municipal utilities

### Takeaway
Roughly 6 of every 10 litres of treated water are lost or not billed (physical leaks, plus illegal connections and billing failures), against an IWA good-practice target of under 30%. Small municipal utilities lack digital leak and billing analytics.

### Cited Findings
- State Statistical Office data show national non-revenue water falling from 67.55% (2018) to 61.94% (2020). — [Meta.mk](https://meta.mk/en/?p=556300)
- The EBRD 2019 diagnostic put NRW at 63% (commercial plus technical losses). — [EPI](https://epi.org.mk/post/20257?lang=en)
- The State Audit Office found NRW of about 59% at PUC Vodovod Bitola for 2022, with "difficult billing." — [State Audit Office](https://arhiva.dzr.mk/en/node/3848)
- The Skopje region has losses above 60% (Energy and Water Services Regulatory Commission 2024 report, via BTA). — [BTA](https://www.bta.bg/en/news/balkans/932853-skopje-experiencing-water-supply-problems)

### Inferences
- **Who suffers:** utilities (lost revenue, energy wasted on pumping), residents (summer shortages, as Skopje saw), and municipalities.
- **Who pays:** municipal public utilities (SaaS), the Regulatory Commission, and donors (EBRD, KfW, SECO, which fund water projects).
- **Competitors:** global vendors (smart meters, acoustic leak detection) are hardware-heavy and expensive. I found no lightweight local software for district-metered-area water-balance analytics, billing anomaly detection or citizen leak reporting. This is not confirmed by a dedicated search.
- **SDG:** 6.4 (water-use efficiency), 6.1, 11.
- **4-day prototype:** upload billing CSV plus bulk-meter readings. The tool computes an IWA water balance per zone, flags anomalous accounts (zero consumption, possible illegal connections), and adds a citizen leak-report map.

### Gaps
- No full municipality-by-municipality NRW table (the ADKOM PDF was not readable). I did not verify utility willingness to pay.

---

## Problem 4: Women own a small share of property and land, especially in rural areas

### Takeaway
Women own about 26% of property nationally and are estimated at only 5% in rural areas, usually becoming owners as widows. Inheritance customs (daughters renouncing in favour of brothers) and procedural costs keep land in men's names, which blocks women's access to credit and farm subsidies.

### Cited Findings
- Agency for Real Estate Cadastre (2023): women own 26.36% of property in North Macedonia. — [Global Voices 2025](https://globalvoices.org/2025/04/30/gains-and-gaps-in-gender-equality-in-north-macedonia/)
- February 2021: 27.81% of properties were owned by women and 72.19% by men. In rural areas only 5% of women hold property rights, usually after widowhood. — [GIZ Gender Works](https://gender-works.giz.de/?p=15527)
- FAO/World Bank: the share of registered properties with female owners or co-owners rose from 16% to 27% between 2013 and 2019. — [FAO via GLTN](https://gltn.net/blog/fao-land-ownership-still-lagging-women-western-balkans); [FAO report](https://www.landportal.info/sites/default/files/library/resources/cb2857en_2_0.pdf)
- A UN partnership on gender equality in land ownership is active across the Western Balkans. — [UN SDG Partnerships](https://sdgs.un.org/partnerships/partnerships-gender-equality-land-ownership-and-control-good-practices-western-balkans)

### Inferences
- **Who suffers:** rural women, especially daughters and widows, and women farmers who cannot access IPARD/agri subsidies or bank collateral without title.
- **Who pays:** donors (FAO, UN Women, GIZ, USAID successors), notary and lawyer networks (lead generation), the Cadastre, and microfinance institutions.
- **Competitors:** none found. Work so far is awareness campaigns by FAO and NGOs, not software.
- **SDG:** 5.a (women's ownership of land), 1.4, 2.3.
- **4-day prototype:** an "inheritance and co-ownership navigator." It explains rights in plain language (MK/AL), estimates costs and steps for co-registration, generates a checklist and draft documents, and offers anonymous legal Q&A.

### Gaps
- No 2024 to 2026 figure. The rural 5% figure is from an advocacy context (2021). I did not check regional figures for Kosovo or Albania in this pass.

---

## Problem 5: Older people left alone in depopulating villages, with few care services

### Takeaway
Rural depopulation is severe (about 458 villages under 50 residents, about 147 fully empty), and the 65+ share grew from 13.1% to 18.1% in a decade. Formal home care is scarce and centred in cities, so the emigrant children abroad (who have money) are disconnected from parents at home who need help.

### Cited Findings
- 458 villages have fewer than 50 residents (about 1/3 of settlements), over 100 have fewer than 10, and 147 are completely empty (SSO data, undated article, roughly mid-2010s). In 1953 only 20 villages had fewer than 50 residents. — [OBC Transeuropa](https://www.balcanicaucaso.org/en/cp_article/the-death-of-macedonian-village/)
- Population in 2023 was 1,826,247 (down 5.1% vs. 2013). The 65+ share rose from 13.1% to 18.1%. — [UGD paper](https://eprints.ugd.edu.mk/37035/2/Rural%20Revitalization%20.pdf)
- Demand exceeds supply in senior care, and private care is costly. — [PERHOUSE leaflet](https://celsi.sk/media/datasource/NORTH_MACEDONIA_PERHOUSE_leaflet_North_Macedonia_.pdf)
- Care infrastructure is limited, particularly in rural areas, despite investment in home and community services. Municipalities are legally responsible (2019 Law on Social Protection) but rely on central funding. — [InCARE Policy Roadmap 2023](https://incare.euro.centre.org/wp-content/uploads/2023/12/InCARE-Policy-Roadmap-North-Macedonia_final.pdf)
- UN Women (2026) finds care access uneven, especially in rural areas. Families rely on unpaid care, mostly by women. — [UN Women 2026](https://eca.unwomen.org/en/digital-library/publications/2026/05/transforming-care-systems-in-north-macedonia-gender-care-needs-and-financing-pathways-for-an-inclusive-care-economy)
- The World Bank Social Services Improvement Project helped about 1,600 people (many elderly) live independently through in-home care. The World Bank describes rural areas as rapidly ageing. — [World Bank 2025](https://www.worldbank.org/en/news/feature/2025/04/10/north-macedonia-s-new-care-economy-changing-lives-creating-jobs)
- The Red Cross piloted an emergency-button service for 50 frail elderly people, with a planned initial coverage of 60 clients in Skopje. — [Red Cross MK](https://ckrm.org.mk/en/integrated-care-and-support-service-business-development-in-the-red-cross-of-republic-of-north-macedonia-financed-by-the-austrian-development-agency-ada-austrian-red-cross-and-swiss-red-cross)
- The World Bank has tendered a "Private long-term care sector assessment" for North Macedonia, which signals an immature market. — [World Bank procurement](https://www.worldbank.org/en/about/corporate-procurement/business-opportunities/administrative-procurement/rfxnow-2002166-private-long-term-care-sector-assessment-north-macedonia)

### Inferences
- **Who suffers:** isolated rural elderly people (safety, medicine, isolation) and their emigrant children (worry, inability to coordinate help).
- **Who pays:** the diaspora children (consumer subscription in EUR, with strong willingness to pay given EU incomes), municipalities (under the 2019 law), and the Red Cross/NGO care providers (coordination software).
- **Competitors:** only small pilots (Red Cross 50 to 60 clients). I found no diaspora-facing "care concierge" in MK or the WB. Not confirmed by a dedicated competitor search.
- **SDG:** 3.8 (UHC), 10.2, 11.7, 5.4 (unpaid care), 1.3.
- **4-day prototype:** a diaspora app to book and pay vetted local helpers (shopping, medicine pickup, visits, small repairs), with photo and visit check-ins, an elder-side one-button phone or SMS check-in, and a municipal dashboard.

### Gaps
- No count of older people living alone in villages (the 2021 Census tables were not retrieved). Village counts are from an undated article, likely about 2015.

---

## Problem 6: Abandoned and fragmented farmland, often owned by emigrants

### Takeaway
About one third of arable land is abandoned. Farms average about 1.6 to 1.9 ha split into 6 to 7 tiny parcels (about 0.22 to 0.32 ha). Many owners have emigrated or inherited fractions with no title clean-up. Active farmers who want to scale cannot find, contact or lease these parcels.

### Cited Findings
- About 32% of arable agricultural land is abandoned, far above most of Europe. — [FAO REU](https://sfcs.fao.org/europe/news/detail/fao-continues-push-to-address-land-abandonment-in-north-macedonia/en)
- The 2016 Farm Structure Survey counted 178,125 holdings averaging 1.8 ha. The EU average is 16.6 ha. — [FAO](https://www.fao.org/3/cc6022en/cc6022en.pdf)
- The 2022 Ministry of Agriculture presentation: average family farm about 1.6 ha, 89% of family farms under 3 ha, about 7 parcels per holding, private parcels averaging about 0.22 ha. — [FAO LANDNET 2022](https://www.fao.org/fileadmin/user_upload/reu/europe/documents/Events_2022/landnet13presentation/LL_.pdf)
- Drivers: fragmentation, poor irrigation, and outmigration of rural youth. The state owns about 240,000 ha (about 40% of arable land). — [FAO family farming](https://www.fao.org/family-farming/countries/mkd/en)
- EU/FAO land consolidation (MAINLAND) reduced Dabjani village from 602 parcels to 127. — [EEAS](https://www.eeas.europa.eu/delegations/north-macedonia/second-phase-eu-supported-land-consolidation-process-greater-parcels-bring-greater-yields-%E2%80%93-and_en)

### Inferences
- **Who suffers:** farmers who want to expand, absent owners (diaspora) earning nothing, and municipalities (fire risk, since abandoned land feeds wildfires; see Problem 9).
- **Who pays:** farmers (listing or lease commission), diaspora owners (property-management fee), and FAO/the Ministry (consolidation programmes).
- **Competitors:** formal land consolidation is slow and project-based. General classifieds (OLX-type, Pazar3 in MK) list some land for sale, but I found no lease-matching or "manage my inherited land remotely" service. Not confirmed by a dedicated search.
- **SDG:** 2.3 and 2.4 (smallholder productivity, sustainable agriculture), 15.3 (land degradation), 1.4.
- **4-day prototype:** a map-based marketplace. Diaspora owners list parcels from their cadastre number, and local farmers bid for multi-year leases. It generates a standard lease contract and tracks payment remotely.

### Gaps
- No data on what share of abandoned land is diaspora-owned (this is inference). National farm figures are 2016 to 2022.

---

## Problem 7: Pesticide-residue failures in exported produce, and smallholder compliance burden

### Takeaway
North Macedonian peppers and cucumbers are repeatedly blocked at EU borders (Bulgaria, Croatia) for pesticide residues such as methomyl above EU maximum residue levels (MRLs). Smallholders lack simple spray-record and pre-harvest-interval tooling that buyers and exporters could rely on.

### Cited Findings
- Bulgaria's Food Safety Agency blocked 9.5 tonnes of North Macedonian peppers for excess pesticides and ordered their destruction. — [FreshPlaza](https://www.freshplaza.com/article/9871656/bulgaria-blocks-28-5-tons-of-grapes-and-peppers-over-pesticide-levels/) (date not visible in the snippet)
- Croatia withdrew Macedonian peppers with methomyl at 0.049 mg/kg against a 0.01 mg/kg limit (about 5x). — [HortiDaily](https://www.hortidaily.com/article/9772414/macedonian-peppers-withdrawn-from-croatian-market-due-to-contamination)
- A 2012–2013 national monitoring study of 168 samples found cucumber had the most residues, mainly methomyl. — [UGD eprints](https://eprints.ugd.edu.mk/14026/)
- EU MRLs come from Reg. 396/2005, with a default 0.01 mg/kg. North Macedonia contributes data to EFSA monitoring as a pre-accession country. — [Zenodo NM monitoring](https://zenodo.org/record/4458711)

### Inferences
- **Who suffers:** smallholder vegetable growers (rejected lots, lost buyers), exporters and aggregators (destroyed consignments), and consumers.
- **Who pays:** exporters and aggregators (traceability SaaS per supplier), agro-pharmacies (product-sales tie-in), and the Food and Veterinary Agency or donors.
- **Competitors:** global farm-management systems (e.g., GlobalG.A.P. tooling) are too heavy and expensive for 1.8 ha farmers. Seljak.me and Farmer.ba are marketplaces, not compliance tools. I found no MK smallholder spray-log app.
- **SDG:** 2.4, 3.9 (chemical harm), 12.4 (chemicals management), 17.11 (exports).
- **4-day prototype:** WhatsApp or Viber style chat logging ("sprayed X on peppers today"). It looks the product up against an EU MRL and pre-harvest-interval table, warns on the safe harvest date, and gives a QR batch passport for exporters.

### Gaps
- No aggregate RASFF count of NM notifications per year was retrieved. Interception articles are undated in the snippets.

---

## Problem 8: Smallholder market access and seasonal farm labour shortages

### Takeaway
Agriculture still employs about 24% of the labour force on tiny farms, with an ageing workforce and seasonal labour shortages. Regional marketplaces exist (Seljak.me in Montenegro, Farmer.ba in Bosnia), so the generic farmer-to-consumer marketplace idea is partially served. Harvest labour matching appears less served.

### Cited Findings
- In the Pelagonia region, farms rely on family labour with seasonal hiring. The study flags labour shortages, an ageing workforce and weak succession. — [USAMV journal](https://managementjournal.usamv.ro/index.php/scientific-papers/4227-agricultural-labor-dynamics-in-pelagonia-north-macedonia-a-case-study-through-the-lens-of-agricultural-household-and-labor-transition-models)
- Agriculture's share of GDP fell from 9.4% (2015) to 6.6% (2018), while 24% of the labour force works in agriculture (SSO, via a 2021 paper). — [UKLO eprints](https://eprints.uklo.edu.mk/10208/1/Pashovska%20Silvana%2C%20Intewrnational%20conference%20NIsh%202021.docx)
- The 2024 SMARTLABOUR workshop named workforce shortages, ageing and low technology adoption as threats. — [SMARTLABOR](https://smartlabor.repeople.rs/?p=688)
- Seljak.me (Montenegro) has about 20,000 registered farmers and users from MK, Serbia, BiH, Kosovo and Albania. Listings are dominated by livestock, feed and planting material, and it has no online payments. — [FAO Agritech Observatory](https://agritechobservatory.review.fao.org/es/seljakme)
- Farmer.ba is a smallholder-to-consumer e-commerce site with geolocation. — [FAO Agritech Observatory](https://agritechobservatory.review.fao.org/en/farmerba)
- Serbia's Agremo does drone and AI crop analytics. — [The Recursive](https://therecursive.com/?p=17738)

### Inferences
- The generic "marketplace for farmers" is **partially served** regionally. A student team should avoid it unless it has a sharp niche.
- A **harvest-labour matching** tool (day workers, students and pensioners matched to farms by GPS, with digital day-contracts that keep work declared) links to the informality problem (Problem 12). I found no MK competitor, though I did not run a dedicated search.
- **SDG:** 2.3, 8.3, 8.5, 8.8.

### Gaps
- I found no hard numbers on unfilled seasonal farm jobs. Evidence is qualitative and academic.

---

## Problem 9: Wildfires (95,000+ ha burned in 2024) and coordination of volunteers and resources

### Takeaway
2024 was North Macedonia's worst recent fire season (more than 95,100 ha by November 2024 per EFFIS), with a 30-day crisis declaration and EU, Hungarian and Turkish aerial help. Volunteers and forest rangers took part, but I found no data on, or tools for, their coordination.

### Cited Findings
- Over 85,000 ha had burned by early September 2024 (EFFIS via Copernicus). — [Copernicus/EU Space](https://eu-space.europa.eu/components/earth-observation-copernicus/image-of-day/north-macedonia-has-faced-severe-fire-season-2024)
- More than 95,100 ha had burned as of November 2024 (EFFIS). — [Statista](https://www.statista.com/statistics/1322248/area-burned-by-wildfire-in-north-macedonia)
- The government declared a 30-day state of crisis in July 2024. — [ANSA](https://ansa.it/nuova_europa/en/news/countries/macedonia/2024/07/14/wild-fires-and-heatwave-n.-macedonia-proclaims-state-of-crises_8f52b2e1-59fe-47ee-9a66-d7fe373806f4.html)
- The EU Civil Protection Mechanism mobilised aircraft from Serbia, Slovenia, Türkiye and Croatia. Hungary sent 46 people and 13 vehicles. — [EC](https://civil-protection-humanitarian-aid.ec.europa.eu/news-stories/news/eu-mobilises-aid-combat-wildfires-north-macedonia-and-bulgaria-2024-07-16_cs); [Xpatloop](https://xpatloop.com/channels/2024/08/hungarian-firefighters-join-fight-against-wildfires-in-north-macedonia.html)
- "Forest rangers, fire-fighting crews and volunteers" held a border fire (July 2024). — [LBC](https://lbc.co.uk/world-news/64dbb67382ab40a99053cff901a649b1)

### Inferences
- **Who pays:** the Protection and Rescue Directorate, municipalities, the national forestry enterprise, and EU civil-protection or IPA funds. It is a B2G sale with long cycles, harder for a student startup to monetise.
- **Competitors:** EFFIS and Copernicus give satellite detection. I did not verify any national volunteer app. Global apps (e.g., Watch Duty in the US) do not serve MK.
- **SDG:** 13.1 (climate resilience), 15.1 and 15.2 (forests), 11.5.
- **4-day prototype:** a volunteer registry with skills, a FIRMS/EFFIS hotspot map overlay, dispatch by SMS or Viber, and citizen photo reports of smoke with geolocation.

### Gaps
- No volunteer counts or official coordination-gap assessment found. Wildfire is strongly seasonal, and willingness to pay is unclear.

---

## Problem 10: About 1,000 illegal dumpsites, mostly in rural areas, plus open burning of waste

### Takeaway
North Macedonia has only one compliant landfill (Drisla, Skopje) and about 1,000 illegal dumps used mainly by villages without collection. Regional clean-ups have stalled for years. Open burning of waste feeds both air pollution and fires.

### Cited Findings
- The EEA (2018) estimates about 1,000 illegal dumpsites, mostly used by small communities and villages. — [EEA 2018](https://eea.europa.eu/themes/waste/waste-management/municipal-waste-management-country-profiles/north-macedonia-municipal-waste-factsheet-2018)
- Drisla is the only compliant landfill. An EU study rated 16 of 54 municipal sites as high risk and 17 as medium risk. — [RETech fact sheet](https://www.retech-germany.net/fileadmin/retech/05_mediathek/laenderinformationen/North_Macedonia__Fact_Sheet_final.pdf)
- Where there is no collection, people dump at roadsides or burn waste. Illegal dumping persists while it is "the cheapest alternative." — [EEA 2021](https://eea.europa.eu/themes/waste/waste-management/municipal-waste-management-country/north-macedonia-municipal-waste-factsheet-2021)
- The Eastern region has 12 substandard landfills and 72 dumps, and the Northeastern region 6 landfills and 32 dumps. Clean-up has been stalled since 2020. — [Meta.mk](https://meta.mk/en/cleanup-of-landfills-and-dumps-in-eastern-north-macedonia-has-been-constantly-postponed-for-a-year/); [Civil Today](https://civil.today/half-a-year-passed-but-the-illegal-landfills-in-the-eastern-and-northeastern-regions-in-north-macedonia-havent-been-cleaned-yet/)

### Inferences
- **Who pays:** municipalities and regional waste companies (reporting and route-optimisation SaaS), the Ministry of Environment, the EU IPA waste programmes, and Extended Producer Responsibility (EPR) packaging schemes (e.g., Pakomak).
- **Competitors:** citizen-reporting apps exist in some WB cities. I did not find a dedicated MK dumpsite-mapping or collection-gap tool in this pass, so this is unverified.
- **SDG:** 11.6, 12.5, 6.3, 3.9.
- **4-day prototype:** photo plus GPS reporting with AI waste-type and volume estimation, a municipal heatmap prioritising clean-ups, and a villages-without-collection gap map with a pay-per-pickup booking for households.

### Gaps
- Counts are from 2018 to 2021. No 2025 to 2026 inventory found.

---

## Problem 11: Out-of-pocket medicine costs and access to new medicines

### Takeaway
Patients pay 41.7% of health spending out of pocket, half of it on medicines. Only 10 of 168 new EMA-approved molecules (2018–2021) are fully available, and care is centralised in Skopje. Moj Termin has cut appointment waits, but medicine availability and price transparency remain weak.

### Cited Findings
- Out-of-pocket payments are 41.7% of total health expenditure, half on pharmaceuticals. The Positive List was revised in October 2024 for the first time in 15 years. — [WHO Europe 2024](https://www.who.int/europe/news/item/10-10-2024-north-macedonia-updates-positive-list-of-medicines-after-15-years--with-who-support)
- Of 168 new EMA molecules (2018–2021), only 10 are fully available in MK, against an EU average of 76. Reimbursed molecules are 17–24% of those in comparable countries. Care is centralised in Skopje. — [AmCham MK 2024](https://amcham.mk/wp-content/uploads/2024/09/healthcare-position-paper.pdf)
- Moj Termin reduced waiting times, but legal and operational barriers persist in primary care. — [WHO Observatory HSiA 2024](https://eurohealthobservatory.who.int/publications/i/health-systems-in-action-north-macedonia-2024)

### Inferences
- **Opportunity:** a pharmacy stock and price finder ("which pharmacy has drug X in stock and at what price, and is it on the Positive List?"), with diaspora-sourced medicine coordination. B2C freemium, with pharmacies paying for listing.
- **Competitors:** Moj Termin covers appointments only. I did not verify any MK pharmacy-inventory search app, so this is a gap.
- **SDG:** 3.8 (UHC and financial protection), 3.b.
- **Risk:** heavy regulation, and pharmacy data access is uncertain for a 4-day prototype (mock data needed).

### Gaps
- No 2026 stockout data found.

---

## Problem 12: Youth NEET, youth unemployment and informal work

### Takeaway
Youth unemployment is about 24% (Q3 2024) and NEET is about 18% (2022). Informality is around 11–14% of employment, while the informal economy is 23–30% of GDP. This space is crowded with job portals and donor programmes, so it is a weaker standalone pick, but it combines well with Problem 8 (declared seasonal agricultural work).

### Cited Findings
- NEET was 18% (2022, ILOSTAT). — [ILO](https://www.ilo.org/resource/other/about-ilo-north-macedonia)
- Youth unemployment was 23.6% in Q3 2024 (SSO). — [EU YouthWiki](https://national-policies.eacea.ec.europa.eu/youthwiki/chapters/republic-of-north-macedonia/31-general-context)
- The informal sector was 13.8% of employment (2019). Informality is about 30% of GDP. — [OECD WB Competitiveness Outlook 2024](https://www.oecd.org/en/publications/western-balkans-competitiveness-outlook-2024-north-macedonia_8207326d-en/full-report/component-13.html)
- The informal economy is 23.2% of GDP (2022 study cited by the ILO). — [ILO ESAP 2](https://www.esap.online/esap2/docs/222/ilo-esap-2-granular-examination-of-the-informal-economy-in-north-macedoniarn)
- Tetovo shows an agribusiness paradox: about 25% unemployment alongside six-month vacancies (commercial blog, low reliability). — [KiTalent](https://kitalent.com/articles/tetovo-agribusiness-skills-gap.md)

### Inferences
- **SDG:** 8.6 (NEET), 8.3 (formalisation), 4.4.
- A youth "micro-gig plus declared work" app (seasonal farm and tourism shifts with automatic simplified contracts) is the most original angle. Generic job boards are saturated (inference, not verified by a competitor search).

### Gaps
- No 2024 Eurostat NEET value retrieved. The 11.09% 2024 informal-employment figure is from a Wikipedia compilation and was not verified.

---

## Lower-priority or already-served areas (checked and deprioritised)

### Takeaway
Remittance costs and Roma statelessness are real, but they are either well served by fintech or largely resolved in North Macedonia specifically. Avoid them as a primary pitch unless the angle is narrow.

### Cited Findings
- Sending USD 200 to the WB6 costs 7.94% on average (Q2 2024), against 6.65% globally and the SDG target of 3%. About a quarter of services charge more than 10%. About 70% of WB6 remittances come from the EU. — [World Bank blog](https://blogs.worldbank.org/en/psd/remittances-and-the-high-cost-of-generosity)
- North Macedonia's remittances are only about 2.5% of GDP (2019) vs. about 16% for Kosovo. — [OECD](https://search.oecd.org/south-east-europe/programme/Friends-of-SEE-PPT-20Apr2022.pdf)
- Statelessness: UNHCR reported 275 stateless people at the end of 2023 (down from 453). North Macedonia was credited as the first country to resolve all known ex-Yugoslav statelessness cases. A July 2025 court ruling found systemic failures in implementing the Law on Unregistered Persons. — [UNHCR iBelong](https://unhcr.org/ibelong/?p=34580); [ERRC](https://www.errc.org/press-releases/major-court-win-for-roma-at-risk-of-statelessness-in-north-macedonia); [ENS/MYLA 2025](https://www.statelessness.eu/sites/default/files/2025-09/MYLA_ENS_CCPR_Submission_North_Macedonia.pdf)
- FITD grants: start-up grants cover up to 85% (about €30k cap), and the 2024 commercialisation call totalled €8M. The Smart Specialisation Strategy 2024–2027 prioritises smart agriculture, ICT and sustainable materials, with energy and tourism as horizontal priorities. — [EU YouthWiki](https://national-policies.eacea.ec.europa.eu/youthwiki/chapters/republic-of-north-macedonia/39-start-up-funding-for-young-entrepreneurs); [Western Balkans InfoHub](https://westernbalkans-infohub.eu/?p=4555)

### Inferences
- Remittances: Wise, Revolut and similar fintechs already serve EU-to-MK corridors (my own knowledge, not verified in this pass). This is a crowded space with high regulatory barriers (payment licences). It is a weak student-hackathon fit except as a feature, for example diaspora paying for elder care (Problem 5) or for land management (Problem 6).
- Roma documentation: the remaining problem is mainly legal and institutional, not software. A student product risks being tokenistic.
- FITD's Smart Specialisation priorities (smart agriculture, energy) align with Problems 1, 2, 6 and 7, which is good for a "fundability" slide.
- **Suggested ranking for originality, evidence and buildability (inference):**
  1. **Diaspora-linked elder care concierge** (Problem 5): strong emotion, a clear payer (diaspora in EUR), almost no competitors, easy to prototype.
  2. **Clean-heating switch and subsidy navigator** (Problems 1+2): very strong data, multiple payers (banks, installers, city), and differentiated from AirCare and Pulse.eco.
  3. **Abandoned-land lease matching for diaspora owners** (Problem 6): striking statistic (about 32% of arable land abandoned), an underserved space, and a map-based demo.
  4. **Smallholder pesticide spray-log and MRL passport** (Problem 7): concrete EU-border rejections, payer is exporters.
  5. **Women's inheritance and co-ownership navigator** (Problem 4): strong SDG 5.a story, weaker payer (donor-funded).
  6. **Non-revenue-water analytics for small utilities** (Problem 3): huge 60% statistic, B2G sales.
  7. Illegal dumps (Problem 10), wildfire volunteers (Problem 9), pharmacy stock finder (Problem 11), and declared seasonal gig work (Problems 8+12) are viable but more crowded, less monetisable or seasonal.

### Gaps
- No North Macedonia-specific remittance corridor price was retrieved.
- I did not run dedicated competitor searches for every idea, so "no competitor found" statements should be read as "none surfaced in this pass." Before final selection, check Pazar3.mk (land listings), local municipal citizen-reporting apps, and any MK eldercare startups.
- I found no official FITD beneficiary list to rule out overlap.
- Tourism seasonality was not researched (out of time budget).

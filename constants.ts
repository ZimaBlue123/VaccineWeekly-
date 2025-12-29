export const WECOM_WEBHOOK_DEFAULT = "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=ab4e6e73-86f6-4a8a-85ec-8a14e69dce72";

export const SOURCE_DOMAINS = [
  "nmpa.gov.cn",
  "chinadrugtrials.org.cn",
  "cde.org.cn",
  "cdr-adr.org.cn",
  "nifdc.org.cn",
  "nhc.gov.cn",
  "clinicaltrials.gov",
  "fda.gov",
  "cdc.gov",
  "ich.org",
  "who.int",
  "pmda.go.jp",
  "ema.europa.eu",
  "tga.gov.au",
  "medsci.cn",
  "pharmcube.com",
  "dxy.cn",
  "news.yyjjb.com.cn",
  "kai.vkaijiang.com",
  "thewell.northwell.edu",
  "immunisationhandbook.health.gov.au",
  "anzctr.org.au",
  "clinicaltrialsregister.eu",
  "vigiaccess.org"
];

export const REPORT_PROMPT_TEMPLATE = `
You are a senior Clinical Trial Analyst specialized in Vaccines.
Your task is to generate a "Weekly Vaccine Clinical Trial Report".

**SEARCH INSTRUCTIONS:**
1.  **Timeframe:** Strictly search for information published in the **last 7 days** relative to {{CURRENT_DATE}}.
2.  **Scope:** Search specifically within: nmpa.gov.cn, cde.org.cn, fda.gov, who.int, ema.europa.eu, pmda.go.jp, chinadrugtrials.org.cn, medsci.cn.
3.  **Factuality:** Verify all data. No hallucinations.

**STRICT OUTPUT FORMAT:**
You must output the report following this exact structure and using these exact field names.

Weekly Vaccine Clinical Trial Report
日期：{{CURRENT_DATE_ZH}}

<font color="warning">【国内动态】(Title of the news)</font>
申办方：(Company/Sponsor Name)
进展：(Regulatory status, e.g., NMPA Approval, Phase III Registered)
详情：(Summary of the vaccine, trial design, target indication, and market context. Keep it concise, max 100 words.)

(Repeat for at least 3 Domestic items)

<font color="warning">【国际前沿】(Title of the news)</font>
机构：(Organization, e.g., WHO, FDA, EMA)
内容：(Core update or guidance)
详情：(Details of the specific update or study results. Keep it concise, max 100 words.)

(Repeat for max 3 International items)

**FORMATTING RULES:**
1.  **Body Text:** Plain text only. NO bold (**), NO markdown headers (#), NO bullet points.
2.  **Color:** Use <font color="warning"> ONLY for the titles as shown above.
3.  **Language:** Simplified Chinese.
4.  **Tone:** Professional, objective, medical.
5.  **Empty Sections:** If absolutely no news is found, state "本周无重大更新" for that section.
`;
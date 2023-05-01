import { Result } from "./vulnType";
function resolveData(data: Result) {
  if (data.totalResults === 0) return [];
  return data.vulnerabilities.map((v) => {
    const cveId = v.cve.id;
    const description = v.cve.descriptions[0].value;
    const score = v.cve.metrics.cvssMetricV2[0].cvssData.baseScore;
    const severity = v.cve.metrics.cvssMetricV2[0].baseSeverity;
    const cwes = v.cve.weaknesses.map((w) => w.description[0].value);
    const confidentialityImpact =
      v.cve.metrics.cvssMetricV2[0].cvssData.confidentialityImpact;
    const integrityImpact =
      v.cve.metrics.cvssMetricV2[0].cvssData.integrityImpact;
    const availabilityImpact =
      v.cve.metrics.cvssMetricV2[0].cvssData.availabilityImpact;
    return {
      cveId,
      description,
      score,
      severity,
      cwes,
      confidentialityImpact,
      integrityImpact,
      availabilityImpact,
    };
  });
}
export async function fetchVulnsFromNVD(cpe: string) {
  const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?cpeName=${cpe}`;
  try {
    const res = await fetch(url);
    const data = (await res.json()) as Result;
    return resolveData(data);
  } catch (error) {
    let message = "Error fetching vulns from NVD";
    if (error instanceof Error) {
      message = error.message;
    }
    throw new Error(message);
  }
}
